"use client";

import { Check } from "lucide-react";
import type { PlanTier } from "@/lib/types";

/* Next.js inlines NEXT_PUBLIC_ vars at build time via static analysis.
   Dynamic access like process.env[key] does NOT work — must be literal. */
const CHECKOUT_URLS: Record<string, string> = {
  starter: process.env.NEXT_PUBLIC_LS_CHECKOUT_STARTER || "",
  pro: process.env.NEXT_PUBLIC_LS_CHECKOUT_PRO || "",
  agency: process.env.NEXT_PUBLIC_LS_CHECKOUT_AGENCY || "",
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
    checkoutKey: "starter",
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
    checkoutKey: "pro",
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
    checkoutKey: "agency",
    popular: false,
  },
];

interface PricingCardsProps {
  email?: string;
  currentPlan?: PlanTier;
}

export function PricingCards({ email, currentPlan }: PricingCardsProps) {
  function handleSelect(checkoutKey: string) {
    const baseUrl = CHECKOUT_URLS[checkoutKey];
    if (!baseUrl) return;
    const url = new URL(baseUrl);
    if (email) url.searchParams.set("checkout[email]", email);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    if (win.LemonSqueezy?.Url?.Open) {
      win.LemonSqueezy.Url.Open(url.toString());
    } else {
      window.open(url.toString(), "_blank");
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
      {PLANS.map((plan) => {
        const isCurrent = currentPlan === plan.tier;
        const isHigher = currentPlan && getPlanRank(plan.tier) > getPlanRank(currentPlan);
        const isLower = currentPlan && currentPlan !== "free" && getPlanRank(plan.tier) < getPlanRank(currentPlan);

        return (
          <div
            key={plan.name}
            className={`relative rounded-xl border p-5 transition-all duration-200 hover:shadow-elevation-2 ${
              isCurrent
                ? "border-foreground/20 shadow-elevation-1 bg-card"
                : plan.popular && !currentPlan
                ? "border-foreground/15 shadow-elevation-1 bg-card"
                : "border-border/40 bg-card/50 hover:border-border/60"
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
            <div className="mt-2 flex items-baseline gap-0.5">
              <span className="text-2xl font-bold tracking-tight text-foreground">{plan.price}</span>
              <span className="text-[12px] text-muted-foreground/60">{plan.period}</span>
            </div>
            <p className="text-[12px] text-muted-foreground/60 mt-1">{plan.audits}</p>

            <ul className="mt-4 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                  <Check className="h-3 w-3 text-foreground/50 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            {isCurrent ? (
              <div
                className="flex items-center justify-center w-full mt-5 rounded-lg py-2 text-[14px] font-medium border"
                style={{ borderColor: "var(--brand-glow)", color: "var(--brand)", background: "var(--brand-dim)" }}
              >
                Your Current Plan
              </div>
            ) : (
              <button
                onClick={() => handleSelect(plan.checkoutKey)}
                className={`w-full mt-5 rounded-lg py-2 text-[14px] font-medium transition-all duration-150 active:scale-[0.98] ${
                  isHigher
                    ? "bg-foreground text-background hover:opacity-90"
                    : isLower
                    ? "border border-border/50 bg-background text-foreground/50 hover:border-border hover:text-foreground"
                    : plan.popular
                    ? "bg-foreground text-background hover:opacity-90"
                    : "border border-border/50 bg-background text-foreground hover:border-border hover:shadow-elevation-1"
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
