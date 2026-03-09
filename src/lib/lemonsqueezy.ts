import { lemonSqueezySetup, listSubscriptions } from "@lemonsqueezy/lemonsqueezy.js";
import type { PlanTier } from "./types";

/** Initialize the LemonSqueezy SDK with the API key */
function initLemonSqueezy() {
  lemonSqueezySetup({
    apiKey: process.env.LEMONSQUEEZY_API_KEY!,
    onError: (error) => console.error("LemonSqueezy error:", error),
  });
}

export interface SubscriptionStatus {
  isActive: boolean;
  plan: PlanTier;
  customerId: string | null;
  subscriptionId: string | null;
  currentPeriodEnd: string | null;
}

/**
 * Check if an email has an active subscription in our LemonSqueezy store.
 * Queries the LemonSqueezy API directly — no database needed.
 */
export async function checkSubscriptionByEmail(
  email: string
): Promise<SubscriptionStatus> {
  initLemonSqueezy();

  const storeId = process.env.LEMONSQUEEZY_STORE_ID!;
  const inactive: SubscriptionStatus = {
    isActive: false,
    plan: "free",
    customerId: null,
    subscriptionId: null,
    currentPeriodEnd: null,
  };

  try {
    const response = await listSubscriptions({
      filter: { storeId, userEmail: email },
    });

    if (response.error) {
      console.error("LemonSqueezy API error:", response.error);
      return inactive;
    }

    const subscriptions = response.data?.data ?? [];

    // Find an active or trialing subscription
    const activeSub = subscriptions.find((sub) => {
      const status = sub.attributes.status;
      return status === "active" || status === "on_trial";
    });

    if (!activeSub) return inactive;

    // Map variant name to plan tier
    const variantName = (activeSub.attributes.variant_name || "").toLowerCase();
    let plan: PlanTier = "starter";
    if (variantName.includes("pro")) plan = "pro";
    if (variantName.includes("agency")) plan = "agency";

    return {
      isActive: true,
      plan,
      customerId: String(activeSub.attributes.customer_id),
      subscriptionId: String(activeSub.id),
      currentPeriodEnd: activeSub.attributes.renews_at,
    };
  } catch (error) {
    console.error("LemonSqueezy check failed:", error);
    return inactive;
  }
}
