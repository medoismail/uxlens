"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2, Sparkles, User, Zap } from "lucide-react";
import { Header } from "@/components/header";
import { PricingCards } from "@/components/pricing-cards";
import { Footer } from "@/components/footer";

export default function PricingPage() {
  const [email, setEmail] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifySuccess, setVerifySuccess] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setVerifyError("");
    setVerifySuccess("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setVerifyError("Please enter a valid email");
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
        setVerifySuccess(`Active ${data.plan} plan. You're all set!`);
      } else {
        setVerifyError("No active subscription found for this email.");
      }
    } catch {
      setVerifyError("Could not verify. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  }

  function handleHumanAudit() {
    const baseUrl = process.env.NEXT_PUBLIC_LS_CHECKOUT_HUMAN_AUDIT || "#";
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
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 mx-auto w-full max-w-[960px] px-6 relative z-[1]">
        {/* Hero */}
        <div className="flex flex-col items-center text-center pt-16 pb-12">
          <div className="flex h-11 w-11 items-center justify-center rounded-full mb-4" style={{ background: "var(--brand-dim)" }}>
            <Sparkles className="h-5 w-5" style={{ color: "var(--brand)" }} />
          </div>
          <h1 className="text-[clamp(28px,4vw,42px)] font-bold tracking-[-1px] text-foreground">
            Simple, transparent pricing
          </h1>
          <p className="mt-3 text-[13px] text-foreground/40 max-w-md leading-relaxed">
            Start free with 5 audits per month. Upgrade anytime for more capacity and deeper analysis.
          </p>
        </div>

        {/* Free tier + Paid plans */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 w-full">
          {/* Free Card */}
          <div className="relative rounded-xl border p-5 border-border/40 bg-card/50 hover:border-border/60 transition-all duration-200">
            <p className="text-[13px] font-semibold text-foreground">Free</p>
            <div className="mt-2 flex items-baseline gap-0.5">
              <span className="text-2xl font-bold tracking-tight text-foreground">$0</span>
              <span className="text-[12px] text-muted-foreground/60">/mo</span>
            </div>
            <p className="text-[12px] text-muted-foreground/60 mt-1">5 audits/month</p>

            <ul className="mt-4 space-y-2">
              {["Full UX audit", "Score breakdown", "Conversion issues", "Hero rewrite", "Confusion score"].map((f) => (
                <li key={f} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                  <Check className="h-3 w-3 text-foreground/30 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/"
              className="flex items-center justify-center w-full mt-5 rounded-lg py-2 text-[13px] font-medium border border-border/50 bg-background text-foreground hover:border-border hover:shadow-elevation-1 transition-all duration-150 active:scale-[0.98]"
            >
              Get Started Free
            </Link>
          </div>

          {/* Paid Plans */}
          <div className="sm:col-span-3">
            <PricingCards email={email || undefined} />
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-12 text-foreground/15 text-[9px] uppercase tracking-[2px]">
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          or
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>

        {/* Human Audit */}
        <div className="max-w-xl mx-auto rounded-xl border p-6" style={{ background: "var(--s1)", borderColor: "var(--border2)" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0" style={{ background: "var(--brand)" }}>
              <User className="h-4 w-4" style={{ color: "var(--brand-fg)" }} />
            </div>
            <div className="flex-1">
              <h2 className="text-[15px] font-semibold tracking-tight">Get a Human Audit</h2>
              <p className="text-[11px] text-foreground/35">Senior UX professional review — delivered in 2–3 business days</p>
            </div>
            <span className="text-[20px] font-bold tracking-tight shrink-0">$300</span>
          </div>
          <p className="text-[12px] text-foreground/40 leading-relaxed mb-4">
            A real UX professional analyzes your page in depth — not just what&apos;s wrong, but exactly how to fix it with annotated screenshots, priority matrix, and rewrite recommendations.
          </p>
          <button
            onClick={handleHumanAudit}
            className="inline-flex w-full h-10 items-center justify-center gap-2 rounded-lg px-5 text-[13px] font-bold transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
            style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
          >
            Request Human Audit
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Verify Access */}
        <div className="mt-10 mb-16 text-center">
          <p className="text-[11px] text-foreground/30 mb-3">Already subscribed?</p>
          <form onSubmit={handleVerify} className="flex items-center gap-2 justify-center">
            <div className="focus-glow rounded-lg border transition-all duration-200" style={{ borderColor: "var(--border2)", background: "var(--s1)" }}>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setVerifyError(""); setVerifySuccess(""); }}
                className="h-9 w-56 rounded-lg bg-transparent px-3.5 text-[12px] text-foreground placeholder:text-foreground/25 focus:outline-none"
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
          {verifyError && <p className="mt-2 text-[11px] text-destructive animate-fade-in">{verifyError}</p>}
          {verifySuccess && (
            <p className="mt-2 text-[11px] animate-fade-in" style={{ color: "var(--score-high)" }}>
              <Zap className="inline h-3 w-3 mr-1" />
              {verifySuccess}
            </p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
