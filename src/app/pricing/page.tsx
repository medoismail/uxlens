import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/db/users";
import { getUserUsage } from "@/lib/server-usage";
import { PricingClient } from "@/components/pricing-client";
import type { PlanTier } from "@/lib/types";

export default async function PricingPage() {
  let currentPlan: PlanTier = "free";
  let auditsUsed = 0;
  let monthlyLimit = 5;

  try {
    const { userId } = await auth();
    if (userId) {
      const dbUser = await getUserByClerkId(userId);
      if (dbUser) {
        currentPlan = dbUser.plan;
        const usage = await getUserUsage(userId, dbUser.plan);
        auditsUsed = usage.auditsUsed;
        monthlyLimit = usage.monthlyLimit;
      }
    }
  } catch {
    // Auth not available — show as free user
  }

  return (
    <PricingClient
      currentPlan={currentPlan}
      auditsUsed={auditsUsed}
      monthlyLimit={monthlyLimit}
    />
  );
}
