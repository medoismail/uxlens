import { getSupabase } from "@/lib/supabase";
import type { PlanTier } from "@/lib/types";

export interface DbUser {
  id: string;
  clerk_id: string;
  email: string;
  plan: PlanTier;
  created_at: string;
}

/**
 * Create or update a user record (called from Clerk webhook on user.created).
 */
export async function upsertUser(clerkId: string, email: string): Promise<DbUser | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from("users")
    .upsert(
      { clerk_id: clerkId, email: email.toLowerCase() },
      { onConflict: "clerk_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("upsertUser error:", error);
    return null;
  }

  return data as DbUser;
}

/**
 * Get a user by their Clerk ID.
 */
export async function getUserByClerkId(clerkId: string): Promise<DbUser | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from("users")
    .select("*")
    .eq("clerk_id", clerkId)
    .single();

  if (error) return null;
  return data as DbUser;
}

/**
 * Get a user's plan tier.
 */
export async function getUserPlan(clerkId: string): Promise<PlanTier> {
  const user = await getUserByClerkId(clerkId);
  return (user?.plan as PlanTier) || "free";
}

/**
 * Update a user's plan (called from LemonSqueezy webhook).
 */
export async function updateUserPlan(email: string, plan: PlanTier): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  const { error } = await sb
    .from("users")
    .update({ plan })
    .eq("email", email.toLowerCase());

  if (error) {
    console.error("updateUserPlan error:", error);
  }
}
