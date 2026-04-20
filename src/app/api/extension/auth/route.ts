import { NextResponse } from "next/server";
import { resolveClerkUserId } from "@/lib/extension-auth";
import { getUserByClerkId } from "@/lib/db/users";
import { getUserUsage } from "@/lib/server-usage";
import type { PlanTier } from "@/lib/types";

/**
 * GET /api/extension/auth
 * Returns user info, plan, and usage for the extension popup.
 * Auth: Bearer token (Clerk session token from extension).
 */
export async function GET(request: Request) {
  const clerkUserId = await resolveClerkUserId(request);
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getUserByClerkId(clerkUserId);
  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const plan = (dbUser.plan as PlanTier) || "free";
  const { auditsUsed, monthlyLimit } = await getUserUsage(clerkUserId, plan);

  return NextResponse.json({
    userId: clerkUserId,
    email: dbUser.email,
    plan,
    auditsUsed,
    monthlyLimit,
  });
}
