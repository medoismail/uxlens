import { NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Webhook endpoint for LemonSqueezy subscription events.
 * Validates HMAC-SHA256 signature and logs events.
 * Future: persist to database, send email notifications, etc.
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

    if (digest !== signature) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta?.event_name;

    console.log(`[LemonSqueezy Webhook] ${eventName}`, {
      customerId: payload.data?.attributes?.customer_id,
      email: payload.data?.attributes?.user_email,
      status: payload.data?.attributes?.status,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
