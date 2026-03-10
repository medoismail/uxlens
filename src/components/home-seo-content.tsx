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
  FeatureSection,
} from "@/components/landing-mocks";

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
    <div
      className="border-y py-4"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="max-w-[960px] mx-auto px-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] text-foreground/35">
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
  );
}

/* ── Section Divider ── */

function Divider({ label }: { label: string }) {
  return (
    <div className="max-w-[960px] mx-auto px-7">
      <div className="flex items-center gap-4 text-foreground/15 text-[12px] uppercase tracking-[2px]">
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        {label}
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
      </div>
    </div>
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
    title: "AI audits 9 layers in 30 seconds",
    desc: "Our engine captures a screenshot, generates an attention heatmap, and runs your page through 9 diagnostic layers with self-critique.",
  },
  {
    num: "03",
    title: "Get your report with fixes",
    desc: "Prioritized conversion killers, trust scores, an AI-rewritten hero section, and a PDF you can share with your team.",
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
    features: ["Full 9-layer scores", "Attention heatmap", "Conversion killers", "Audit dashboard"],
    popular: false,
  },
  {
    name: "Starter",
    price: "$12",
    audits: "50 audits / month",
    features: ["Everything in Free", "Strategic fixes", "AI hero rewrite", "PDF export"],
    popular: false,
  },
  {
    name: "Pro",
    price: "$29",
    audits: "200 audits / month",
    features: ["Everything in Starter", "AI chat assistant", "Competitor analysis", "Priority queue"],
    popular: true,
  },
];

/* ── FAQ ── */

const FAQS = [
  {
    q: "What is a UX audit and why does it matter?",
    a: "A UX audit identifies usability issues, conversion barriers, and trust gaps on your website. UXLens automates this with a 9-layer AI diagnostic — delivering results in seconds instead of days.",
  },
  {
    q: "How does the AI analysis work?",
    a: "UXLens captures a full-page screenshot, generates an attention heatmap, then runs your content through 9 specialized audit layers with a self-critique loop. You get scores, conversion killers, and actionable fixes in under 30 seconds.",
  },
  {
    q: "Is it really free?",
    a: "Yes. The free plan includes 5 audits per month with full scores, heatmaps, conversion killers, and a personal dashboard. Paid plans unlock strategic fixes, PDF export, AI chat, and competitor analysis.",
  },
  {
    q: "What does the attention heatmap show?",
    a: "The heatmap overlays your screenshot with color-coded zones showing where visitors are most likely to focus — based on F-pattern analysis, CTA placement, and visual hierarchy.",
  },
  {
    q: "Can I save and share my reports?",
    a: "Yes. Sign in with Google or GitHub and every audit is saved to your dashboard. Paid plans let you export any report as a professionally formatted PDF.",
  },
  {
    q: "What makes UXLens different?",
    a: "UXLens combines visual analysis (heatmaps) with a structured 9-layer AI diagnostic and built-in self-critique. Each audit delivers fixes tailored to your page — not generic advice. Plus dashboard, PDF export, and AI chat make it a complete platform.",
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
      <section className="max-w-[960px] mx-auto px-7 pt-12 pb-16">
        <div className="text-center mb-8">
          <p className="text-[10px] font-mono uppercase tracking-[2px] text-foreground/25 mb-2">
            Sample Audit Report
          </p>
          <h2 className="text-[clamp(22px,3vw,32px)] font-bold tracking-[-0.5px] text-foreground">
            See exactly what you get
          </h2>
          <p className="mt-2 text-[13px] text-foreground/40 max-w-md mx-auto leading-relaxed">
            Every audit delivers a comprehensive report with scores, heatmaps,
            conversion killers, and actionable fixes.
          </p>
        </div>

        <ProductPreviewMock />
      </section>

      {/* ── How It Works ── */}
      <Divider label="How it works" />

      <section className="max-w-[960px] mx-auto px-7 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {STEPS.map((step) => (
            <div key={step.num} className="space-y-3">
              <span
                className="inline-block text-[12px] font-mono font-bold px-2 py-0.5 rounded"
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
              <p className="text-[12px] text-foreground/40 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature Sections (alternating layout) ── */}
      <Divider label="Features" />

      {/* Feature 1: Heatmap */}
      <FeatureSection
        label="Visual Analysis"
        headline="See where visitors actually look"
        description="Every audit generates an attention heatmap overlay on your real screenshot. Know instantly if your CTA, headline, and value proposition are visible — or getting ignored."
        bullets={[
          "F-pattern reading analysis",
          "CTA visibility scoring",
          "Visual hierarchy mapping",
        ]}
      >
        <HeatmapMock />
      </FeatureSection>

      {/* Feature 2: Score + Categories */}
      <FeatureSection
        label="9-Layer Diagnostic"
        headline="One score. Six dimensions. Zero guesswork."
        description="Your page gets a single UX score broken down across six critical dimensions. Each category shows exactly where you're strong and where you're bleeding conversions."
        bullets={[
          "Message Clarity & Cognitive Load",
          "Trust Signals & Contradictions",
          "Conversion Architecture & First Screen",
        ]}
        reversed
      >
        <div className="space-y-4">
          {/* Mini score ring */}
          <div
            className="flex items-center gap-4 rounded-xl border p-4"
            style={{
              background: "var(--s1)",
              borderColor: "var(--border2)",
            }}
          >
            <div className="relative w-14 h-14 shrink-0">
              <svg
                className="-rotate-90 w-full h-full"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50" cy="50" r="44" fill="none" strokeWidth="8"
                  style={{ stroke: "var(--s3)" }}
                />
                <circle
                  cx="50" cy="50" r="44" fill="none"
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 44}
                  strokeDashoffset={
                    2 * Math.PI * 44 - (82 / 100) * 2 * Math.PI * 44
                  }
                  className="animate-ring-fill"
                  style={{
                    stroke: "var(--score-high)",
                    "--ring-circumference": 2 * Math.PI * 44,
                    "--ring-offset":
                      2 * Math.PI * 44 - (82 / 100) * 2 * Math.PI * 44,
                  } as React.CSSProperties}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="text-[18px] font-bold tabular-nums"
                  style={{ color: "var(--score-high)" }}
                >
                  82
                </span>
              </div>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-foreground">
                Overall UX Score
              </p>
              <p className="text-[11px] text-foreground/40">
                Across 6 diagnostic categories
              </p>
            </div>
          </div>
          {/* Category bars */}
          <div className="space-y-2.5">
            {[
              { label: "Message Clarity", score: 88, color: "var(--brand)" },
              { label: "Cognitive Load", score: 72, color: "var(--accent-blue)" },
              { label: "Conversion Arch.", score: 79, color: "var(--accent-purple)" },
              { label: "Trust Signals", score: 70, color: "var(--score-high)" },
              { label: "Contradictions", score: 85, color: "var(--score-low)" },
              { label: "First Screen", score: 76, color: "var(--brand-strong)" },
            ].map((cat) => (
              <div key={cat.label} className="flex items-center gap-3">
                <span className="text-[11px] text-foreground/40 w-28 shrink-0">
                  {cat.label}
                </span>
                <div
                  className="flex-1 h-[5px] rounded-full overflow-hidden"
                  style={{ background: "var(--s3)" }}
                >
                  <div
                    className="h-full rounded-full animate-bar-width"
                    style={{
                      background: cat.color,
                      width: `${cat.score}%`,
                      "--bar-width": `${cat.score}%`,
                    } as React.CSSProperties}
                  />
                </div>
                <span
                  className="text-[12px] font-mono font-bold w-7 text-right"
                  style={{ color: cat.color }}
                >
                  {cat.score}
                </span>
              </div>
            ))}
          </div>
        </div>
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
        <div className="text-center mb-8">
          <h2 className="text-[clamp(22px,3vw,32px)] font-bold tracking-[-0.5px] text-foreground">
            Your hero section, rewritten by AI
          </h2>
          <p className="mt-2 text-[13px] text-foreground/40 max-w-lg mx-auto leading-relaxed">
            UXLens rewrites your headline, subheadline, and CTA based on
            conversion principles and your page&apos;s specific context. Before and
            after, side by side.
          </p>
        </div>
        <RewriteMock />
      </section>

      {/* ── Who Is It For ── */}
      <Divider label="Built for" />

      <section className="max-w-[960px] mx-auto px-7 py-12 sm:py-16">
        <div className="text-center mb-10">
          <h2 className="text-[clamp(22px,3vw,32px)] font-bold tracking-[-0.5px] text-foreground">
            Built for teams that ship
          </h2>
          <p className="mt-2 text-[13px] text-foreground/40 max-w-lg mx-auto leading-relaxed">
            Whether you&apos;re a solo founder or an agency managing dozens of
            clients, UXLens gives you the insights to fix conversion issues
            fast.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {USE_CASES.map((uc) => (
            <div
              key={uc.title}
              className="rounded-xl border p-5 transition-all duration-200 hover:border-[var(--border2)]"
              style={{
                borderColor: "var(--border)",
                background: "var(--s1)",
              }}
            >
              <uc.icon
                className="h-4 w-4 mb-3"
                style={{ color: "var(--brand)" }}
              />
              <h3 className="text-[14px] font-semibold text-foreground mb-1.5">
                {uc.title}
              </h3>
              <p className="text-[12px] text-foreground/35 leading-relaxed">
                {uc.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing Preview ── */}
      <Divider label="Pricing" />

      <section className="max-w-[960px] mx-auto px-7 py-12 sm:py-16">
        <div className="text-center mb-10">
          <h2 className="text-[clamp(22px,3vw,32px)] font-bold tracking-[-0.5px] text-foreground">
            Simple, transparent pricing
          </h2>
          <p className="mt-2 text-[13px] text-foreground/40 max-w-md mx-auto leading-relaxed">
            Start free. Upgrade when you need more audits and advanced features.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className="rounded-xl border p-5 relative"
              style={{
                borderColor: plan.popular
                  ? "var(--brand-glow)"
                  : "var(--border)",
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
              <p className="text-[13px] font-semibold text-foreground mb-1">
                {plan.name}
              </p>
              <p className="text-[28px] font-bold text-foreground tracking-tight">
                {plan.price}
                <span className="text-[12px] font-normal text-foreground/35">
                  /mo
                </span>
              </p>
              <p className="text-[11px] text-foreground/35 mb-4">
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

        <div className="text-center mt-6">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors hover:opacity-80"
            style={{ color: "var(--brand)" }}
          >
            Compare all plans
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="max-w-[960px] mx-auto px-7 pb-16">
        <div
          className="rounded-xl border p-8 text-center"
          style={{
            background: "var(--brand-dim)",
            borderColor: "var(--brand-glow)",
          }}
        >
          <h2 className="text-[20px] font-bold tracking-tight text-foreground mb-2">
            Stop guessing. Start auditing.
          </h2>
          <p className="text-[13px] text-foreground/40 mb-5 max-w-md mx-auto leading-relaxed">
            Run your first AI-powered UX audit in 30 seconds. Free, no credit
            card, no signup required.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-[13px] font-bold transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
            style={{
              background: "var(--brand)",
              color: "var(--brand-fg)",
            }}
          >
            Audit Your Page Now
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="max-w-[960px] mx-auto px-7 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-[clamp(22px,3vw,32px)] font-bold tracking-[-0.5px] text-foreground">
            Frequently asked questions
          </h2>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {FAQS.map((faq) => (
            <div key={faq.q}>
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
            </div>
          ))}
        </div>

        {/* SEO context */}
        <div
          className="max-w-2xl mx-auto mt-10 pt-8"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <p className="text-[12px] text-foreground/25 leading-relaxed text-center">
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
