"use client";

import { useState } from "react";
import { ArrowRight, Loader2, RotateCcw, User, Zap } from "lucide-react";
import { PricingCards } from "@/components/pricing-cards";
import type { UsageCheck } from "@/lib/types";

interface LimitReachedProps {
  usage: UsageCheck;
  onReset: () => void;
  onHumanAuditRequested: (url: string, email: string) => void;
  onSubscriptionVerified: (email: string) => void;
}

export function LimitReached({
  usage,
  onReset,
  onHumanAuditRequested,
  onSubscriptionVerified,
}: LimitReachedProps) {
  const [email, setEmail] = useState("");
  const [auditUrl, setAuditUrl] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [auditError, setAuditError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function handleVerifyAccess(e: React.FormEvent) {
    e.preventDefault();
    setVerifyError("");
    if (!emailRegex.test(email)) {
      setVerifyError("Please enter the email you subscribed with");
      return;
    }

    setIsVerifying(true);
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
        setVerifyError("No active subscription found for this email.");
      }
    } catch {
      setVerifyError("Could not verify subscription. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleRequestHumanAudit(e: React.FormEvent) {
    e.preventDefault();
    setAuditError("");
    if (!emailRegex.test(email)) {
      setAuditError("Please enter a valid email");
      return;
    }
    if (!auditUrl.trim()) {
      setAuditError("Please enter the URL to audit");
      return;
    }

    try {
      await fetch("/api/human-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: auditUrl.trim(), email: email.trim() }),
      });
    } catch {
      // Still proceed to confirmation
    }

    onHumanAuditRequested(auditUrl.trim(), email.trim());
  }

  return (
    <div className="flex flex-col items-center py-16 px-6 animate-fade-in relative z-[1]">
      {/* Header */}
      <div className="flex h-11 w-11 items-center justify-center rounded-full mb-4" style={{ background: "var(--brand-dim)" }}>
        <Zap className="h-5 w-5" style={{ color: "var(--brand)" }} />
      </div>

      <h2 className="text-xl font-semibold tracking-tight text-foreground text-center">
        You&apos;ve used all {usage.monthly_limit} free audits this month
      </h2>
      <p className="mt-2 text-[14px] text-foreground/45 text-center max-w-md">
        Upgrade your plan to keep analyzing pages, or get a detailed human review.
      </p>

      {/* Usage bar */}
      <div className="mt-5 flex items-center gap-3 rounded-lg border px-4 py-2.5" style={{ borderColor: "var(--border)", background: "var(--s1)" }}>
        <div className="flex-1 h-[4px] w-32 rounded-full overflow-hidden" style={{ background: "var(--s3)" }}>
          <div className="h-full rounded-full" style={{ background: "var(--brand)", width: "100%" }} />
        </div>
        <span className="text-[12px] font-mono text-foreground/40">
          {usage.audits_used}/{usage.monthly_limit} used
        </span>
      </div>

      {/* Pricing section */}
      <div className="w-full max-w-3xl mt-10">
        <p className="text-[12px] font-mono uppercase tracking-[2px] text-foreground/50 text-center mb-5">
          Choose a plan
        </p>
        <PricingCards email={email || undefined} />
      </div>

      {/* OR divider */}
      <div className="flex items-center gap-4 my-10 w-full max-w-lg text-foreground/40 text-[12px] uppercase tracking-[2px]">
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        or
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
      </div>

      {/* Human Audit CTA */}
      <div className="w-full max-w-lg rounded-xl border p-6" style={{ background: "var(--s1)", borderColor: "var(--border2)" }}>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "var(--brand)" }}>
            <User className="h-3.5 w-3.5" style={{ color: "var(--brand-fg)" }} />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold tracking-tight">Get a Human Audit</h3>
            <p className="text-[12px] text-foreground/55">Senior UX professional review — delivered in 2–3 business days</p>
          </div>
          <span className="ml-auto text-[18px] font-bold tracking-tight shrink-0">$300</span>
        </div>

        <form onSubmit={handleRequestHumanAudit} className="space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="focus-glow rounded-lg border transition-all duration-200" style={{ borderColor: "var(--border2)", background: "var(--background)" }}>
              <input
                type="text"
                placeholder="https://your-page.com"
                value={auditUrl}
                onChange={(e) => { setAuditUrl(e.target.value); if (auditError) setAuditError(""); }}
                className="h-10 w-full rounded-lg bg-transparent px-3.5 text-[12px] font-mono text-foreground placeholder:text-foreground/45 focus:outline-none"
              />
            </div>
            <div className="focus-glow rounded-lg border transition-all duration-200" style={{ borderColor: "var(--border2)", background: "var(--background)" }}>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (auditError) setAuditError(""); if (verifyError) setVerifyError(""); }}
                className="h-10 w-full rounded-lg bg-transparent px-3.5 text-[14px] text-foreground placeholder:text-foreground/45 focus:outline-none"
              />
            </div>
          </div>
          {auditError && <p className="text-[12px] text-destructive animate-fade-in pl-1">{auditError}</p>}
          <button
            type="submit"
            disabled={!email.trim() || !auditUrl.trim()}
            className="inline-flex w-full h-10 items-center justify-center gap-2 rounded-lg px-5 text-[14px] font-bold transition-all duration-150 hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
            style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
          >
            Request Human Audit
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>

      {/* Already subscribed? */}
      <div className="mt-8 text-center">
        <p className="text-[12px] text-foreground/50 mb-2.5">Already subscribed?</p>
        <form onSubmit={handleVerifyAccess} className="flex items-center gap-2 justify-center">
          <div className="focus-glow rounded-lg border transition-all duration-200" style={{ borderColor: "var(--border2)", background: "var(--s1)" }}>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (verifyError) setVerifyError(""); }}
              className="h-9 w-56 rounded-lg bg-transparent px-3.5 text-[12px] text-foreground placeholder:text-foreground/45 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isVerifying || !email.trim()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-4 text-[12px] font-medium text-foreground transition-all duration-150 hover:border-foreground/20 active:scale-[0.98] disabled:opacity-40"
            style={{ borderColor: "var(--border2)", background: "var(--s1)" }}
          >
            {isVerifying ? (
              <><Loader2 className="h-3 w-3 animate-spin" /> Checking</>
            ) : (
              "Verify Access"
            )}
          </button>
        </form>
        {verifyError && <p className="mt-2 text-[12px] text-destructive animate-fade-in">{verifyError}</p>}
      </div>

      {/* Back button */}
      <button
        onClick={onReset}
        className="mt-10 inline-flex items-center gap-2 rounded-lg border px-6 py-2.5 text-[14px] font-medium text-foreground transition-all duration-150 hover:border-foreground/20 active:scale-[0.98]"
        style={{ borderColor: "var(--border2)", background: "var(--s1)" }}
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Back to home
      </button>
    </div>
  );
}
