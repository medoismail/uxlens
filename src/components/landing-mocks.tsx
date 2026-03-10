"use client";

import { Sparkles, Check } from "lucide-react";

/* ── Shared ── */

function MockContainer({
  children,
  className = "",
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl border overflow-hidden ${className}`}
      style={{ background: "var(--s1)", borderColor: "var(--border2)" }}
    >
      {glow && (
        <div
          className="absolute -top-16 -right-16 w-[180px] h-[180px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, var(--brand-glow) 0%, transparent 65%)",
          }}
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

function scoreColor(s: number) {
  if (s >= 75) return "var(--score-high)";
  if (s >= 50) return "var(--score-mid)";
  return "var(--score-low)";
}

/* ── Score Banner Mock ── */

const MOCK_SCORE = 82;
const MOCK_GRADE = "B+";
const MOCK_SUMMARY =
  "Strong value proposition with room to improve trust signals and reduce cognitive friction above the fold.";
const MOCK_FLAGS = [
  { text: "Weak social proof", style: { color: "var(--score-low)", borderColor: "oklch(0.647 0.176 17 / 20%)", background: "oklch(0.647 0.176 17 / 7%)" } },
  { text: "CTA below fold", style: { color: "var(--score-mid)", borderColor: "oklch(0.725 0.187 91 / 20%)", background: "oklch(0.725 0.187 91 / 7%)" } },
  { text: "Strong headline", style: { color: "var(--score-high)", borderColor: "oklch(0.623 0.178 145 / 20%)", background: "oklch(0.623 0.178 145 / 7%)" } },
];

export function ScoreBannerMock() {
  const circumference = 2 * Math.PI * 44;
  const dashOffset = circumference - (MOCK_SCORE / 100) * circumference;
  const dialColor = scoreColor(MOCK_SCORE);

  return (
    <div
      className="relative overflow-hidden rounded-[14px] border p-6 flex flex-col sm:flex-row gap-5 items-center"
      style={{ background: "var(--s1)", borderColor: "var(--border2)" }}
    >
      <div
        className="absolute -top-20 -right-20 w-[180px] h-[180px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, var(--brand-glow) 0%, transparent 65%)",
        }}
      />

      {/* Score dial */}
      <div className="relative w-20 h-20 shrink-0">
        <svg className="-rotate-90 w-full h-full" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="44" fill="none" strokeWidth="7"
            style={{ stroke: "var(--s3)" }}
          />
          <circle
            cx="50" cy="50" r="44" fill="none"
            strokeWidth="7" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="animate-ring-fill"
            style={{
              stroke: dialColor,
              "--ring-circumference": circumference,
              "--ring-offset": dashOffset,
            } as React.CSSProperties}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-[22px] font-bold tabular-nums leading-none"
            style={{ color: dialColor }}
          >
            {MOCK_SCORE}
          </span>
          <span className="text-[10px] uppercase tracking-[1px] text-foreground/35 mt-0.5">
            / 100
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 text-center sm:text-left">
        <h3 className="text-xl font-light tracking-tight mb-1">
          {MOCK_GRADE}
        </h3>
        <p className="text-[11px] text-foreground/50 leading-relaxed mb-2.5 max-w-[420px]">
          {MOCK_SUMMARY}
        </p>
        <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
          {MOCK_FLAGS.map((flag) => (
            <span
              key={flag.text}
              className="text-[10px] px-2 py-0.5 rounded-[5px] border"
              style={flag.style}
            >
              {flag.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Category Grid Mock ── */

const MOCK_CATEGORIES = [
  { label: "Message Clarity", score: 88, color: "var(--brand)", note: "Clear value prop with strong headline" },
  { label: "Cognitive Load", score: 72, color: "var(--accent-blue)", note: "Moderate density, simplify above fold" },
  { label: "Conversion Arch.", score: 79, color: "var(--accent-purple)", note: "Good CTA placement, add urgency" },
  { label: "Trust Signals", score: 70, color: "var(--score-high)", note: "Add testimonials and security badges" },
  { label: "Contradictions", score: 85, color: "var(--score-low)", note: "Messaging is mostly consistent" },
  { label: "First Screen", score: 76, color: "var(--brand-strong)", note: "Headline works, CTA needs visibility" },
];

export function CategoryGridMock() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {MOCK_CATEGORIES.map((cat) => (
        <div
          key={cat.label}
          className="rounded-[10px] border p-3"
          style={{ background: "var(--s1)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-[10px] text-foreground/40 tracking-wide">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: cat.color }}
              />
              {cat.label}
            </div>
            <span
              className="text-[15px] font-bold font-mono"
              style={{ color: cat.color }}
            >
              {cat.score}
            </span>
          </div>
          <div
            className="h-[3px] rounded-full overflow-hidden"
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
          <p className="text-[10px] text-foreground/30 mt-1.5 leading-snug line-clamp-1">
            {cat.note}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ── Heatmap Mock ── */

export function HeatmapMock() {
  return (
    <MockContainer glow>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[12px] font-semibold text-foreground">
            Attention Heatmap
          </h4>
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded"
            style={{ background: "var(--brand-dim)", color: "var(--brand)" }}
          >
            AI GENERATED
          </span>
        </div>

        {/* Stylized wireframe page with gradient heatmap overlay */}
        <div
          className="relative rounded-lg overflow-hidden"
          style={{
            background: "var(--s2)",
            aspectRatio: "16 / 10",
          }}
        >
          {/* Wireframe content shapes */}
          <div className="absolute inset-0 p-4 flex flex-col gap-3">
            {/* Nav bar */}
            <div className="flex items-center gap-2">
              <div className="h-2 w-10 rounded bg-foreground/8" />
              <div className="flex-1" />
              <div className="h-2 w-6 rounded bg-foreground/6" />
              <div className="h-2 w-6 rounded bg-foreground/6" />
              <div className="h-2 w-6 rounded bg-foreground/6" />
            </div>
            {/* Hero headline area */}
            <div className="flex flex-col items-center gap-2 mt-4">
              <div className="h-3 w-40 rounded bg-foreground/10" />
              <div className="h-5 w-56 rounded bg-foreground/12" />
              <div className="h-2.5 w-44 rounded bg-foreground/8" />
            </div>
            {/* CTA button */}
            <div className="flex justify-center mt-2">
              <div className="h-6 w-24 rounded-md bg-foreground/10" />
            </div>
            {/* Content blocks */}
            <div className="flex gap-3 mt-4">
              <div className="flex-1 h-12 rounded bg-foreground/5" />
              <div className="flex-1 h-12 rounded bg-foreground/5" />
              <div className="flex-1 h-12 rounded bg-foreground/5" />
            </div>
          </div>

          {/* Heatmap gradient overlays */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: [
                "radial-gradient(ellipse 45% 40% at 50% 25%, oklch(0.65 0.25 29 / 35%) 0%, transparent 100%)",
                "radial-gradient(ellipse 30% 25% at 50% 55%, oklch(0.72 0.19 75 / 28%) 0%, transparent 100%)",
                "radial-gradient(ellipse 50% 35% at 50% 80%, oklch(0.55 0.17 155 / 18%) 0%, transparent 100%)",
              ].join(", "),
            }}
          />
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-3">
          {[
            { color: "oklch(0.65 0.25 29)", label: "High attention" },
            { color: "oklch(0.72 0.19 75)", label: "Medium" },
            { color: "oklch(0.55 0.17 155)", label: "Low" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-1.5 text-[10px] text-foreground/35"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: item.color }}
              />
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </MockContainer>
  );
}

/* ── Chat Mock ── */

export function ChatMock() {
  return (
    <MockContainer glow>
      <div className="flex flex-col" style={{ maxHeight: "360px" }}>
        {/* Header */}
        <div
          className="flex items-center gap-2 px-4 py-3 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <Sparkles className="h-4 w-4" style={{ color: "var(--brand)" }} />
          <span className="text-[13px] font-semibold text-foreground">
            UXLens AI
          </span>
          <span
            className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded"
            style={{ background: "var(--brand-dim)", color: "var(--brand)" }}
          >
            47 left
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 px-4 py-3 flex flex-col gap-3 overflow-hidden">
          {/* User message */}
          <div className="flex justify-end">
            <div
              className="rounded-xl rounded-tr-sm px-3.5 py-2 text-[12px] max-w-[75%]"
              style={{
                background: "var(--brand)",
                color: "var(--brand-fg)",
              }}
            >
              What should I fix first?
            </div>
          </div>

          {/* AI message */}
          <div className="flex justify-start">
            <div
              className="rounded-xl rounded-tl-sm px-3.5 py-2 text-[12px] max-w-[85%] leading-relaxed text-foreground/70"
              style={{ background: "var(--s2)" }}
            >
              Based on your audit, the highest-impact fix is{" "}
              <strong className="text-foreground/90">
                adding social proof above the fold
              </strong>
              . Your trust signals score is 70 — adding 2-3 testimonials near
              the CTA could lift conversions by 15-20%.
            </div>
          </div>

          {/* User message */}
          <div className="flex justify-end">
            <div
              className="rounded-xl rounded-tr-sm px-3.5 py-2 text-[12px] max-w-[75%]"
              style={{
                background: "var(--brand)",
                color: "var(--brand-fg)",
              }}
            >
              Can you rewrite my CTA?
            </div>
          </div>
        </div>

        {/* Suggested questions */}
        <div
          className="px-4 py-2.5 border-t flex flex-wrap gap-1.5"
          style={{ borderColor: "var(--border)" }}
        >
          {["Explain my trust score", "Rewrite my headline"].map((q) => (
            <span
              key={q}
              className="text-[10px] px-2.5 py-1 rounded-full border text-foreground/35"
              style={{ borderColor: "var(--border)" }}
            >
              {q}
            </span>
          ))}
        </div>

        {/* Input bar */}
        <div
          className="px-4 py-3 border-t flex items-center gap-2"
          style={{ borderColor: "var(--border)" }}
        >
          <div
            className="flex-1 h-8 rounded-lg px-3 flex items-center text-[11px] text-foreground/20"
            style={{ background: "var(--s2)" }}
          >
            Ask about your audit...
          </div>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "var(--brand)" }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 2 11 13" />
              <path d="m22 2-7 20-4-9-9-4 20-7z" />
            </svg>
          </div>
        </div>
      </div>
    </MockContainer>
  );
}

/* ── Competitor Mock ── */

const COMP_DATA = [
  { name: "Your site", score: 82, highlight: true },
  { name: "competitor1.com", score: 71, highlight: false },
  { name: "competitor2.io", score: 65, highlight: false },
];

export function CompetitorMock() {
  return (
    <MockContainer glow>
      <div className="p-4">
        <p className="text-[10px] font-mono uppercase tracking-[2px] text-foreground/25 mb-4">
          Overall Score Comparison
        </p>

        <div className="flex flex-col gap-3">
          {COMP_DATA.map((c) => {
            const color = scoreColor(c.score);
            return (
              <div key={c.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[12px] ${c.highlight ? "font-semibold text-foreground" : "text-foreground/50"}`}
                  >
                    {c.name}
                  </span>
                  <span
                    className="text-[14px] font-bold font-mono"
                    style={{ color }}
                  >
                    {c.score}
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: "var(--s3)" }}
                >
                  <div
                    className="h-full rounded-full animate-bar-width"
                    style={{
                      background: color,
                      width: `${c.score}%`,
                      "--bar-width": `${c.score}%`,
                    } as React.CSSProperties}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="mt-4 pt-3 border-t text-[11px] text-foreground/35"
          style={{ borderColor: "var(--border)" }}
        >
          Average competitor score:{" "}
          <span className="font-mono font-medium text-foreground/50">68</span>
        </div>
      </div>
    </MockContainer>
  );
}

/* ── Rewrite Mock (Before / After) ── */

export function RewriteMock() {
  return (
    <MockContainer glow className="max-w-2xl mx-auto">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <h4 className="text-[13px] font-semibold text-foreground">
            Hero Rewrite
          </h4>
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded font-bold"
            style={{ background: "var(--brand-dim)", color: "var(--brand)" }}
          >
            AI OPTIMIZED
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Before */}
          <div
            className="rounded-xl border p-4"
            style={{ borderColor: "var(--border)", background: "var(--s2)" }}
          >
            <p className="text-[10px] font-mono uppercase tracking-[2px] text-foreground/25 mb-3">
              Before
            </p>
            <p className="text-[15px] font-semibold text-foreground/25 line-through leading-snug mb-2">
              Build Better Products
            </p>
            <p className="text-[11px] text-foreground/20 line-through leading-relaxed mb-3">
              We help teams create amazing experiences with our platform.
            </p>
            <span className="inline-block text-[11px] px-3 py-1.5 rounded-md border text-foreground/20 line-through border-foreground/10">
              Learn More
            </span>
          </div>

          {/* After */}
          <div
            className="rounded-xl border p-4"
            style={{
              borderColor: "var(--brand-glow)",
              background: "var(--s1)",
            }}
          >
            <p className="text-[10px] font-mono uppercase tracking-[2px] mb-3" style={{ color: "var(--brand)" }}>
              After
            </p>
            <p className="text-[15px] font-semibold text-foreground leading-snug mb-2">
              Ship Faster With AI-Powered Design Reviews
            </p>
            <p className="text-[11px] text-foreground/55 leading-relaxed mb-3">
              Get instant UX feedback on any page in 30 seconds. No manual
              audits, no waiting.
            </p>
            <span
              className="inline-block text-[11px] font-bold px-3 py-1.5 rounded-md"
              style={{
                background: "var(--brand)",
                color: "var(--brand-fg)",
              }}
            >
              Start Free Audit
            </span>
          </div>
        </div>
      </div>
    </MockContainer>
  );
}

/* ── Product Preview Mock (Composite Hero Visual) ── */

export function ProductPreviewMock() {
  return (
    <div className="relative">
      {/* Purple glow behind */}
      <div
        className="absolute -inset-8 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, var(--brand-glow) 0%, transparent 70%)",
        }}
      />

      <div className="relative perspective-tilt">
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: "var(--s1)", borderColor: "var(--border2)" }}
        >
          {/* Browser chrome */}
          <div
            className="flex items-center gap-2 px-4 py-2.5 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <div
              className="w-[9px] h-[9px] rounded-full"
              style={{ background: "#ff5f57" }}
            />
            <div
              className="w-[9px] h-[9px] rounded-full"
              style={{ background: "#ffbd2e" }}
            />
            <div
              className="w-[9px] h-[9px] rounded-full"
              style={{ background: "#28c840" }}
            />
            <span className="ml-2 text-[10px] font-mono text-foreground/25">
              uxlens.pro/audit/demo-landing-page
            </span>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-5 space-y-4">
            {/* Report header */}
            <div className="text-center mb-2">
              <p className="text-[10px] font-mono uppercase tracking-[2px] text-foreground/25 mb-1">
                9-Layer UX Audit Report
              </p>
              <p className="text-[14px] font-semibold text-foreground">
                demo-landing-page.com
              </p>
            </div>

            <ScoreBannerMock />
            <CategoryGridMock />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Feature Section Layout Helper ── */

interface FeatureSectionProps {
  label: string;
  headline: string;
  description: string;
  bullets: string[];
  children: React.ReactNode; // mock component
  reversed?: boolean;
  tier?: string;
}

export function FeatureSection({
  label,
  headline,
  description,
  bullets,
  children,
  reversed = false,
  tier,
}: FeatureSectionProps) {
  return (
    <section className="max-w-[960px] mx-auto px-7 py-12 sm:py-16">
      <div
        className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center`}
      >
        {/* Copy side */}
        <div className={`space-y-4 ${reversed ? "lg:order-2" : ""}`}>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-[2px] text-foreground/25">
              {label}
            </span>
            {tier && (
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold"
                style={{
                  background: "var(--brand-dim)",
                  color: "var(--brand)",
                }}
              >
                {tier}
              </span>
            )}
          </div>
          <h2 className="text-[clamp(22px,3vw,32px)] font-bold tracking-[-0.5px] text-foreground leading-tight">
            {headline}
          </h2>
          <p className="text-[13px] text-foreground/45 leading-relaxed max-w-md">
            {description}
          </p>
          <ul className="space-y-2 pt-1">
            {bullets.map((b) => (
              <li
                key={b}
                className="flex items-center gap-2 text-[12px] text-foreground/40"
              >
                <Check
                  className="h-3.5 w-3.5 shrink-0"
                  style={{ color: "var(--brand)" }}
                />
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* Mock side */}
        <div className={reversed ? "lg:order-1" : ""}>{children}</div>
      </div>
    </section>
  );
}
