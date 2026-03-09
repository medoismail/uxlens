"use client";

import { useState } from "react";
import { ArrowRight, Lock, Loader2 } from "lucide-react";
import { PricingCards } from "@/components/pricing-cards";

interface PaywallOverlayProps {
  onSubscriptionVerified: (email: string) => void;
}

export function PaywallOverlay({ onSubscriptionVerified }: PaywallOverlayProps) {
  const [email, setEmail] = useState("");
  const [showPricing, setShowPricing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    setShowPricing(true);
  }

  async function handleAlreadySubscribed() {
    setError("");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter the email you subscribed with");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/subscription/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.isActive) {
        onSubscriptionVerified(email);
      } else {
        setError("No active subscription found for this email.");
      }
    } catch {
      setError("Could not verify subscription. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border/40 bg-gradient-to-b from-foreground/[0.015] to-transparent overflow-hidden">
      <div className="py-10 px-6">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
          {/* Icon */}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground/[0.05] mb-4">
            <Lock className="h-4 w-4 text-muted-foreground" />
          </div>

          <h3 className="text-base font-semibold text-foreground tracking-tight">
            Unlock the full report
          </h3>
          <p className="mt-1.5 text-[13px] text-muted-foreground max-w-xs">
            Get all issues, conversion analysis, actionable fixes, and detailed suggestions.
          </p>

          {!showPricing ? (
            <div className="w-full max-w-sm mt-6 space-y-3">
              <form onSubmit={handleContinue} className="focus-glow flex items-center rounded-xl border border-border/50 bg-background shadow-elevation-1 transition-all duration-200">
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
                  className="h-11 flex-1 rounded-xl bg-transparent px-4 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                />
                <div className="pr-1">
                  <button
                    type="submit"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-4 text-[12px] font-medium text-background transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
                  >
                    Continue
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </form>

              {error && <p className="text-[12px] text-destructive animate-fade-in">{error}</p>}

              <button
                type="button"
                onClick={handleAlreadySubscribed}
                disabled={isLoading}
                className="text-[12px] text-muted-foreground/60 hover:text-foreground transition-colors"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" /> Checking...
                  </span>
                ) : (
                  "Already subscribed? Verify access"
                )}
              </button>
            </div>
          ) : (
            <div className="w-full mt-6 animate-fade-in">
              <PricingCards email={email} />
              <button
                type="button"
                onClick={() => setShowPricing(false)}
                className="mt-4 text-[12px] text-muted-foreground/60 hover:text-foreground transition-colors"
              >
                Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
