"use client";

import { Sparkles, Check, Link2, Share2, Copy } from "lucide-react";
import { ScrollReveal } from "@/components/scroll-reveal";

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
      className={`relative rounded-2xl shadow-elevation-2 overflow-hidden ${className}`}
      style={{ background: "var(--card)" }}
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

/* ════════════════════════════════════════════════════════════
   Executive Summary Mock (replaces ScoreBannerMock)
   — 5-card metric row matching new dashboard layout
   ════════════════════════════════════════════════════════════ */

const MOCK_SCORE = 82;
const MOCK_GRADE = "B+";

export function ExecutiveSummaryMock() {
  const circumference = 2 * Math.PI * 44;
  const dashOffset = circumference - (MOCK_SCORE / 100) * circumference;
  const dialColor = scoreColor(MOCK_SCORE);

  return (
    <div className="grid grid-cols-5 gap-2">
      {/* UX Score — large gauge card */}
      <div
        className="col-span-2 sm:col-span-1 dash-card rounded-xl shadow-elevation-1 p-3 flex flex-col items-center justify-center"
        style={{ background: "var(--s1)" }}
      >
        <div className="relative w-[52px] h-[52px] mb-1.5">
          <svg className="-rotate-90 w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="44" fill="none" strokeWidth="8"
              style={{ stroke: "var(--s3)" }}
            />
            <circle
              cx="50" cy="50" r="44" fill="none"
              strokeWidth="8" strokeLinecap="round"
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
              className="text-[16px] font-bold tabular-nums leading-none"
              style={{ color: dialColor }}
            >
              {MOCK_SCORE}
            </span>
          </div>
        </div>
        <span className="text-[10px] text-foreground/40 font-medium">UX Score</span>
        <span className="text-[10px] text-foreground/45">{MOCK_GRADE}</span>
      </div>

      {/* Conv. Risk */}
      <MiniMetricCard label="Conv. Risk" value={22} suffix="%" color={scoreColor(78)} />
      {/* Readability */}
      <MiniMetricCard label="Readability" value={72} suffix="%" color={scoreColor(72)} />
      {/* Trust */}
      <MiniMetricCard label="Trust" value={70} suffix="/100" color={scoreColor(70)} />
      {/* Complexity */}
      <div
        className="dash-card rounded-xl shadow-elevation-1 p-2.5 flex flex-col items-center justify-center text-center"
        style={{ background: "var(--s1)" }}
      >
        <span className="text-[14px] font-bold mb-0.5" style={{ color: "var(--score-mid)" }}>Medium</span>
        <span className="text-[10px] text-foreground/40 font-medium">Complexity</span>
      </div>
    </div>
  );
}

function MiniMetricCard({ label, value, suffix = "", color }: { label: string; value: number; suffix?: string; color: string }) {
  return (
    <div
      className="dash-card rounded-xl shadow-elevation-1 p-2.5 flex flex-col items-center justify-center text-center"
      style={{ background: "var(--s1)" }}
    >
      <div className="flex items-baseline gap-0.5 mb-0.5">
        <span className="text-[16px] font-bold tabular-nums" style={{ color }}>{value}</span>
        {suffix && <span className="text-[10px] text-foreground/50">{suffix}</span>}
      </div>
      <span className="text-[10px] text-foreground/40 font-medium">{label}</span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Bar Chart Mock (replaces CategoryGridMock)
   — Horizontal bars sorted by score ascending (worst first)
   ════════════════════════════════════════════════════════════ */

const MOCK_CATEGORIES = [
  { label: "Trust Signals", score: 70, color: "oklch(0.62 0.15 160)" },
  { label: "Cognitive Load", score: 72, color: "oklch(0.62 0.14 245)" },
  { label: "First Screen", score: 76, color: "oklch(0.62 0.14 200)" },
  { label: "Conversion Arch.", score: 79, color: "oklch(0.65 0.16 55)" },
  { label: "Contradictions", score: 85, color: "oklch(0.62 0.16 15)" },
  { label: "Message Clarity", score: 88, color: "oklch(0.62 0.18 275)" },
];

export function BarChartMock() {
  return (
    <div className="flex flex-col gap-2">
      {MOCK_CATEGORIES.map((cat) => (
        <div key={cat.label} className="flex items-center gap-2">
          <span className="text-[10px] text-foreground/40 w-[90px] sm:w-[110px] shrink-0 truncate">
            {cat.label}
          </span>
          <div
            className="flex-1 h-[6px] rounded-full overflow-hidden"
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
            className="text-[12px] font-bold font-mono w-6 text-right"
            style={{ color: cat.color }}
          >
            {cat.score}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Metric Grid Mock (2×3 compact cards with sparklines)
   ════════════════════════════════════════════════════════════ */

const MOCK_METRIC_GRID = [
  { label: "Clarity", score: 88, color: "oklch(0.62 0.18 275)" },
  { label: "Cog. Load", score: 72, color: "oklch(0.62 0.14 245)" },
  { label: "Conv.", score: 79, color: "oklch(0.65 0.16 55)" },
  { label: "Trust", score: 70, color: "oklch(0.62 0.15 160)" },
  { label: "Contra.", score: 85, color: "oklch(0.62 0.16 15)" },
  { label: "1st Screen", score: 76, color: "oklch(0.62 0.14 200)" },
];

const SPARK_PATTERNS = [
  [0.25, 0.50, 1.00, 0.60, 0.80],
  [0.80, 0.55, 0.30, 0.65, 1.00],
  [0.40, 1.00, 0.70, 0.35, 0.55],
  [0.60, 0.40, 0.75, 1.00, 0.50],
  [1.00, 0.65, 0.40, 0.55, 0.30],
  [0.35, 0.70, 0.55, 1.00, 0.75],
];
function generateSparkData(score: number, index: number = 0): number[] {
  const s = score / 100;
  const pattern = SPARK_PATTERNS[index % SPARK_PATTERNS.length];
  return pattern.map(m => Math.min(1, Math.max(0.08, s * m)));
}

export function MetricGridMock() {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {MOCK_METRIC_GRID.map((cat, idx) => {
        const sparkData = generateSparkData(cat.score, idx);
        return (
          <div
            key={cat.label}
            className="dash-card rounded-lg shadow-elevation-1 p-2.5"
            style={{ background: "var(--s1)" }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-foreground/55 truncate">{cat.label}</span>
              <span
                className="text-[14px] font-bold font-mono"
                style={{ color: cat.color }}
              >
                {cat.score}
              </span>
            </div>
            {/* Mini sparkline */}
            <div className="flex items-end gap-[2px] h-[14px]">
              {sparkData.map((v, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{
                    background: cat.color,
                    height: `${v * 100}%`,
                    opacity: 0.4 + v * 0.6,
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Radar Chart Mock (static SVG for Feature 2 section)
   — 6-axis spider chart matching the dashboard RadarChart
   ════════════════════════════════════════════════════════════ */

export function RadarChartMock() {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 72;
  const labels = ["Clarity", "Cog. Load", "Conv.", "Trust", "Contra.", "1st Screen"];
  const scores = [88, 72, 79, 70, 85, 76];

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
    const r = (value / 100) * maxR;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const gridLevels = [25, 50, 75, 100];

  return (
    <MockContainer glow>
      <div className="p-4 flex flex-col items-center">
        <div className="flex items-center justify-between w-full mb-3">
          <h4 className="text-[12px] font-semibold text-foreground">
            UX Score Radar
          </h4>
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded"
            style={{ background: "var(--brand-dim)", color: "var(--brand)" }}
          >
            6 DIMENSIONS
          </span>
        </div>

        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="animate-radar"
        >
          {/* Grid polygons */}
          {gridLevels.map((level) => {
            const pts = Array.from({ length: 6 }, (_, i) => getPoint(i, level));
            return (
              <polygon
                key={level}
                points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="none"
                stroke="var(--s3)"
                strokeWidth="1"
              />
            );
          })}
          {/* Axis lines */}
          {Array.from({ length: 6 }, (_, i) => {
            const p = getPoint(i, 100);
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={p.x}
                y2={p.y}
                stroke="var(--s3)"
                strokeWidth="1"
              />
            );
          })}
          {/* Data polygon */}
          <polygon
            points={scores
              .map((s, i) => {
                const p = getPoint(i, s);
                return `${p.x},${p.y}`;
              })
              .join(" ")}
            fill="oklch(0.504 0.282 276.1 / 12%)"
            stroke="var(--brand)"
            strokeWidth="2"
          />
          {/* Data dots */}
          {scores.map((s, i) => {
            const p = getPoint(i, s);
            return <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--brand)" />;
          })}
          {/* Labels */}
          {labels.map((label, i) => {
            const p = getPoint(i, 118);
            return (
              <text
                key={i}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[10px] fill-foreground/35"
              >
                {label}
              </text>
            );
          })}
        </svg>

        {/* Bottom score summary */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-[10px] text-foreground/55">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: "var(--brand)" }}
            />
            Your score
          </div>
          <span className="text-[12px] font-mono font-bold" style={{ color: scoreColor(82) }}>
            82 / 100
          </span>
        </div>
      </div>
    </MockContainer>
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
              className="flex items-center gap-1.5 text-[10px] text-foreground/55"
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
          <span className="text-[14px] font-semibold text-foreground">
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
              className="text-[10px] px-2.5 py-1 rounded-full border text-foreground/55 cursor-pointer hover:text-foreground/70 hover:border-foreground/20 transition-colors"
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
            className="flex-1 h-8 rounded-lg px-3 flex items-center text-[12px] text-foreground/40 cursor-text"
            style={{ background: "var(--s2)" }}
          >
            Ask about your audit...
          </div>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
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
        <p className="text-[10px] font-mono uppercase tracking-[2px] text-foreground/45 mb-4">
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
          className="mt-4 pt-3 border-t text-[12px] text-foreground/55"
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
          <h4 className="text-[14px] font-semibold text-foreground">
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
            className="rounded-xl shadow-elevation-1 p-4"
            style={{ background: "var(--s2)" }}
          >
            <p className="text-[10px] font-mono uppercase tracking-[2px] text-foreground/45 mb-3">
              Before
            </p>
            <p className="text-[15px] font-semibold text-foreground/45 line-through leading-snug mb-2">
              Build Better Products
            </p>
            <p className="text-[12px] text-foreground/40 line-through leading-relaxed mb-3">
              We help teams create amazing experiences with our platform.
            </p>
            <span className="inline-block text-[12px] px-3 py-1.5 rounded-md border text-foreground/40 line-through border-foreground/10 cursor-pointer">
              Learn More
            </span>
          </div>

          {/* After */}
          <div
            className="rounded-xl shadow-elevation-1 p-4"
            style={{
              background: "var(--s1)",
            }}
          >
            <p className="text-[10px] font-mono uppercase tracking-[2px] mb-3" style={{ color: "var(--brand)" }}>
              After
            </p>
            <p className="text-[15px] font-semibold text-foreground leading-snug mb-2">
              Ship Faster With AI-Powered Design Reviews
            </p>
            <p className="text-[12px] text-foreground/55 leading-relaxed mb-3">
              Get instant UX feedback on any page in 30 seconds. No manual
              audits, no waiting.
            </p>
            <span
              className="inline-block text-[12px] font-bold px-3 py-1.5 rounded-md cursor-pointer hover:opacity-90 transition-opacity"
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

/* ════════════════════════════════════════════════════════════
   Product Preview Mock (Composite Hero Visual)
   — Updated to show new analytics dashboard layout
   ════════════════════════════════════════════════════════════ */

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
          className="rounded-2xl shadow-elevation-2 overflow-hidden"
          style={{ background: "var(--card)" }}
        >
          {/* Browser chrome */}
          <div
            className="flex items-center gap-2 px-4 py-2.5"
            style={{ background: "var(--s1)" }}
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
            <span className="ml-2 text-[10px] font-mono text-foreground/45">
              uxlens.pro/audit/demo-landing-page
            </span>
          </div>

          {/* Dashboard Content */}
          <div className="p-4 sm:p-5 space-y-3">
            {/* Report header */}
            <div className="text-center mb-1">
              <p className="text-[10px] text-foreground/45 mb-1">
                Diagnostic Engine v0.7 — UX Dashboard
              </p>
              <p className="text-[14px] font-semibold text-foreground">
                demo-landing-page.com
              </p>
            </div>

            {/* Executive Summary Row */}
            <ExecutiveSummaryMock />

            {/* Category Scores */}
            <BarChartMock />
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
        <ScrollReveal className={`space-y-4 ${reversed ? "lg:order-2" : ""}`}>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-foreground/45">
              {label}
            </span>
            {tier && (
              <span
                className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold"
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
          <p className="text-[14px] text-foreground/45 leading-relaxed max-w-md">
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
        </ScrollReveal>

        {/* Mock side */}
        <ScrollReveal delay={1} className={reversed ? "lg:order-1" : ""}>
          {children}
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   Share Report Mock — Interactive share link animation
   ════════════════════════════════════════════════════════════ */

export function ShareMock() {
  return (
    <MockContainer glow>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="h-4 w-4" style={{ color: "var(--brand)" }} />
          <h4 className="text-[14px] font-semibold text-foreground">
            Share Report
          </h4>
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded font-bold"
            style={{ background: "var(--brand-dim)", color: "var(--brand)" }}
          >
            1-CLICK
          </span>
        </div>

        {/* Share link bar */}
        <div
          className="flex items-center gap-2 rounded-xl p-3 mb-4"
          style={{ background: "var(--s2)" }}
        >
          <Link2 className="h-4 w-4 shrink-0" style={{ color: "var(--brand)" }} />
          <span className="flex-1 text-[12px] font-mono text-foreground/50 truncate">
            uxlens.pro/share/a8x2kf9p
          </span>
          <div
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium animate-pulse"
            style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
          >
            <Copy className="h-3 w-3" />
            Copied!
          </div>
        </div>

        {/* Mini shared report preview */}
        <div
          className="rounded-xl overflow-hidden border"
          style={{ borderColor: "var(--border)", background: "var(--s1)" }}
        >
          <div className="p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-semibold text-foreground">demo-landing.com</p>
                <p className="text-[10px] text-foreground/40">Shared report • Public link</p>
              </div>
              <div
                className="px-2 py-1 rounded-lg text-[11px] font-bold"
                style={{ background: "oklch(0.52 0.14 155 / 8%)", color: "var(--score-high)" }}
              >
                82/100
              </div>
            </div>

            {/* Mini bar chart */}
            <div className="space-y-1.5">
              {[
                { label: "Clarity", w: 88, c: "var(--brand)" },
                { label: "Trust", w: 70, c: "oklch(0.62 0.15 160)" },
                { label: "Conversion", w: 79, c: "oklch(0.65 0.16 55)" },
              ].map((bar) => (
                <div key={bar.label} className="flex items-center gap-2">
                  <span className="text-[9px] text-foreground/35 w-[60px] truncate">{bar.label}</span>
                  <div className="flex-1 h-[4px] rounded-full" style={{ background: "var(--s3)" }}>
                    <div
                      className="h-full rounded-full animate-bar-width"
                      style={{ background: bar.c, width: `${bar.w}%`, "--bar-width": `${bar.w}%` } as React.CSSProperties}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-foreground/40 w-5 text-right">{bar.w}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="px-3.5 py-2 flex items-center justify-between border-t"
            style={{ borderColor: "var(--border)", background: "var(--s2)" }}
          >
            <div className="flex items-center gap-1.5 text-[10px] text-foreground/40">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Anyone with the link can view
            </div>
            <span className="text-[10px] font-medium" style={{ color: "var(--brand)" }}>
              Powered by UXLens
            </span>
          </div>
        </div>
      </div>
    </MockContainer>
  );
}

/* ════════════════════════════════════════════════════════════
   Legacy exports (backward-compatible aliases)
   ════════════════════════════════════════════════════════════ */

/** @deprecated Use ExecutiveSummaryMock instead */
export const ScoreBannerMock = ExecutiveSummaryMock;

/** @deprecated Use BarChartMock instead */
export const CategoryGridMock = BarChartMock;
