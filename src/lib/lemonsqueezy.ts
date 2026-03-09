import { lemonSqueezySetup, listSubscriptions } from "@lemonsqueezy/lemonsqueezy.js";
import type { PlanTier } from "./types";

/** Initialize the LemonSqueezy SDK with the API key */
function initLemonSqueezy() {
  lemonSqueezySetup({
    apiKey: process.env.LEMONSQUEEZY_API_KEY!,
    onError: (error) => console.error("LemonSqueezy error:", error),
  });
}

/**
 * Map variant_id (stable) to plan tier, with variantName fallback.
 * Configure env vars: LS_VARIANT_STARTER, LS_VARIANT_PRO, LS_VARIANT_AGENCY
 */
export function resolveplanFromVariant(variantId: string, variantName: string): PlanTier {
  // Prefer stable variant_id mapping from env vars
  if (variantId) {
    if (variantId === process.env.LS_VARIANT_AGENCY) return "agency";
    if (variantId === process.env.LS_VARIANT_PRO) return "pro";
    if (variantId === process.env.LS_VARIANT_STARTER) return "starter";
  }

  // Fallback to variant name matching
  const name = variantName.toLowerCase();
  if (name.includes("agency")) return "agency";
  if (name.includes("pro")) return "pro";
  return "starter";
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

    // Map variant to plan tier using stable variant_id with name fallback
    const variantId = String(activeSub.attributes.variant_id || "");
    const variantName = (activeSub.attributes.variant_name || "").toLowerCase();
    const plan = resolveplanFromVariant(variantId, variantName);

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
