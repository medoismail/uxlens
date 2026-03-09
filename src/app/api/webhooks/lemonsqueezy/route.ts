import { NextResponse } from "next/server";
import crypto from "crypto";
import { getRedis } from "@/lib/server-usage";
import { updateUserPlan } from "@/lib/db/users";
import type { PlanTier } from "@/lib/types";

/**
 * Webhook endpoint for LemonSqueezy subscription events.
 * Validates HMAC-SHA256 signature and stores subscription in Redis.
 *
 * Handles: subscription_created, subscription_updated, subscription_cancelled,
 *          subscription_resumed, subscription_expired, subscription_paused
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-signature") || "";
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

    if (!secret) {
      console.error("Missing LEMONSQUEEZY_WEBHOOK_SECRET");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    // Verify webhook signature
    const hmac = crypto.createHmac("sha256", secret);
    const digest = hmac.update(rawBody).digest("hex");

    // Timing-safe comparison (prevents timing attacks)
    const digestBuf = Buffer.from(digest, "hex");
    const sigBuf = Buffer.from(signature, "hex");
    if (digestBuf.length !== sigBuf.length || !crypto.timingSafeEqual(digestBuf, sigBuf)) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventName: string = payload.meta?.event_name ?? "";
    const attrs = payload.data?.attributes;
    const email: string | undefined = attrs?.user_email;
    const status: string | undefined = attrs?.status;
    const variantName: string = (attrs?.variant_name || "").toLowerCase();

    console.log(`[LemonSqueezy Webhook] ${eventName}`, {
      customerId: attrs?.customer_id,
      email,
      status,
      variantName,
    });

    // Determine plan tier from variant name
    let plan: PlanTier = "starter";
    if (variantName.includes("pro")) plan = "pro";
    if (variantName.includes("agency")) plan = "agency";

    // Store subscription in Redis
    if (email) {
      const r = getRedis();
      if (r) {
        const cacheKey = `uxlens:sub:${email.toLowerCase()}`;

        if (
          (eventName === "subscription_created" ||
            eventName === "subscription_updated" ||
            eventName === "subscription_resumed") &&
          (status === "active" || status === "on_trial")
        ) {
          // Active subscription — cache the plan for 7 days
          await r.set(cacheKey, plan, { ex: 60 * 60 * 24 * 7 });
          console.log(`[Webhook] Cached ${plan} plan for ${email}`);
          // Also update Supabase
          await updateUserPlan(email, plan);
        } else if (
          eventName === "subscription_cancelled" ||
          eventName === "subscription_expired" ||
          eventName === "subscription_paused"
        ) {
          // Inactive — set to free
          await r.set(cacheKey, "free", { ex: 60 * 60 * 24 * 7 });
          console.log(`[Webhook] Set ${email} to free (${eventName})`);
          // Also update Supabase
          await updateUserPlan(email, "free");
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
