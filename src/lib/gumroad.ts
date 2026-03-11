import type { PlanTier } from "./types";

/**
 * Resolve the plan tier from a Gumroad membership webhook or sale.
 *
 * Priority:
 *  1. Tier / variant name (for membership products with multiple tiers)
 *  2. Product name fallback (checks for agency/pro keywords)
 *  3. Default to "starter"
 *
 * Gumroad membership webhooks include tier info in the `variants` field
 * (JSON string like `{"Tier":"Pro"}`) or as a `variant_name` field.
 */
export function resolvePlanFromTier(
  tierName: string,
  productName: string
): PlanTier {
  // Primary: match on tier name (exact match from Gumroad membership tiers)
  if (tierName) {
    const tier = tierName.toLowerCase().trim();
    if (tier.includes("agency")) return "agency";
    if (tier.includes("pro")) return "pro";
    if (tier.includes("starter")) return "starter";
  }

  // Fallback: match on product name
  if (productName) {
    const name = productName.toLowerCase();
    if (name.includes("agency")) return "agency";
    if (name.includes("pro")) return "pro";
  }

  return "starter";
}

/**
 * Extract the tier name from Gumroad webhook form data.
 * Gumroad memberships send tier info as:
 *   - `variants` field: JSON like `{"Tier":"Pro"}` or `(Tier - Pro)`
 *   - `variant_name` field: direct tier name
 */
export function extractTierName(formData: FormData): string {
  // Try variant_name first (some webhook events)
  const variantName = (formData.get("variant_name") as string) || "";
  if (variantName) return variantName;

  // Try variants field (JSON or string format)
  const variants = (formData.get("variants") as string) || "";
  if (variants) {
    // Try JSON parse: {"Tier":"Pro"}
    try {
      const parsed = JSON.parse(variants);
      if (typeof parsed === "object" && parsed !== null) {
        // Look for any key that has the tier value
        const values = Object.values(parsed) as string[];
        if (values.length > 0) return values[0];
      }
    } catch {
      // Not JSON — try string format like "(Tier - Pro)"
      const match = variants.match(/[-–]\s*(.+)\)?$/);
      if (match) return match[1].trim().replace(/\)$/, "");
      // If it's just a plain string, use it directly
      return variants.trim();
    }
  }

  // Try recurrence field which sometimes contains tier info
  const recurrence = (formData.get("recurrence") as string) || "";
  if (recurrence) return recurrence;

  return "";
}

export interface SubscriptionStatus {
  isActive: boolean;
  plan: PlanTier;
  customerId: string | null;
  subscriptionId: string | null;
  currentPeriodEnd: string | null;
}

/**
 * Check if an email has an active subscription via the Gumroad API.
 * Uses the /v2/sales endpoint filtered by email.
 */
export async function checkSubscriptionByEmail(
  email: string
): Promise<SubscriptionStatus> {
  const accessToken = process.env.GUMROAD_ACCESS_TOKEN;
  const inactive: SubscriptionStatus = {
    isActive: false,
    plan: "free",
    customerId: null,
    subscriptionId: null,
    currentPeriodEnd: null,
  };

  if (!accessToken) {
    console.error("Missing GUMROAD_ACCESS_TOKEN");
    return inactive;
  }

  try {
    // Gumroad /v2/sales endpoint supports email filtering
    const url = new URL("https://api.gumroad.com/v2/sales");
    url.searchParams.set("access_token", accessToken);
    url.searchParams.set("email", email.toLowerCase());

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      console.error("Gumroad API error:", response.status, await response.text());
      return inactive;
    }

    const data = await response.json();
    if (!data.success || !data.sales?.length) return inactive;

    // Find a non-refunded, non-cancelled subscription sale
    // Sort by most recent first
    const sales = data.sales.sort(
      (a: { created_at: string }, b: { created_at: string }) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const activeSale = sales.find(
      (sale: {
        refunded: boolean;
        subscription_cancelled_at: string | null;
        subscription_ended_at: string | null;
        subscription_failed_at: string | null;
      }) =>
        !sale.refunded &&
        !sale.subscription_cancelled_at &&
        !sale.subscription_ended_at &&
        !sale.subscription_failed_at
    );

    if (!activeSale) return inactive;

    // For membership tiers, Gumroad API may return variant info
    const variantName = String(activeSale.variants || activeSale.variant_name || "");
    const productName = String(activeSale.product_name || "");
    const plan = resolvePlanFromTier(variantName, productName);

    return {
      isActive: true,
      plan,
      customerId: String(activeSale.email || ""),
      subscriptionId: String(activeSale.subscription_id || activeSale.id || ""),
      currentPeriodEnd: activeSale.subscription_duration
        ? activeSale.created_at
        : null,
    };
  } catch (error) {
    console.error("Gumroad check failed:", error);
    return inactive;
  }
}
