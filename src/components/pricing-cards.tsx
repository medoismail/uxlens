"use client";

import { Check } from "lucide-react";
import type { PlanTier } from "@/lib/types";

/* Each Gumroad plan is a separate product with its own checkout URL.
   Next.js inlines NEXT_PUBLIC_ vars at build time — must be literal. */
const CHECKOUT_URLS: Record<string, string> = {
  starter: process.env.NEXT_PUBLIC_GUMROAD_STARTER || "",
  pro: process.env.NEXT_PUBLIC_GUMROAD_PRO || "",
  agency: process.env.NEXT_PUBLIC_GUMROAD_AGENCY || "",
};

const PLANS = [
  {
    name: "Starter",
    tier: "starter" as PlanTier,
    price: "$12",
    period: "/mo",
    audits: "50 audits/month",
    features: [
      "Everything in Free",
      "Unlimited AI vision heatmaps",
      "Visual design analysis (5 scores)",
      "Competitor benchmarking",
      "Strategic fixes & recommendations",
      "PDF export with heatmap",
    ],
    popular: false,
  },
  {
    name: "Pro",
    tier: "pro" as PlanTier,
    price: "$29",
    period: "/mo",
    audits: "200 audits/month",
    features: [
      "Everything in Starter",
      "AI chat assistant (50 msg/mo)",
      "UXLens Skill (MCP for Claude Code)",
      "Full audit history dashboard",
    ],
    popular: true,
  },
  {
    name: "Agency",
    tier: "agency" as PlanTier,
    price: "$79",
    period: "/mo",
    audits: "1,000 audits/month",
    features: [
      "Everything in Pro",
      "AI chat assistant (200 msg/mo)",
      "1,000 audits per month",
      "Team-scale usage",
    ],
    popular: false,
  },
];

interface PricingCardsProps {
  email?: string;
  currentPlan?: PlanTier;
}

export function PricingCards({ email, currentPlan }: PricingCardsProps) {
  function handleSelect(tier: string) {
    const baseUrl = CHECKOUT_URLS[tier];
    if (!baseUrl) return;
    const url = new URL(baseUrl);
    if (email) url.searchParams.set("email", email);
    window.open(url.toString(), "_blank");
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
      {PLANS.map((plan) => {
        const isCurrent = currentPlan === plan.tier;
        const isHigher = currentPlan && getPlanRank(plan.tier) > getPlanRank(currentPlan);
        const isLower = currentPlan && currentPlan !== "free" && getPlanRank(plan.tier) < getPlanRank(currentPlan);

        return (
          <div
            key={plan.name}
            className={`relative rounded-2xl p-6 transition-all duration-250 hover:shadow-elevation-2 ${
              isCurrent
                ? "shadow-elevation-1 bg-card"
                : plan.popular && !currentPlan
                ? "shadow-elevation-1 bg-card"
                : "shadow-elevation-1 bg-card/50"
            }`}
          >
            {/* Badge: Current Plan > Popular */}
            {isCurrent ? (
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider"
                  style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
                >
                  Current Plan
                </span>
              </div>
            ) : plan.popular && !currentPlan ? (
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center rounded-full bg-foreground px-2.5 py-0.5 text-[12px] font-medium text-background uppercase tracking-wider">
                  Popular
                </span>
              </div>
            ) : null}

            <p className="text-[14px] font-semibold text-foreground">{plan.name}</p>
            <div className="mt-3 flex items-baseline gap-0.5">
              <span className="text-3xl font-bold tracking-tight text-foreground">{plan.price}</span>
              <span className="text-[12px] text-muted-foreground/60">{plan.period}</span>
            </div>
            <p className="text-[12px] text-muted-foreground/50 mt-1.5">{plan.audits}</p>

            <ul className="mt-5 space-y-2.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                  <Check className="h-3 w-3 text-foreground/50 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            {isCurrent ? (
              <div
                className="flex items-center justify-center w-full mt-6 rounded-xl py-2.5 text-[14px] font-medium"
                style={{ color: "var(--brand)", background: "var(--brand-dim)" }}
              >
                Your Current Plan
              </div>
            ) : (
              <button
                onClick={() => handleSelect(plan.tier)}
                className={`w-full mt-6 rounded-xl py-2.5 text-[14px] font-medium transition-all duration-150 active:scale-[0.98] ${
                  isHigher
                    ? "bg-foreground text-background hover:opacity-90"
                    : isLower
                    ? "bg-background text-foreground/50 hover:text-foreground"
                    : plan.popular
                    ? "bg-foreground text-background hover:opacity-90"
                    : "bg-background text-foreground hover:shadow-elevation-1"
                }`}
              >
                {isHigher ? `Upgrade to ${plan.name}` : isLower ? `Switch to ${plan.name}` : `Get ${plan.name}`}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Get numeric rank for plan tier comparison */
function getPlanRank(plan: PlanTier): number {
  switch (plan) {
    case "free": return 0;
    case "starter": return 1;
    case "pro": return 2;
    case "agency": return 3;
    default: return 0;
  }
}
