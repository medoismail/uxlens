"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Sparkles, User, Crown, Loader2, CheckCircle2 } from "lucide-react";
import { Show, useAuth } from "@clerk/nextjs";
import { Header } from "@/components/header";
import { PricingCards } from "@/components/pricing-cards";
import { Footer } from "@/components/footer";
import type { PlanTier } from "@/lib/types";

interface PricingClientProps {
  currentPlan?: PlanTier;
  auditsUsed?: number;
  monthlyLimit?: number;
}

export function PricingClient({
  currentPlan = "free",
  auditsUsed = 0,
  monthlyLimit = 5,
}: PricingClientProps) {
  const { isSignedIn } = useAuth();

  const planLabel = currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1);
  const usagePercent = monthlyLimit > 0 ? Math.min(100, Math.round((auditsUsed / monthlyLimit) * 100)) : 0;
  const auditsRemaining = Math.max(0, monthlyLimit - auditsUsed);

  const [haUrl, setHaUrl] = useState("");
  const [haEmail, setHaEmail] = useState("");
  const [haError, setHaError] = useState("");
  const [haSending, setHaSending] = useState(false);
  const [haSent, setHaSent] = useState(false);

  async function handleHumanAudit(e: React.FormEvent) {
    e.preventDefault();
    setHaError("");
    if (!haUrl.trim()) { setHaError("Please enter a URL"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(haEmail)) { setHaError("Please enter a valid email"); return; }
    setHaSending(true);
    try {
      await fetch("/api/human-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: haUrl.trim(), email: haEmail.trim() }),
      });
      setHaSent(true);
    } catch {
      setHaError("Failed to send. Please try again.");
    } finally {
      setHaSending(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main id="main-content" className="flex-1 mx-auto w-full max-w-[960px] px-6 relative z-[1]">
        {/* Hero */}
        <div className="flex flex-col items-center text-center pt-16 pb-12">
          <div className="flex h-11 w-11 items-center justify-center rounded-full mb-4" style={{ background: "var(--brand-dim)" }}>
            <Sparkles className="h-5 w-5" style={{ color: "var(--brand)" }} />
          </div>
          <h1 className="text-[clamp(28px,4vw,42px)] font-bold tracking-[-1px] text-foreground">
            Simple, transparent pricing
          </h1>
          <p className="mt-3 text-[14px] text-foreground/40 max-w-md leading-relaxed">
            Start free with 5 audits per month. Upgrade for unlimited AI heatmaps, visual design analysis, strategic fixes, PDF export, and AI chat.
          </p>
        </div>

        {/* Current Plan & Usage Banner (signed-in users only) */}
        {isSignedIn && (
          <div
            className="rounded-xl border p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-4"
            style={{ borderColor: "var(--brand-glow)", background: "var(--brand-dim)" }}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0"
                style={{ background: "var(--brand)" }}
              >
                <Crown className="h-4 w-4" style={{ color: "var(--brand-fg)" }} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-semibold text-foreground">
                    {planLabel} Plan
                  </p>
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
                    style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
                  >
                    Current
                  </span>
                </div>
                <p className="text-[12px] text-foreground/50 mt-0.5">
                  {auditsRemaining} audits remaining this month
                </p>
              </div>
            </div>

            {/* Usage bar */}
            <div className="flex items-center gap-3 sm:w-[200px]">
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${usagePercent}%`,
                    background: usagePercent > 80 ? "#ef4444" : "var(--brand)",
                  }}
                />
              </div>
              <span className="text-[12px] font-medium text-foreground/50 shrink-0 tabular-nums">
                {auditsUsed}/{monthlyLimit}
              </span>
            </div>
          </div>
        )}

        {/* Free tier + Paid plans */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 w-full">
          {/* Free Card */}
          <div
            className={`relative rounded-2xl border p-6 transition-all duration-250 ${
              isSignedIn && currentPlan === "free"
                ? "border-foreground/20 shadow-elevation-1 bg-card"
                : "border-border/40 bg-card/50 hover:border-border/60"
            }`}
          >
            {isSignedIn && currentPlan === "free" && (
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider"
                  style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
                >
                  Current Plan
                </span>
              </div>
            )}
            <p className="text-[14px] font-semibold text-foreground">Free</p>
            <div className="mt-3 flex items-baseline gap-0.5">
              <span className="text-3xl font-bold tracking-tight text-foreground">$0</span>
              <span className="text-[12px] text-muted-foreground/60">/mo</span>
            </div>
            <p className="text-[12px] text-muted-foreground/50 mt-1.5">5 audits/month</p>

            <ul className="mt-5 space-y-2.5">
              {[
                "Full scores & 6 categories",
                "Heuristic evaluation (10 heuristics)",
                "Screenshot + 1 AI vision heatmap",
                "All conversion killers & quick wins",
                "Trust signal matrix",
                "Audit history dashboard",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                  <Check className="h-3 w-3 text-foreground/50 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            {isSignedIn && currentPlan === "free" ? (
              <div
                className="flex items-center justify-center w-full mt-6 rounded-xl py-2.5 text-[14px] font-medium border"
                style={{ borderColor: "var(--brand-glow)", color: "var(--brand)", background: "var(--brand-dim)" }}
              >
                Your Current Plan
              </div>
            ) : (
              <Link
                href="/"
                className="flex items-center justify-center w-full mt-6 rounded-xl py-2.5 text-[14px] font-medium border border-border/50 bg-background text-foreground hover:border-border hover:shadow-elevation-1 transition-all duration-150 active:scale-[0.98]"
              >
                Get Started Free
              </Link>
            )}
          </div>

          {/* Paid Plans */}
          <div className="sm:col-span-3">
            <PricingCards currentPlan={isSignedIn ? currentPlan : undefined} />
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-12 text-foreground/35 text-[12px] uppercase tracking-[2px]">
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          or
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>

        {/* Human Audit */}
        <div className="max-w-xl mx-auto rounded-2xl border p-7" style={{ background: "var(--s1)", borderColor: "var(--border2)" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0" style={{ background: "var(--brand)" }}>
              <User className="h-4 w-4" style={{ color: "var(--brand-fg)" }} />
            </div>
            <div className="flex-1">
              <h2 className="text-[15px] font-semibold tracking-tight">Get a Human Audit</h2>
              <p className="text-[12px] text-foreground/55">Senior UX professional review — delivered in 2–3 business days</p>
            </div>
            <span className="text-[20px] font-bold tracking-tight shrink-0">$300</span>
          </div>
          <p className="text-[12px] text-foreground/40 leading-relaxed mb-4">
            A real UX professional analyzes your page in depth — not just what&apos;s wrong, but exactly how to fix it with annotated screenshots, priority matrix, and rewrite recommendations.
          </p>
          {haSent ? (
            <div className="flex items-center gap-2 justify-center py-3 text-[14px] font-medium animate-fade-in" style={{ color: "var(--score-high)" }}>
              <CheckCircle2 className="h-4 w-4" /> Request sent! We&apos;ll be in touch within 2–3 days.
            </div>
          ) : (
            <form onSubmit={handleHumanAudit} className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="focus-glow rounded-lg border transition-all duration-200" style={{ borderColor: "var(--border2)", background: "var(--background)" }}>
                  <input type="text" placeholder="https://your-page.com" value={haUrl} onChange={(e) => { setHaUrl(e.target.value); if (haError) setHaError(""); }} className="h-10 w-full rounded-lg bg-transparent px-3.5 text-[12px] font-mono text-foreground placeholder:text-foreground/45 focus:outline-none" />
                </div>
                <div className="focus-glow rounded-lg border transition-all duration-200" style={{ borderColor: "var(--border2)", background: "var(--background)" }}>
                  <input type="email" placeholder="you@example.com" value={haEmail} onChange={(e) => { setHaEmail(e.target.value); if (haError) setHaError(""); }} className="h-10 w-full rounded-lg bg-transparent px-3.5 text-[14px] text-foreground placeholder:text-foreground/45 focus:outline-none" />
                </div>
              </div>
              {haError && <p className="text-[12px] text-destructive animate-fade-in pl-1">{haError}</p>}
              <button
                type="submit"
                disabled={!haUrl.trim() || !haEmail.trim() || haSending}
                className="inline-flex w-full h-10 items-center justify-center gap-2 rounded-lg px-5 text-[14px] font-bold transition-all duration-150 hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
                style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
              >
                {haSending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending...</> : <>Request Human Audit <ArrowRight className="h-3.5 w-3.5" /></>}
              </button>
            </form>
          )}
        </div>

        {/* Sign-in CTA for anonymous users */}
        <Show when="signed-out">
          <div className="mt-10 mb-16 text-center">
            <p className="text-[12px] text-foreground/50 mb-3">Sign in to manage your subscription</p>
            <Link
              href="/sign-in"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-4 text-[12px] font-medium text-foreground transition-all duration-150 hover:border-foreground/20 active:scale-[0.98]"
              style={{ borderColor: "var(--border2)", background: "var(--s1)" }}
            >
              Sign In
            </Link>
          </div>
        </Show>

        {/* Dashboard link for signed-in users */}
        <Show when="signed-in">
          <div className="mt-10 mb-16 text-center">
            <p className="text-[12px] text-foreground/50 mb-3">Manage your audits and subscription</p>
            <Link
              href="/dashboard"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-4 text-[12px] font-medium text-foreground transition-all duration-150 hover:border-foreground/20 active:scale-[0.98]"
              style={{ borderColor: "var(--border2)", background: "var(--s1)" }}
            >
              Go to Dashboard
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </Show>
      </main>

      <Footer />
    </div>
  );
}
