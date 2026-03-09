import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { upsertUser } from "@/lib/db/users";
import { getSupabase } from "@/lib/supabase";

/**
 * Clerk webhook handler.
 * On user.created / user.updated → upsert user in Supabase.
 * On user.deleted → delete user + cascade data (GDPR).
 */
export async function POST(request: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  // P0 FIX: Never process unverified payloads
  if (!WEBHOOK_SECRET) {
    console.error("[Clerk Webhook] CLERK_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
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

  // P1 FIX: Handle user.deleted for GDPR compliance
  if (eventType === "user.deleted") {
    const clerkId = data.id as string;
    if (clerkId) {
      await deleteUserData(clerkId);
      console.log(`[Clerk Webhook] Deleted user data for clerk_id: ${clerkId}`);
    }
  }

  return NextResponse.json({ received: true });
}

/**
 * Delete all user data from Supabase when Clerk account is deleted.
 * The audits table cascades to chat_messages via foreign key.
 */
async function deleteUserData(clerkId: string) {
  const sb = getSupabase();
  if (!sb) return;

  // Find the Supabase user
  const { data: user } = await sb
    .from("users")
    .select("id")
    .eq("clerk_id", clerkId)
    .single();

  if (!user) return;

  // Delete in order: chat_credits → audits (cascades chat_messages) → user
  await sb.from("chat_credits").delete().eq("user_id", user.id);
  await sb.from("audits").delete().eq("user_id", user.id);
  await sb.from("users").delete().eq("id", user.id);
}
