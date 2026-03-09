import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { upsertUser } from "@/lib/db/users";

/**
 * Clerk webhook handler.
 * On user.created or user.updated, upsert the user in Supabase.
 */
export async function POST(request: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    // If no webhook secret configured, accept but log
    console.warn("[Clerk Webhook] No CLERK_WEBHOOK_SECRET configured, processing without verification");

    try {
      const body = await request.json();
      return await handleClerkEvent(body);
    } catch (error) {
      console.error("[Clerk Webhook] Error:", error);
      return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
    }
  }

  // Verify the webhook signature using svix
  const headerPayload = Object.fromEntries(request.headers.entries());
  const svixHeaders = {
    "svix-id": headerPayload["svix-id"] || "",
    "svix-timestamp": headerPayload["svix-timestamp"] || "",
    "svix-signature": headerPayload["svix-signature"] || "",
  };

  const rawBody = await request.text();

  let payload: Record<string, unknown>;
  try {
    const wh = new Webhook(WEBHOOK_SECRET);
    payload = wh.verify(rawBody, svixHeaders) as Record<string, unknown>;
  } catch (err) {
    console.error("[Clerk Webhook] Invalid signature:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  return handleClerkEvent(payload);
}

async function handleClerkEvent(payload: Record<string, unknown>) {
  const eventType = payload.type as string;
  const data = payload.data as Record<string, unknown>;

  console.log(`[Clerk Webhook] Event: ${eventType}`);

  if (eventType === "user.created" || eventType === "user.updated") {
    const clerkId = data.id as string;
    const emailAddresses = data.email_addresses as Array<{
      email_address: string;
      id: string;
    }>;
    const primaryEmail = emailAddresses?.[0]?.email_address;

    if (clerkId && primaryEmail) {
      await upsertUser(clerkId, primaryEmail);
      console.log(`[Clerk Webhook] Upserted user: ${primaryEmail}`);
    }
  }

  return NextResponse.json({ received: true });
}
