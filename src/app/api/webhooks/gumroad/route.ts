import { NextResponse } from "next/server";
import { getRedis } from "@/lib/server-usage";
import { updateUserPlan } from "@/lib/db/users";
import { resolvePlanFromTier, extractTierName } from "@/lib/gumroad";

/**
 * Webhook endpoint for Gumroad subscription events.
 * Gumroad sends form-encoded POST bodies (not JSON).
 * Verification: seller_id must match GUMROAD_SELLER_ID env var.
 *
 * This handles a single membership product with multiple tiers
 * (Starter / Pro / Agency). Tier info is extracted from the
 * `variants` or `variant_name` form fields.
 *
 * resource_name values:
 *   sale, refund, cancellation, subscription_cancelled,
 *   subscription_ended, subscription_restarted, subscription_updated
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // Verify seller_id matches our store
    const sellerId = formData.get("seller_id") as string | null;
    const expectedSellerId = process.env.GUMROAD_SELLER_ID;

    if (!expectedSellerId) {
      console.error("Missing GUMROAD_SELLER_ID env var");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    if (sellerId !== expectedSellerId) {
      console.error("Invalid seller_id:", sellerId);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resourceName = (formData.get("resource_name") as string) || "";
    const email = (formData.get("email") as string) || "";
    const productName = (formData.get("product_name") as string) || "";
    const subscriptionId = (formData.get("subscription_id") as string) || "";

    // Extract tier name from variants/variant_name fields
    const tierName = extractTierName(formData);

    console.log(`[Gumroad Webhook] ${resourceName}`, {
      email,
      tierName,
      productName,
      subscriptionId,
    });

    if (!email) {
      console.error("[Gumroad Webhook] No email in payload");
      return NextResponse.json({ received: true });
    }

    // Determine plan tier from membership tier name
    const plan = resolvePlanFromTier(tierName, productName);

    const r = getRedis();
    const cacheKey = `uxlens:sub:${email.toLowerCase()}`;

    // Active subscription events
    if (
      resourceName === "sale" ||
      resourceName === "subscription_restarted" ||
      resourceName === "subscription_updated"
    ) {
      if (r) {
        await r.set(cacheKey, plan, { ex: 60 * 60 * 24 * 7 }); // 7 days
        console.log(`[Gumroad Webhook] Cached ${plan} plan for ${email}`);
      }
      await updateUserPlan(email, plan);
    }

    // Cancelled / ended / refunded events
    if (
      resourceName === "cancellation" ||
      resourceName === "subscription_cancelled" ||
      resourceName === "subscription_ended" ||
      resourceName === "refund"
    ) {
      if (r) {
        await r.set(cacheKey, "free", { ex: 60 * 60 * 24 * 7 });
        console.log(`[Gumroad Webhook] Set ${email} to free (${resourceName})`);
      }
      await updateUserPlan(email, "free");
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Gumroad webhook processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
