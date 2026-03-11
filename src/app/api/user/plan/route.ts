import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getRedis } from "@/lib/server-usage";
import { getUserPlan } from "@/lib/db/users";
import type { PlanTier } from "@/lib/types";

/**
 * GET /api/user/plan
 * Returns the authenticated user's plan from Redis or Gumroad.
 * Falls back to "free" if no subscription found.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ plan: "free" as PlanTier }, { status: 200 });
    }

    // First check Redis by Clerk userId
    const r = getRedis();
    if (r) {
      const clerkCacheKey = `uxlens:sub:clerk:${userId}`;
      const cachedPlan = await r.get<string>(clerkCacheKey);
      if (cachedPlan) {
        return NextResponse.json({ plan: cachedPlan as PlanTier });
      }
    }

    // Try to get the user's email and check by email
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;

    if (email && r) {
      const emailCacheKey = `uxlens:sub:${email.toLowerCase()}`;
      const cachedPlan = await r.get<string>(emailCacheKey);
      if (cachedPlan) {
        // Also cache by Clerk userId for faster lookups
        const clerkCacheKey = `uxlens:sub:clerk:${userId}`;
        await r.set(clerkCacheKey, cachedPlan, { ex: 60 * 60 * 24 * 7 });
        return NextResponse.json({ plan: cachedPlan as PlanTier });
      }
    }

    // Check Supabase for plan
    const dbPlan = await getUserPlan(userId);
    if (dbPlan !== "free") {
      // Cache in Redis for fast lookups
      if (r) {
        const clerkCacheKey = `uxlens:sub:clerk:${userId}`;
        await r.set(clerkCacheKey, dbPlan, { ex: 60 * 60 * 24 * 7 });
      }
      return NextResponse.json({ plan: dbPlan });
    }

    // If email found, check Gumroad directly as final fallback
    if (email) {
      try {
        const { checkSubscriptionByEmail } = await import("@/lib/gumroad");
        const status = await checkSubscriptionByEmail(email);
        if (status.isActive) {
          // Cache in Redis for both email and Clerk userId
          if (r) {
            const clerkCacheKey = `uxlens:sub:clerk:${userId}`;
            const emailCacheKey = `uxlens:sub:${email.toLowerCase()}`;
            await r.set(clerkCacheKey, status.plan, { ex: 60 * 60 * 24 * 7 });
            await r.set(emailCacheKey, status.plan, { ex: 60 * 60 * 24 * 7 });
          }
          return NextResponse.json({ plan: status.plan });
        }
      } catch {
        // Gumroad check failed, fall through to free
      }
    }

    return NextResponse.json({ plan: "free" as PlanTier });
  } catch (error) {
    console.error("Error fetching user plan:", error);
    return NextResponse.json({ plan: "free" as PlanTier });
  }
}
