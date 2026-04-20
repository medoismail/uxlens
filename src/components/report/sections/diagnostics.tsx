"use client";

import { memo, useId } from "react";
import { motion } from "motion/react";
import {
  MessageSquare, Brain, ArrowRight, Shield, AlertTriangle,
  Monitor, Eye, Accessibility, Layers,
} from "lucide-react";
import { RadarChart } from "../charts/radar-chart";
import {
  scoreColor, CATEGORY_DEFS,
  heuristicColor,
} from "../utils";
import type {
  UXAuditResult, VisualAnalysis,
  JourneyPoint,
} from "@/lib/types";

/* ── Shared entrance ── */
const ENTER = (i: number, base = 0) => ({
  initial: { opacity: 0, y: 8 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { delay: base + i * 0.04, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const },
});

/* ── Category icons + accents ── */
const CAT_META: Record<string, { icon: React.ReactNode; accent: string }> = {
  messageClarity: { icon: <MessageSquare className="h-4 w-4" />, accent: "oklch(0.72 0.14 180)" },
  cognitiveLoad: { icon: <Brain className="h-4 w-4" />, accent: "oklch(0.65 0.17 30)" },
  conversionArch: { icon: <ArrowRight className="h-4 w-4" />, accent: "oklch(0.72 0.15 250)" },
  trustSignals: { icon: <Shield className="h-4 w-4" />, accent: "oklch(0.72 0.16 155)" },
  contradictions: { icon: <AlertTriangle className="h-4 w-4" />, accent: "oklch(0.72 0.16 65)" },
  firstScreen: { icon: <Monitor className="h-4 w-4" />, accent: "oklch(0.72 0.14 295)" },
};

const FSA_META: Record<string, { icon: React.ReactNode; accent: string }> = {
  "Primary Impression": { icon: <Eye className="h-3.5 w-3.5" />, accent: "oklch(0.72 0.14 250)" },
  "Unanswered Question": { icon: <MessageSquare className="h-3.5 w-3.5" />, accent: "oklch(0.72 0.16 65)" },
  "Dominant Emotion": { icon: <Brain className="h-3.5 w-3.5" />, accent: "oklch(0.72 0.15 320)" },
  "Exit Reason": { icon: <ArrowRight className="h-3.5 w-3.5" />, accent: "oklch(0.65 0.17 30)" },
  "Mental Model": { icon: <Layers className="h-3.5 w-3.5" />, accent: "oklch(0.72 0.14 180)" },
  "Decision Barrier": { icon: <Shield className="h-3.5 w-3.5" />, accent: "oklch(0.72 0.16 155)" },
};

interface DiagnosticsProps {
  data: UXAuditResult;
  visualAnalysis?: VisualAnalysis;
  screenshotUrl?: string;
  heatmapZones?: unknown[];
  pageHeight?: number;
  viewportWidth?: number;
  screenshotStatus?: string;
  heatmapStatus?: string;
  visualAnalysisStatus?: string;
}

/* ── Card wrapper — unified flat surface ── */
function Card({ children, className = "", padded = true }: { children: React.ReactNode; className?: string; padded?: boolean }) {
  return (
    <div
      className={`rounded-2xl ${padded ? "p-5" : ""} ${className}`}
      style={{ background: "var(--s2)" }}
    >
      {children}
    </div>
  );
}

/* ── Section header ── */
function SectionHeader({ label, meta }: { label: string; meta?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between mb-5">
      <div className="flex items-baseline gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/30">{label}</p>
      </div>
      {meta}
    </div>
  );
}

export const Diagnostics = memo(function Diagnostics({ data, visualAnalysis }: DiagnosticsProps) {
  const cats = CATEGORY_DEFS.map(cat => ({
    ...cat,
    d: data.categories[cat.key as keyof typeof data.categories],
    meta: CAT_META[cat.key] || { icon: <Monitor className="h-4 w-4" />, accent: "var(--foreground)" },
  }));
  const sorted = [...cats].sort((a, b) => a.d.score - b.d.score);
  const heuristics = data.heuristicEvaluation?.heuristics || [];
  const heuristicOverall = data.heuristicEvaluation?.overallHeuristicScore || 0;
  const fsa = data.firstScreenAnalysis;

  return (
    <div className="flex flex-col gap-12">

      {/* ─── CATEGORIES ─── */}
      <section>
        <SectionHeader label="Categories" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {sorted.map((cat, i) => (
            <CatCard
              key={cat.key}
              icon={cat.meta.icon}
              accent={cat.meta.accent}
              label={cat.label}
              score={cat.d.score}
              note={cat.d.note}
              benchmark={cat.d.benchmark}
              i={i}
            />
          ))}
        </div>
      </section>

      {/* ─── HEURISTICS ─── */}
      {data.heuristicEvaluation && (
        <section>
          <SectionHeader
            label="Heuristic Analysis"
            meta={
              <span className="text-[10px] text-foreground/30 font-medium">Nielsen's 10 Principles</span>
            }
          />
          <Card padded={false} className="overflow-hidden">
            <div className="flex flex-col md:flex-row">
              {/* Radar + median */}
              <div className="relative shrink-0 grid place-items-center p-6">
                <RadarChart heuristics={heuristics} size={200} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-foreground/25">Median</span>
                  <span className="text-[28px] font-bold tabular-nums leading-none mt-1" style={{ color: heuristicColor(heuristicOverall) }}>
                    {heuristicOverall}
                  </span>
                </div>
              </div>
              {/* Principles list */}
              <div className="flex-1 p-3 md:p-4">
                {heuristics.map((h, i) => (
                  <motion.div
                    key={h.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-foreground/[0.03] transition-colors duration-150"
                    {...ENTER(i, 0.05)}
                  >
                    <span
                      className="text-[10px] font-semibold tabular-nums text-foreground/25 w-5 shrink-0"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[13px] text-foreground/60 flex-1 truncate">{h.name}</span>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="w-16 h-[3px] rounded-full overflow-hidden" style={{ background: "var(--s1)" }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: heuristicColor(h.score) }}
                          initial={{ width: 0 }}
                          animate={{ width: `${h.score * 10}%` }}
                          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 + i * 0.03 }}
                        />
                      </div>
                      <span className="text-[13px] font-bold tabular-nums w-5 text-right" style={{ color: heuristicColor(h.score) }}>
                        {h.score}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* ─── TRUST VS FRICTION ─── */}
      {(data.trustMatrix?.length || data.confusionMap) && (
        <section>
          <SectionHeader label="Trust vs Friction" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {/* Trust signals */}
            {data.trustMatrix && data.trustMatrix.length > 0 && (
              <Card>
                <div className="flex items-center gap-2.5 mb-5">
                  <Shield className="h-3.5 w-3.5" style={{ color: "var(--score-high)" }} />
                  <p className="text-[13px] font-semibold text-foreground/65">Strongest Trust Signals</p>
                </div>
                <div className="flex flex-col gap-3.5">
                  {data.trustMatrix.map((t, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-[11px] font-medium text-foreground/45 w-[130px] shrink-0">{t.label}</span>
                      <div className="flex-1 h-[4px] rounded-full overflow-hidden" style={{ background: "var(--s1)" }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: "var(--score-high)" }}
                          initial={{ width: "0%" }}
                          animate={{ width: `${t.score}%` }}
                          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: i * 0.06 }}
                        />
                      </div>
                      <span className="text-[12px] font-bold font-mono tabular-nums w-10 text-right" style={{ color: "var(--score-high)" }}>
                        {t.score}%
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
            {/* Friction */}
            {data.confusionMap && (
              <Card>
                <div className="flex items-center gap-2.5 mb-5">
                  <AlertTriangle className="h-3.5 w-3.5" style={{ color: "var(--score-mid)" }} />
                  <p className="text-[13px] font-semibold text-foreground/65">Critical Friction Points</p>
                </div>
                <div className="flex flex-col gap-3.5">
                  {[
                    { label: "Jargon Level", score: data.confusionMap.jargonScore },
                    { label: "Info Density", score: data.confusionMap.densityScore },
                    { label: "Friction Words", score: data.confusionMap.frictionWords },
                    { label: "Decision Overload", score: data.confusionMap.decisionParalysis },
                  ].map((m, i) => (
                    <div key={m.label} className="flex items-center gap-3">
                      <span className="text-[11px] font-medium text-foreground/45 w-[130px] shrink-0">{m.label}</span>
                      <div className="flex-1 h-[4px] rounded-full overflow-hidden" style={{ background: "var(--s1)" }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: "var(--score-mid)" }}
                          initial={{ width: "0%" }}
                          animate={{ width: `${m.score}%` }}
                          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: i * 0.06 }}
                        />
                      </div>
                      <span className="text-[12px] font-bold font-mono tabular-nums w-10 text-right" style={{ color: "var(--score-mid)" }}>
                        {m.score}%
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* ─── FIRST IMPRESSION ─── */}
      <section>
        <SectionHeader
          label="First Impression Audit"
          meta={
            <span
              className="text-[10px] font-semibold px-2 py-1 rounded-md tabular-nums text-foreground/55"
              style={{ background: "var(--s2)" }}
            >
              {fsa.clarityConfidence}% clarity
            </span>
          }
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          <FsaCard label="Primary Impression" value={fsa.immediateUnderstanding} i={0} />
          <FsaCard label="Unanswered Question" value={fsa.unansweredQuestion} i={1} />
          <FsaCard label="Dominant Emotion" value={fsa.dominantEmotion} i={2} />
          <FsaCard label="Exit Reason" value={fsa.exitReason} i={3} />
          {fsa.visitorMentalModel && <FsaCard label="Mental Model" value={fsa.visitorMentalModel} i={4} />}
          {fsa.decisionBarrier && <FsaCard label="Decision Barrier" value={fsa.decisionBarrier} i={5} />}
        </div>
      </section>

      {/* ─── JOURNEY ─── */}
      {data.journeyMap && data.journeyMap.length > 0 && (
        <section>
          <SectionHeader label="Emotional Journey" />
          <JourneyChart points={data.journeyMap} />
        </section>
      )}

      {/* ─── TECHNICAL ─── */}
      {(visualAnalysis || data.accessibilityScore || data.iaScore) && (
        <section>
          <SectionHeader label="Technical Performance" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {visualAnalysis && (
              <TechCard
                icon={<Eye className="h-3.5 w-3.5" />}
                accent="var(--score-high)"
                label="Visual Architecture"
                bars={[
                  { l: "Layout Balance", s: visualAnalysis.layoutScore },
                  { l: "Visual Hierarchy", s: visualAnalysis.visualHierarchyScore },
                  { l: "Negative Space", s: visualAnalysis.whitespaceScore },
                  { l: "Typography Clarity", s: visualAnalysis.colorContrastScore },
                  { l: "Mobile Ready", s: visualAnalysis.mobileReadinessScore },
                ]}
              />
            )}
            {data.accessibilityScore && (
              <TechCard
                icon={<Accessibility className="h-3.5 w-3.5" />}
                accent="oklch(0.65 0.2 310)"
                label="Accessibility"
                bars={[
                  { l: "Color Contrast", s: data.accessibilityScore.contrastScore },
                  { l: "Screen Reader", s: data.accessibilityScore.textSizeScore },
                  { l: "Touch Targets", s: data.accessibilityScore.touchTargetScore },
                  { l: "Alt Text", s: data.accessibilityScore.altTextScore },
                  { l: "Keyboard Nav", s: data.accessibilityScore.keyboardNavScore },
                ]}
              />
            )}
            {data.iaScore && (
              <TechCard
                icon={<Layers className="h-3.5 w-3.5" />}
                accent="oklch(0.72 0.16 65)"
                label="Architecture"
                bars={[
                  { l: "Info Scanning", s: data.iaScore.sectionOrderScore },
                  { l: "Logical Flow", s: data.iaScore.navigationScore },
                  { l: "Categorization", s: data.iaScore.contentGroupingScore },
                  { l: "Navigation Depth", s: data.iaScore.scanabilityScore },
                ]}
              />
            )}
          </div>
        </section>
      )}
    </div>
  );
});

/* ══════════════════════════════════
   Primitives
   ══════════════════════════════════ */

/* ── Vertical dot-level indicator ──
 * Count of lit dots = value bucket (round(score/20) out of 5), so the indicator
 * itself visually encodes the number. The topmost lit dot uses a linear gradient
 * fading from the score color at its bottom to near-transparent at its top —
 * gives the "just reached" feeling of a partially-filled level meter. SVG so
 * the gradient renders pixel-crisp at 2px rather than being smudged by CSS.
 */
function ScoreDots({ score, dots = 5 }: { score: number; dots?: number }) {
  const rawId = useId();
  const gradId = `sd-grad-${rawId.replace(/[^\w-]/g, "")}`;
  const litCount = Math.max(1, Math.min(dots, Math.round((score / 100) * dots)));
  const color = scoreColor(score);

  const r = 1; // radius → 2px diameter
  const d = r * 2;
  const gap = 0.75;
  const height = dots * d + (dots - 1) * gap; // 5×2 + 4×0.75 = 13px

  return (
    <svg
      width={d}
      height={height}
      viewBox={`0 0 ${d} ${height}`}
      className="shrink-0"
      style={{ color }}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      {Array.from({ length: dots }, (_, idx) => {
        const isLit = idx < litCount;
        const isTopLit = isLit && idx === litCount - 1;
        // idx 0 = bottom-most dot
        const cy = height - r - idx * (d + gap);
        if (!isLit) {
          return (
            <circle
              key={idx}
              cx={r}
              cy={cy}
              r={r}
              style={{ fill: "var(--foreground)" }}
              opacity={0.12}
            />
          );
        }
        if (isTopLit) {
          return <circle key={idx} cx={r} cy={cy} r={r} fill={`url(#${gradId})`} />;
        }
        return <circle key={idx} cx={r} cy={cy} r={r} fill="currentColor" />;
      })}
    </svg>
  );
}

/* ── Category card — mirrors Figma build (node 1:861): fixed 42px top row, flat ── */
function CatCard({ icon, label, score, note, benchmark, i }: {
  icon: React.ReactNode; accent: string; label: string;
  score: number; note: string; benchmark?: number; i: number;
}) {
  const delta = benchmark != null ? score - benchmark : null;
  const deltaPositive = delta != null && delta >= 0;
  return (
    <motion.div
      className="flex flex-col items-start h-full p-5 rounded-2xl"
      style={{ background: "var(--s2)" }}
      {...ENTER(i)}
      whileHover={{ y: -2, transition: { type: "spring", stiffness: 400, damping: 28 } }}
    >
      {/* Row 1 — fixed 42px top, justify-between (Figma 1:862) */}
      <div className="flex w-full items-start justify-between h-[42px] pb-[9px]">
        {/* 16px monochrome icon */}
        <span className="flex items-center h-4 text-foreground/60">
          {icon}
        </span>
        {/* Score group: 5-dot level indicator + value + % */}
        <div className="flex items-center gap-[6px]">
          <ScoreDots score={score} />
          <span
            className="flex items-center gap-[2px] tabular-nums text-foreground/90 text-[16px] leading-[26px] tracking-tight"
          >
            <span>{score}</span>
            <span className="opacity-45 text-[13px] leading-[13px]">%</span>
          </span>
        </div>
      </div>

      {/* Row 2 — label + delta (Figma 1:883) */}
      <div className="flex w-full items-baseline gap-2 pb-[6px]">
        <span className="text-[13px] leading-[1.5] text-foreground/80">{label}</span>
        {delta != null && (
          <span
            className="font-mono text-[10.5px] leading-[1.5] tabular-nums"
            style={{ color: deltaPositive ? "var(--score-high)" : "var(--score-low)" }}
          >
            {deltaPositive ? "+" : ""}{delta}
          </span>
        )}
      </div>

      {/* Row 3 — note, 2-line clamp for uniform grid */}
      <p
        className="w-full text-[12px] leading-[1.55] text-foreground/45 line-clamp-2 overflow-hidden"
        style={{ textWrap: "pretty" }}
      >
        {note}
      </p>
    </motion.div>
  );
}

/* ── First Impression card ── */
function FsaCard({ label, value, i = 0 }: { label: string; value: string; i?: number }) {
  const meta = FSA_META[label] || { icon: <Eye className="h-3.5 w-3.5" />, accent: "var(--foreground)" };
  return (
    <motion.div
      className="rounded-2xl p-5 h-full"
      style={{ background: "var(--s2)" }}
      {...ENTER(i)}
      whileHover={{ y: -2, transition: { type: "spring", stiffness: 400, damping: 28 } }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="flex items-center" style={{ color: meta.accent }}>
          {meta.icon}
        </span>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/50">
          {label}
        </p>
      </div>
      <p className="text-[13px] text-foreground/70 leading-[1.6]" style={{ textWrap: "pretty" }}>{value}</p>
    </motion.div>
  );
}

/* ── Technical card ── */
function TechCard({ icon, accent, label, bars }: {
  icon: React.ReactNode; accent: string; label: string;
  bars: { l: string; s: number }[];
}) {
  return (
    <motion.div
      className="rounded-2xl p-5 h-full"
      style={{ background: "var(--s2)" }}
      whileHover={{ y: -2, transition: { type: "spring", stiffness: 400, damping: 28 } }}
    >
      <div className="flex items-center gap-2.5 mb-5">
        <span className="flex items-center" style={{ color: accent }}>
          {icon}
        </span>
        <span className="text-[13px] font-semibold text-foreground/75">{label}</span>
      </div>
      <div className="flex flex-col gap-3">
        {bars.map((b, i) => (
          <div key={b.l} className="flex items-center gap-3">
            <span className="text-[11px] text-foreground/50 w-[110px] shrink-0">{b.l}</span>
            <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: "var(--s1)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: accent }}
                initial={{ width: "0%" }}
                animate={{ width: `${b.s}%` }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 }}
              />
            </div>
            <span className="text-[11px] font-semibold font-mono tabular-nums w-12 text-right text-foreground/60">
              {b.s}<span className="text-foreground/30">/100</span>
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Journey chart — flat area fill (no gradient) ── */
function JourneyChart({ points }: { points: JourneyPoint[] }) {
  const colors: Record<string, string> = {
    confidence: "var(--score-high)", interest: "var(--accent-blue)",
    neutral: "var(--foreground)", doubt: "var(--score-mid)", frustration: "var(--score-low)",
  };
  const w = 600, h = 200, p = { t: 24, b: 40, l: 12, r: 12 };
  const pw = w - p.l - p.r, ph = h - p.t - p.b;
  const pts = points.map((pt, i) => ({
    x: p.l + (i / Math.max(1, points.length - 1)) * pw,
    y: p.t + ph - (pt.intensity / 100) * ph, ...pt,
  }));
  const linePath = pts.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`).join(" ");
  const areaPath = linePath + ` L ${pts[pts.length - 1]?.x ?? p.l} ${p.t + ph} L ${pts[0]?.x ?? p.l} ${p.t + ph} Z`;

  return (
    <div className="rounded-2xl p-5 select-none" style={{ background: "var(--s2)" }}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <p className="text-[12px] text-foreground/50">Sentiment mapped across page sections</p>
        <div className="flex items-center gap-3">
          {Object.entries(colors).slice(0, 3).map(([k, c]) => (
            <span key={k} className="flex items-center gap-1.5 text-[10px] text-foreground/40 capitalize">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />{k}
            </span>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ pointerEvents: "none" }}>
        {/* Grid lines — subtle */}
        {[0.25, 0.5, 0.75].map((frac) => (
          <line
            key={frac}
            x1={p.l}
            y1={p.t + ph * frac}
            x2={w - p.r}
            y2={p.t + ph * frac}
            stroke="var(--s1)"
            strokeWidth={1}
          />
        ))}
        {/* Flat area fill */}
        <motion.path
          d={areaPath}
          fill="var(--brand)"
          fillOpacity={0.06}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
        {/* Line */}
        <motion.path
          d={linePath}
          fill="none"
          stroke="var(--brand)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* Points */}
        {pts.map((pt, i) => (
          <g key={i}>
            <motion.circle
              cx={pt.x}
              cy={pt.y}
              r={4}
              fill={colors[pt.emotion] || "var(--foreground)"}
              stroke="var(--s2)"
              strokeWidth={2.5}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.5 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            />
            <text
              x={pt.x}
              y={h - 10}
              textAnchor="middle"
              className="text-[8px] fill-foreground/30 uppercase font-semibold"
              style={{ letterSpacing: "0.08em" }}
            >
              {pt.section.length > 10 ? pt.section.slice(0, 9) + ".." : pt.section}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
