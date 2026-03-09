"use client";

import { Check } from "lucide-react";

const PLANS = [
  {
    name: "Starter",
    price: "$12",
    period: "/mo",
    audits: "50 audits/month",
    features: ["Full UX audit", "Score breakdown", "Conversion issues", "Hero rewrite", "Confusion score"],
    checkoutEnv: "NEXT_PUBLIC_LS_CHECKOUT_STARTER",
    popular: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    audits: "200 audits/month",
    features: ["Everything in Starter", "Offer detection", "Confusing phrase analysis", "Quick fixes", "Detailed suggestions"],
    checkoutEnv: "NEXT_PUBLIC_LS_CHECKOUT_PRO",
    popular: true,
  },
  {
    name: "Agency",
    price: "$79",
    period: "/mo",
    audits: "1,000 audits/month",
    features: ["Everything in Pro", "Agency scale usage", "Extended recommendations", "Priority analysis"],
    checkoutEnv: "NEXT_PUBLIC_LS_CHECKOUT_AGENCY",
    popular: false,
  },
];

interface PricingCardsProps {
  email?: string;
}

export function PricingCards({ email }: PricingCardsProps) {
  function handleSelect(checkoutEnv: string) {
    const baseUrl = process.env[checkoutEnv] || "#";
    if (baseUrl === "#") return;
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
      {PLANS.map((plan) => (
        <div
          key={plan.name}
          className={`relative rounded-xl border p-5 transition-all duration-200 hover:shadow-elevation-2 ${
            plan.popular
              ? "border-foreground/15 shadow-elevation-1 bg-card"
              : "border-border/40 bg-card/50 hover:border-border/60"
          }`}
        >
          {plan.popular && (
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center rounded-full bg-foreground px-2.5 py-0.5 text-[10px] font-medium text-background uppercase tracking-wider">
                Popular
              </span>
            </div>
          )}

          <p className="text-[13px] font-semibold text-foreground">{plan.name}</p>
          <div className="mt-2 flex items-baseline gap-0.5">
            <span className="text-2xl font-bold tracking-tight text-foreground">{plan.price}</span>
            <span className="text-[12px] text-muted-foreground/60">{plan.period}</span>
          </div>
          <p className="text-[12px] text-muted-foreground/60 mt-1">{plan.audits}</p>

          <ul className="mt-4 space-y-2">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                <Check className="h-3 w-3 text-foreground/30 mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <button
            onClick={() => handleSelect(plan.checkoutEnv)}
            className={`w-full mt-5 rounded-lg py-2 text-[13px] font-medium transition-all duration-150 active:scale-[0.98] ${
              plan.popular
                ? "bg-foreground text-background hover:opacity-90"
                : "border border-border/50 bg-background text-foreground hover:border-border hover:shadow-elevation-1"
            }`}
          >
            Get {plan.name}
          </button>
        </div>
      ))}
    </div>
  );
}
