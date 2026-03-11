"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Target,
  Users,
  Briefcase,
  PenTool,
  Zap,
  Shield,
  Check,
} from "lucide-react";
import {
  ProductPreviewMock,
  HeatmapMock,
  ChatMock,
  CompetitorMock,
  RewriteMock,
  RadarChartMock,
  FeatureSection,
} from "@/components/landing-mocks";
import { ScrollReveal } from "@/components/scroll-reveal";

/* ── Social Proof Bar ── */

function SocialProofBar() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const c = new AbortController();
    fetch("/api/views", { method: "POST", signal: c.signal })
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.count === "number") setCount(d.count);
      })
      .catch(() => {});
    return () => c.abort();
  }, []);

  return (
    <ScrollReveal>
      <div
        className="border-y py-5"
        style={{ borderColor: "rgba(0,0,0,0.05)" }}
      >
        <div className="max-w-[960px] mx-auto px-7 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[12px] text-foreground/50">
          {count !== null && (
            <span className="flex items-center gap-1.5 font-medium text-foreground/50">
              <Users className="h-3.5 w-3.5" />
              {count.toLocaleString()}+ audits completed
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Zap className="h-3 w-3" style={{ color: "var(--brand)" }} />
            Results in under 30 seconds
          </span>
          <span className="flex items-center gap-1.5">
            <Shield className="h-3 w-3" style={{ color: "var(--score-high)" }} />
            Free to start — no credit card
          </span>
        </div>
      </div>
    </ScrollReveal>
  );
}

/* ── Section Divider ── */

function Divider({ label }: { label: string }) {
  return (
    <ScrollReveal className="max-w-[960px] mx-auto px-7">
      <div className="flex items-center gap-4 text-foreground/50 text-[12px] uppercase tracking-[2.5px] font-medium">
        <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.08)" }} />
        {label}
        <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.08)" }} />
      </div>
    </ScrollReveal>
  );
}

/* ── How It Works ── */

const STEPS = [
  {
    num: "01",
    title: "Paste any URL",
    desc: "Drop in a landing page URL. No signup needed for your first audit — just paste and go.",
  },
  {
    num: "02",
    title: "AI sees, analyzes & scores",
    desc: "Our engine captures a full-page screenshot, uses UXLens AI to generate an attention heatmap, runs a visual design analysis, and audits 10 diagnostic layers including Nielsen's heuristic evaluation.",
  },
  {
    num: "03",
    title: "Get your report with fixes",
    desc: "AI attention heatmap, visual design scores, prioritized conversion killers, trust scores, an AI-rewritten hero section, and a PDF you can share with your team.",
  },
];

/* ── Who Is It For ── */

const USE_CASES = [
  {
    icon: Target,
    title: "Startup Founders",
    desc: "Find every conversion barrier before spending on ads. Get a heatmap showing where visitors look, and fixes prioritized by impact.",
  },
  {
    icon: PenTool,
    title: "UX Designers & Freelancers",
    desc: "Run professional audits for client projects in seconds. Export polished PDF reports and discuss findings with the AI assistant.",
  },
  {
    icon: Briefcase,
    title: "Marketing Teams",
    desc: "Audit landing pages at scale. Track all audits on a shared dashboard, benchmark against competitors, and optimize conversion rates.",
  },
  {
    icon: Users,
    title: "Product Managers",
    desc: "Get data-driven UX insights without waiting for research. Visualize attention patterns and share PDF reports with stakeholders.",
  },
];

/* ── Pricing Preview ── */

const PLANS = [
  {
    name: "Free",
    price: "$0",
    audits: "5 audits / month",
    features: ["Full 10-layer scores", "Heuristic evaluation", "1 AI vision heatmap", "Audit dashboard"],
    popular: false,
  },
  {
    name: "Starter",
    price: "$12",
    audits: "50 audits / month",
    features: ["Everything in Free", "Unlimited AI heatmaps", "Visual design analysis", "Strategic fixes", "PDF export with heatmap"],
    popular: false,
  },
  {
    name: "Pro",
    price: "$29",
    audits: "200 audits / month",
    features: ["Everything in Starter", "AI chat assistant", "Competitor analysis", "Priority queue"],
    popular: true,
  },
  {
    name: "Agency",
    price: "$79",
    audits: "1,000 audits / month",
    features: ["Everything in Pro", "200 AI chat messages", "Priority analysis queue", "Team-scale volume"],
    popular: false,
  },
];

/* ── FAQ ── */

const FAQS = [
  {
    q: "What is a UX audit and why does it matter?",
    a: "A UX audit identifies usability issues, conversion barriers, and trust gaps on your website. UXLens automates this with a 10-layer AI diagnostic powered by UXLens AI v0.6 — including Nielsen's heuristic evaluation, delivering results in seconds instead of days.",
  },
  {
    q: "How does the AI analysis work?",
    a: "UXLens captures a full-page screenshot, sends it to UXLens AI for attention heatmap generation and visual design analysis, then runs your content through 10 specialized audit layers — including Nielsen's heuristic evaluation — with a self-critique loop. You get scores, heatmaps, visual analysis, and actionable fixes.",
  },
  {
    q: "Is it really free?",
    a: "Yes. The free plan includes 5 audits per month with full scores, 1 AI vision heatmap, conversion killers, and a personal dashboard. Paid plans unlock unlimited AI heatmaps, visual design analysis, strategic fixes, PDF export, AI chat, and competitor analysis.",
  },
  {
    q: "What does the AI attention heatmap show?",
    a: "UXLens AI analyzes your screenshot to predict where users will look. The result is a realistic gaussian heatmap overlay — warm colors (red, orange, yellow) indicate high attention areas, fading to transparent where attention is low. It simulates real eye-tracking data.",
  },
  {
    q: "Can I save and share my reports?",
    a: "Yes. Sign in with Google or GitHub and every audit is saved to your dashboard — including heatmap and visual analysis. Paid plans let you export any report as a professionally formatted PDF with the heatmap composite included.",
  },
  {
    q: "What makes UXLens different?",
    a: "UXLens is the only tool that combines AI vision analysis (real AI heatmaps, not fake patterns) with a structured 10-layer diagnostic, Nielsen's heuristic evaluation, and visual design scoring. Each audit delivers fixes tailored to your page — not generic advice. Plus dashboard, PDF export, AI chat, and competitor analysis make it a complete platform.",
  },
];

/* ────────────────────────────────────────────── */
/* ── Main Component ── */
/* ────────────────────────────────────────────── */

export function HomeSEOContent() {
  return (
    <div className="relative z-[1]">
      {/* ── Social Proof ── */}
      <SocialProofBar />

      {/* ── Product Preview (the big visual hero) ── */}
      <section className="max-w-[960px] mx-auto px-7 pt-14 pb-20">
        <ScrollReveal className="text-center mb-8">
          <p className="text-[10px] font-mono uppercase tracking-[2px] text-foreground/45 mb-2">
            Sample Audit Report
          </p>
          <h2 className="text-[clamp(22px,3vw,32px)] font-bold tracking-[-0.5px] text-foreground">
            See exactly what you get
          </h2>
          <p className="mt-2 text-[14px] text-foreground/40 max-w-md mx-auto leading-relaxed">
            Every audit delivers a comprehensive report with scores, heatmaps,
            conversion killers, and actionable fixes.
          </p>
        </ScrollReveal>

        <ScrollReveal>
          <ProductPreviewMock />
        </ScrollReveal>
      </section>

      {/* ── How It Works ── */}
      <Divider label="How it works" />

      <section className="max-w-[960px] mx-auto px-7 py-14 sm:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <ScrollReveal key={step.num} delay={i} className="space-y-3.5">
              <span
                className="inline-block text-[12px] font-mono font-bold px-2.5 py-1 rounded-md"
                style={{
                  background: "var(--brand-dim)",
                  color: "var(--brand)",
                }}
              >
                {step.num}
              </span>
              <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
                {step.title}
              </h3>
              <p className="text-[12px] text-foreground/55 leading-relaxed">
                {step.desc}
              </p>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Feature Sections (alternating layout) ── */}
      <Divider label="Features" />

      {/* Feature 1: AI Vision Heatmap */}
      <FeatureSection
        label="AI Vision Heatmap"
        headline="AI sees your page like a real user"
        description="UXLens AI analyzes your screenshot to generate a realistic gaussian attention heatmap — not a fake F-pattern overlay. Smooth, warm-colored blobs show exactly where users will look, just like real eye-tracking software."
        bullets={[
          "AI vision-powered eye tracking simulation",
          "Realistic gaussian heatmap (like Hotjar/Clarity)",
          "Visual design analysis with 5 scores",
        ]}
      >
        <HeatmapMock />
      </FeatureSection>

      {/* Feature 2: Score + Categories */}
      <FeatureSection
        label="10-Layer Diagnostic"
        headline="One score. Six dimensions. Zero guesswork."
        description="Your page gets a single UX score broken down across six critical dimensions. Each category shows exactly where you're strong and where you're bleeding conversions."
        bullets={[
          "Message Clarity & Cognitive Load",
          "Trust Signals & Contradictions",
          "Conversion Architecture & First Screen",
        ]}
        reversed
      >
        <RadarChartMock />
      </FeatureSection>

      {/* Feature 3: AI Chat */}
      <FeatureSection
        label="AI Assistant"
        headline="Ask AI anything about your results"
        description="The AI chat knows your page inside out. Ask follow-up questions, get implementation details, or brainstorm copy alternatives — all with full context from your audit."
        bullets={[
          "Context-aware answers about your page",
          "Copy suggestions on demand",
          "Implementation guidance & prioritization",
        ]}
        tier="Pro+"
      >
        <ChatMock />
      </FeatureSection>

      {/* Feature 4: Competitor Analysis */}
      <FeatureSection
        label="Competitive Intelligence"
        headline="Benchmark against your competitors"
        description="See how your UX stacks up against the two biggest players in your market. Category-by-category scoring reveals exactly where you can overtake them."
        bullets={[
          "Auto-detected competitors",
          "6-category comparison",
          "Actionable competitive advantages",
        ]}
        reversed
        tier="Pro+"
      >
        <CompetitorMock />
      </FeatureSection>

      {/* ── Before / After Rewrite ── */}
      <Divider label="AI Copy Optimization" />

      <section className="max-w-[960px] mx-auto px-7 py-12 sm:py-16">
        <ScrollReveal className="text-center mb-8">
          <h2 className="text-[clamp(22px,3vw,32px)] font-bold tracking-[-0.5px] text-foreground">
            Your hero section, rewritten by AI
          </h2>
          <p className="mt-2 text-[14px] text-foreground/40 max-w-lg mx-auto leading-relaxed">
            UXLens rewrites your headline, subheadline, and CTA based on
            conversion principles and your page&apos;s specific context. Before and
            after, side by side.
          </p>
        </ScrollReveal>
        <ScrollReveal>
          <RewriteMock />
        </ScrollReveal>
      </section>

      {/* ── Who Is It For ── */}
      <Divider label="Built for" />

      <section className="max-w-[960px] mx-auto px-7 py-12 sm:py-16">
        <ScrollReveal className="text-center mb-10">
          <h2 className="text-[clamp(22px,3vw,32px)] font-bold tracking-[-0.5px] text-foreground">
            Built for teams that ship
          </h2>
          <p className="mt-2 text-[14px] text-foreground/40 max-w-lg mx-auto leading-relaxed">
            Whether you&apos;re a solo founder or an agency managing dozens of
            clients, UXLens gives you the insights to fix conversion issues
            fast.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {USE_CASES.map((uc, i) => (
            <ScrollReveal key={uc.title} delay={i}>
              <div
                className="rounded-xl border p-6 transition-all duration-200 hover:border-[rgba(0,0,0,0.1)]"
                style={{
                  borderColor: "rgba(0,0,0,0.06)",
                  background: "var(--s1)",
                }}
              >
                <uc.icon
                  className="h-4 w-4 mb-3.5"
                  style={{ color: "var(--brand)" }}
                />
                <h3 className="text-[14px] font-semibold text-foreground mb-2">
                  {uc.title}
                </h3>
                <p className="text-[12px] text-foreground/55 leading-relaxed">
                  {uc.desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Pricing Preview ── */}
      <Divider label="Pricing" />

      <section className="max-w-[960px] mx-auto px-7 py-12 sm:py-16">
        <ScrollReveal className="text-center mb-10">
          <h2 className="text-[clamp(22px,3vw,32px)] font-bold tracking-[-0.5px] text-foreground">
            Simple, transparent pricing
          </h2>
          <p className="mt-2 text-[14px] text-foreground/40 max-w-md mx-auto leading-relaxed">
            Start free. Upgrade when you need more audits and advanced features.
          </p>
        </ScrollReveal>

        <ScrollReveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className="rounded-xl border p-6 relative"
              style={{
                borderColor: plan.popular
                  ? "var(--brand-glow)"
                  : "rgba(0,0,0,0.06)",
                background: plan.popular
                  ? "linear-gradient(135deg, var(--brand-dim), var(--s1))"
                  : "var(--s1)",
              }}
            >
              {plan.popular && (
                <span
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full"
                  style={{
                    background: "var(--brand)",
                    color: "var(--brand-fg)",
                  }}
                >
                  Popular
                </span>
              )}
              <p className="text-[14px] font-semibold text-foreground mb-1">
                {plan.name}
              </p>
              <p className="text-[28px] font-bold text-foreground tracking-tight">
                {plan.price}
                <span className="text-[12px] font-normal text-foreground/55">
                  /mo
                </span>
              </p>
              <p className="text-[12px] text-foreground/55 mb-4">
                {plan.audits}
              </p>
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 text-[12px] text-foreground/45"
                  >
                    <Check
                      className="h-3 w-3 shrink-0"
                      style={{ color: "var(--brand)" }}
                    />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        </ScrollReveal>

        <ScrollReveal className="text-center mt-6">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium transition-colors hover:opacity-80"
            style={{ color: "var(--brand)" }}
          >
            Compare all plans
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </ScrollReveal>
      </section>

      {/* ── CTA Banner ── */}
      <ScrollReveal className="max-w-[960px] mx-auto px-7 pb-20">
        <div
          className="rounded-2xl border p-10 text-center"
          style={{
            background: "var(--brand-dim)",
            borderColor: "rgba(76,44,255,0.08)",
          }}
        >
          <h2 className="text-[20px] font-bold tracking-tight text-foreground mb-2">
            Stop guessing. Start auditing.
          </h2>
          <p className="text-[14px] text-foreground/40 mb-5 max-w-md mx-auto leading-relaxed">
            Run your first AI-powered UX audit in 30 seconds. Free, no credit
            card, no signup required.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-[14px] font-bold transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
            style={{
              background: "var(--brand)",
              color: "var(--brand-fg)",
            }}
          >
            Audit Your Page Now
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </ScrollReveal>

      {/* ── FAQ ── */}
      <section className="max-w-[960px] mx-auto px-7 pb-20">
        <ScrollReveal className="text-center mb-10">
          <h2 className="text-[clamp(22px,3vw,32px)] font-bold tracking-[-0.5px] text-foreground">
            Frequently asked questions
          </h2>
        </ScrollReveal>

        <div className="max-w-2xl mx-auto space-y-6">
          {FAQS.map((faq) => (
            <ScrollReveal key={faq.q}>
              <h3 className="text-[14px] font-semibold text-foreground mb-2">
                {faq.q}
              </h3>
              <p className="text-[12px] text-foreground/40 leading-relaxed">
                {faq.a}
                {faq.q.includes("free") && (
                  <>
                    {" "}
                    <Link
                      href="/pricing"
                      className="underline underline-offset-2 hover:text-foreground/60 transition-colors"
                    >
                      View pricing plans
                    </Link>
                  </>
                )}
              </p>
            </ScrollReveal>
          ))}
        </div>

        {/* SEO context */}
        <div
          className="max-w-2xl mx-auto mt-10 pt-8"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <p className="text-[12px] text-foreground/45 leading-relaxed text-center">
            UXLens applies{" "}
            <a
              href="https://www.nngroup.com/articles/ten-usability-heuristics/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground/40 transition-colors"
            >
              established usability heuristics
            </a>{" "}
            through AI-powered analysis to help you build better websites.{" "}
            <Link
              href="/pricing"
              className="underline underline-offset-2 hover:text-foreground/40 transition-colors"
            >
              Compare plans
            </Link>{" "}
            or{" "}
            <Link
              href="/"
              className="underline underline-offset-2 hover:text-foreground/40 transition-colors"
            >
              start your free website audit
            </Link>{" "}
            today.
          </p>
        </div>
      </section>
    </div>
  );
}
