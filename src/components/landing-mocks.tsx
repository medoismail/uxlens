"use client";

import { Sparkles, Check, Link2, Share2, Copy } from "lucide-react";
import { ScrollReveal } from "@/components/scroll-reveal";
import {
  motion,
  useMotionValue,
  useTransform,
  useInView,
  useSpring,
  AnimatePresence,
} from "motion/react";
import { useRef, useEffect, useState } from "react";

/* ── Shared ── */

function MockContainer({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean; // kept for API compat, ignored
}) {
  return (
    <div
      className={`relative rounded-lg overflow-hidden mock-card ${className}`}
    >
      {children}
    </div>
  );
}

function scoreColor(s: number) {
  if (s >= 75) return "var(--score-high)";
  if (s >= 50) return "var(--score-mid)";
  return "var(--score-low)";
}

/* ── Animated Counter Hook ── */

function useAnimatedCounter(target: number, duration: number = 1200) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const motionVal = useMotionValue(0);
  const springVal = useSpring(motionVal, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.5,
  });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (isInView) {
      motionVal.set(target);
    }
  }, [isInView, motionVal, target]);

  useEffect(() => {
    const unsub = springVal.on("change", (v) => {
      setDisplay(Math.round(v));
    });
    return unsub;
  }, [springVal]);

  return { ref, display };
}

/* ── Animated Score Ring ── */

function AnimatedScoreRing({
  score,
  size = 52,
  strokeWidth = 8,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
}) {
  const r = (size / 2) - (strokeWidth / 2) - 2;
  const circumference = 2 * Math.PI * r;
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const color = scoreColor(score);

  return (
    <div ref={ref} className="relative" style={{ width: size, height: size }}>
      <svg className="-rotate-90 w-full h-full" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          style={{ stroke: "var(--s3)" }}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={
            isInView
              ? { strokeDashoffset: circumference - (score / 100) * circumference }
              : { strokeDashoffset: circumference }
          }
          transition={{
            duration: 1.2,
            ease: [0.33, 1, 0.68, 1], // easeOutCubic
            delay: 0.2,
          }}
          style={{ stroke: color }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedNumber value={score} color={color} size={16} />
      </div>
    </div>
  );
}

/* ── Animated Number Display ── */

function AnimatedNumber({
  value,
  color,
  size = 16,
  suffix = "",
}: {
  value: number;
  color: string;
  size?: number;
  suffix?: string;
}) {
  const { ref, display } = useAnimatedCounter(value);

  return (
    <span
      ref={ref}
      className="font-bold tabular-nums leading-none"
      style={{ color, fontSize: `${size}px`, fontVariantNumeric: "tabular-nums" }}
    >
      {display}
      {suffix}
    </span>
  );
}

/* ── Animated Bar ── */

function AnimatedBar({
  width,
  color,
  delay = 0,
}: {
  width: number;
  color: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <div
      ref={ref}
      className="flex-1 h-[6px] rounded-full overflow-hidden"
      style={{ background: "var(--s3)" }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: "0%" }}
        animate={isInView ? { width: `${width}%` } : { width: "0%" }}
        transition={{
          duration: 0.8,
          ease: [0.33, 1, 0.68, 1],
          delay: delay * 0.08 + 0.1,
        }}
      />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Executive Summary Mock
   — Animated 5-card metric row with spring counters
   ════════════════════════════════════════════════════════════ */

const MOCK_SCORE = 82;
const MOCK_GRADE = "B+";

export function ExecutiveSummaryMock() {
  return (
    <motion.div
      className="grid grid-cols-5 gap-2"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.06, delayChildren: 0.1 },
        },
      }}
    >
      {/* UX Score — large gauge card */}
      <motion.div
        className="col-span-2 sm:col-span-1 dash-card rounded-xl border p-3 flex flex-col items-center justify-center"
        style={{ background: "var(--s1)" }}
        variants={{
          hidden: { opacity: 0, y: 12, scale: 0.95 },
          visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
              y: { type: "spring", stiffness: 300, damping: 24 },
              scale: { type: "spring", stiffness: 300, damping: 20 },
            },
          },
        }}
      >
        <div className="mb-1.5">
          <AnimatedScoreRing score={MOCK_SCORE} />
        </div>
        <span className="text-[10px] text-foreground/40 font-medium">UX Score</span>
        <span className="text-[10px] text-foreground/45">{MOCK_GRADE}</span>
      </motion.div>

      {/* Conv. Risk */}
      <MiniMetricCard label="Conv. Risk" value={22} suffix="%" color={scoreColor(78)} />
      {/* Readability */}
      <MiniMetricCard label="Readability" value={72} suffix="%" color={scoreColor(72)} />
      {/* Trust */}
      <MiniMetricCard label="Trust" value={70} suffix="/100" color={scoreColor(70)} />
      {/* Complexity */}
      <motion.div
        className="dash-card rounded-xl border p-2.5 flex flex-col items-center justify-center text-center"
        style={{ background: "var(--s1)" }}
        variants={{
          hidden: { opacity: 0, y: 12, scale: 0.95 },
          visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
              y: { type: "spring", stiffness: 300, damping: 24 },
              scale: { type: "spring", stiffness: 300, damping: 20 },
            },
          },
        }}
      >
        <span className="text-[14px] font-bold mb-0.5" style={{ color: "var(--score-mid)" }}>
          Medium
        </span>
        <span className="text-[10px] text-foreground/40 font-medium">Complexity</span>
      </motion.div>
    </motion.div>
  );
}

function MiniMetricCard({
  label,
  value,
  suffix = "",
  color,
}: {
  label: string;
  value: number;
  suffix?: string;
  color: string;
}) {
  return (
    <motion.div
      className="dash-card rounded-xl border p-2.5 flex flex-col items-center justify-center text-center"
      style={{ background: "var(--s1)" }}
      variants={{
        hidden: { opacity: 0, y: 12, scale: 0.95 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            y: { type: "spring", stiffness: 300, damping: 24 },
            scale: { type: "spring", stiffness: 300, damping: 20 },
          },
        },
      }}
    >
      <div className="flex items-baseline gap-0.5 mb-0.5">
        <AnimatedNumber value={value} color={color} size={16} />
        {suffix && <span className="text-[10px] text-foreground/50">{suffix}</span>}
      </div>
      <span className="text-[10px] text-foreground/40 font-medium">{label}</span>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════
   Bar Chart Mock — Animated horizontal bars
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
    <motion.div
      className="flex flex-col gap-2"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.06, delayChildren: 0.2 },
        },
      }}
    >
      {MOCK_CATEGORIES.map((cat, i) => (
        <motion.div
          key={cat.label}
          className="flex items-center gap-2"
          variants={{
            hidden: { opacity: 0, x: -8 },
            visible: {
              opacity: 1,
              x: 0,
              transition: {
                x: { type: "spring", stiffness: 300, damping: 24 },
              },
            },
          }}
        >
          <span className="text-[10px] text-foreground/40 w-[90px] sm:w-[110px] shrink-0 truncate">
            {cat.label}
          </span>
          <AnimatedBar width={cat.score} color={cat.color} delay={i} />
          <span
            className="text-[12px] font-bold font-mono w-6 text-right tabular-nums"
            style={{ color: cat.color }}
          >
            {cat.score}
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════
   Metric Grid Mock (2x3 compact cards with sparklines)
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
  [0.25, 0.5, 1.0, 0.6, 0.8],
  [0.8, 0.55, 0.3, 0.65, 1.0],
  [0.4, 1.0, 0.7, 0.35, 0.55],
  [0.6, 0.4, 0.75, 1.0, 0.5],
  [1.0, 0.65, 0.4, 0.55, 0.3],
  [0.35, 0.7, 0.55, 1.0, 0.75],
];

function generateSparkData(score: number, index: number = 0): number[] {
  const s = score / 100;
  const pattern = SPARK_PATTERNS[index % SPARK_PATTERNS.length];
  return pattern.map((m) => Math.min(1, Math.max(0.08, s * m)));
}

export function MetricGridMock() {
  return (
    <motion.div
      className="grid grid-cols-3 gap-1.5"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.05, delayChildren: 0.1 },
        },
      }}
    >
      {MOCK_METRIC_GRID.map((cat, idx) => {
        const sparkData = generateSparkData(cat.score, idx);
        return (
          <motion.div
            key={cat.label}
            className="dash-card rounded-lg border p-2.5"
            style={{ background: "var(--s1)" }}
            variants={{
              hidden: { opacity: 0, y: 10, scale: 0.95 },
              visible: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: {
                  y: { type: "spring", stiffness: 300, damping: 24 },
                },
              },
            }}
            whileHover={{
              scale: 1.02,
              transition: { type: "spring", stiffness: 400, damping: 20 },
            }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-foreground/55 truncate">{cat.label}</span>
              <AnimatedNumber value={cat.score} color={cat.color} size={14} />
            </div>
            {/* Mini sparkline — animated bars */}
            <div className="flex items-end gap-[2px] h-[14px]">
              {sparkData.map((v, i) => (
                <motion.div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{
                    background: cat.color,
                    opacity: 0.4 + v * 0.6,
                  }}
                  initial={{ height: 0 }}
                  whileInView={{ height: `${v * 100}%` }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.5,
                    delay: idx * 0.05 + i * 0.04 + 0.3,
                    ease: [0.33, 1, 0.68, 1],
                  }}
                />
              ))}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════
   Radar Chart Mock — Animated SVG with path drawing
   ════════════════════════════════════════════════════════════ */

export function RadarChartMock() {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 72;
  const labels = ["Clarity", "Cog. Load", "Conv.", "Trust", "Contra.", "1st Screen"];
  const scores = [88, 72, 79, 70, 85, 76];
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
    const r = (value / 100) * maxR;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const gridLevels = [25, 50, 75, 100];

  const dataPoints = scores.map((s, i) => getPoint(i, s));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ") + " Z";

  return (
    <MockContainer glow>
      <div ref={ref} className="p-4 flex flex-col items-center">
        <div className="flex items-center justify-between w-full mb-3">
          <h4 className="text-[12px] font-semibold text-foreground">UX Score Radar</h4>
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded"
            style={{ background: "var(--brand-dim)", color: "var(--brand)" }}
          >
            6 DIMENSIONS
          </span>
        </div>

        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Grid polygons — fade in */}
          {gridLevels.map((level, i) => {
            const pts = Array.from({ length: 6 }, (_, j) => getPoint(j, level));
            return (
              <motion.polygon
                key={level}
                points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="none"
                stroke="var(--s3)"
                strokeWidth="1"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
              />
            );
          })}

          {/* Axis lines */}
          {Array.from({ length: 6 }, (_, i) => {
            const p = getPoint(i, 100);
            return (
              <motion.line
                key={i}
                x1={cx}
                y1={cy}
                x2={p.x}
                y2={p.y}
                stroke="var(--s3)"
                strokeWidth="1"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={isInView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                transition={{ duration: 0.5, delay: i * 0.05 + 0.2 }}
              />
            );
          })}

          {/* Data polygon — draw in with spring */}
          <motion.path
            d={dataPath}
            fill="oklch(0.504 0.282 276.1 / 12%)"
            stroke="var(--brand)"
            strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={
              isInView
                ? { pathLength: 1, opacity: 1 }
                : { pathLength: 0, opacity: 0 }
            }
            transition={{
              pathLength: { duration: 1.2, ease: [0.33, 1, 0.68, 1], delay: 0.5 },
              opacity: { duration: 0.3, delay: 0.5 },
            }}
          />

          {/* Data dots — pop in */}
          {dataPoints.map((p, i) => (
            <motion.circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="3"
              fill="var(--brand)"
              initial={{ scale: 0, opacity: 0 }}
              animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 15,
                delay: 0.8 + i * 0.06,
              }}
            />
          ))}

          {/* Labels */}
          {labels.map((label, i) => {
            const p = getPoint(i, 118);
            return (
              <motion.text
                key={i}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[10px] fill-foreground/35"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.6 + i * 0.05 }}
              >
                {label}
              </motion.text>
            );
          })}
        </svg>

        {/* Bottom score summary */}
        <motion.div
          className="flex items-center gap-4 mt-3"
          initial={{ opacity: 0, y: 8 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.4, delay: 1.2 }}
        >
          <div className="flex items-center gap-1.5 text-[10px] text-foreground/55">
            <span className="w-2 h-2 rounded-full" style={{ background: "var(--brand)" }} />
            Your score
          </div>
          <span className="text-[12px] font-mono font-bold" style={{ color: scoreColor(82) }}>
            82 / 100
          </span>
        </motion.div>
      </div>
    </MockContainer>
  );
}

/* ── Heatmap Mock ── */

export function HeatmapMock() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <MockContainer glow>
      <div ref={ref} className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[12px] font-semibold text-foreground">Attention Heatmap</h4>
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded"
            style={{ background: "var(--brand-dim)", color: "var(--brand)" }}
          >
            AI GENERATED
          </span>
        </div>

        <div
          className="relative rounded-lg overflow-hidden"
          style={{ background: "var(--s2)", aspectRatio: "16 / 10" }}
        >
          {/* Wireframe content — staggered fade in */}
          <motion.div
            className="absolute inset-0 p-4 flex flex-col gap-3"
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.05, delayChildren: 0.1 },
              },
            }}
          >
            <motion.div
              className="flex items-center gap-2"
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            >
              <div className="h-2 w-10 rounded bg-foreground/8" />
              <div className="flex-1" />
              <div className="h-2 w-6 rounded bg-foreground/6" />
              <div className="h-2 w-6 rounded bg-foreground/6" />
              <div className="h-2 w-6 rounded bg-foreground/6" />
            </motion.div>
            <motion.div
              className="flex flex-col items-center gap-2 mt-4"
              variants={{ hidden: { opacity: 0, y: 4 }, visible: { opacity: 1, y: 0 } }}
            >
              <div className="h-3 w-40 rounded bg-foreground/10" />
              <div className="h-5 w-56 rounded bg-foreground/12" />
              <div className="h-2.5 w-44 rounded bg-foreground/8" />
            </motion.div>
            <motion.div
              className="flex justify-center mt-2"
              variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}
            >
              <div className="h-6 w-24 rounded-md bg-foreground/10" />
            </motion.div>
            <motion.div
              className="flex gap-3 mt-4"
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            >
              <div className="flex-1 h-12 rounded bg-foreground/5" />
              <div className="flex-1 h-12 rounded bg-foreground/5" />
              <div className="flex-1 h-12 rounded bg-foreground/5" />
            </motion.div>
          </motion.div>

          {/* Heatmap gradient — fade in with pulse */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: [
                "radial-gradient(ellipse 45% 40% at 50% 25%, oklch(0.65 0.25 29 / 35%) 0%, transparent 100%)",
                "radial-gradient(ellipse 30% 25% at 50% 55%, oklch(0.72 0.19 75 / 28%) 0%, transparent 100%)",
                "radial-gradient(ellipse 50% 35% at 50% 80%, oklch(0.55 0.17 155 / 18%) 0%, transparent 100%)",
              ].join(", "),
            }}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: [0, 1, 0.85, 1] } : { opacity: 0 }}
            transition={{ duration: 1.5, delay: 0.4, ease: "easeOut" }}
          />
        </div>

        {/* Legend */}
        <motion.div
          className="flex items-center justify-center gap-4 mt-3"
          initial={{ opacity: 0, y: 6 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
          transition={{ duration: 0.4, delay: 0.8 }}
        >
          {[
            { color: "oklch(0.65 0.25 29)", label: "High attention" },
            { color: "oklch(0.72 0.19 75)", label: "Medium" },
            { color: "oklch(0.55 0.17 155)", label: "Low" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5 text-[10px] text-foreground/55">
              <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
              {item.label}
            </div>
          ))}
        </motion.div>
      </div>
    </MockContainer>
  );
}

/* ── Chat Mock — Typing animation ── */

export function ChatMock() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <MockContainer glow>
      <div ref={ref} className="flex flex-col" style={{ maxHeight: "360px" }}>
        {/* Header */}
        <div
          className="flex items-center gap-2 px-4 py-3 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <motion.div
            animate={isInView ? { rotate: [0, 15, -15, 0] } : {}}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeInOut" }}
          >
            <Sparkles className="h-4 w-4" style={{ color: "var(--brand)" }} />
          </motion.div>
          <span className="text-[14px] font-semibold text-foreground">UXLens AI</span>
          <span
            className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded"
            style={{ background: "var(--brand-dim)", color: "var(--brand)" }}
          >
            47 left
          </span>
        </div>

        {/* Messages — staggered entrance */}
        <motion.div
          className="flex-1 px-4 py-3 flex flex-col gap-3 overflow-hidden"
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.15, delayChildren: 0.2 },
            },
          }}
        >
          {/* User message */}
          <motion.div
            className="flex justify-end"
            variants={{
              hidden: { opacity: 0, x: 20, scale: 0.95 },
              visible: {
                opacity: 1,
                x: 0,
                scale: 1,
                transition: { type: "spring", stiffness: 300, damping: 24 },
              },
            }}
          >
            <div
              className="rounded-xl rounded-tr-sm px-3.5 py-2 text-[12px] max-w-[75%]"
              style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
            >
              What should I fix first?
            </div>
          </motion.div>

          {/* AI message */}
          <motion.div
            className="flex justify-start"
            variants={{
              hidden: { opacity: 0, x: -20, scale: 0.95 },
              visible: {
                opacity: 1,
                x: 0,
                scale: 1,
                transition: { type: "spring", stiffness: 300, damping: 24 },
              },
            }}
          >
            <div
              className="rounded-xl rounded-tl-sm px-3.5 py-2 text-[12px] max-w-[85%] leading-relaxed text-foreground/70"
              style={{ background: "var(--s2)" }}
            >
              Based on your audit, the highest-impact fix is{" "}
              <strong className="text-foreground/90">adding social proof above the fold</strong>.
              Your trust signals score is 70 — adding 2-3 testimonials near the CTA could lift
              conversions by 15-20%.
            </div>
          </motion.div>

          {/* User message 2 */}
          <motion.div
            className="flex justify-end"
            variants={{
              hidden: { opacity: 0, x: 20, scale: 0.95 },
              visible: {
                opacity: 1,
                x: 0,
                scale: 1,
                transition: { type: "spring", stiffness: 300, damping: 24 },
              },
            }}
          >
            <div
              className="rounded-xl rounded-tr-sm px-3.5 py-2 text-[12px] max-w-[75%]"
              style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
            >
              Can you rewrite my CTA?
            </div>
          </motion.div>
        </motion.div>

        {/* Suggested questions — spring pop */}
        <motion.div
          className="px-4 py-2.5 border-t flex flex-wrap gap-1.5"
          style={{ borderColor: "var(--border)" }}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.06, delayChildren: 0.7 },
            },
          }}
        >
          {["Explain my trust score", "Rewrite my headline"].map((q) => (
            <motion.span
              key={q}
              className="text-[10px] px-2.5 py-1 rounded-full border text-foreground/55 cursor-pointer hover:text-foreground/70 hover:border-foreground/20 transition-colors"
              style={{ borderColor: "var(--border)" }}
              variants={{
                hidden: { opacity: 0, y: 6, scale: 0.9 },
                visible: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { type: "spring", stiffness: 400, damping: 20 },
                },
              }}
              whileHover={{ scale: 1.04, transition: { type: "spring", stiffness: 400, damping: 17 } }}
              whileTap={{ scale: 0.97 }}
            >
              {q}
            </motion.span>
          ))}
        </motion.div>

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
          <motion.div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 cursor-pointer"
            style={{ background: "var(--brand)" }}
            whileHover={{ scale: 1.1, transition: { type: "spring", stiffness: 400, damping: 17 } }}
            whileTap={{ scale: 0.92 }}
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
          </motion.div>
        </div>
      </div>
    </MockContainer>
  );
}

/* ── Competitor Mock — Animated bars ── */

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

        <motion.div
          className="flex flex-col gap-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.12, delayChildren: 0.15 },
            },
          }}
        >
          {COMP_DATA.map((c, i) => {
            const color = scoreColor(c.score);
            return (
              <motion.div
                key={c.name}
                variants={{
                  hidden: { opacity: 0, x: -10 },
                  visible: {
                    opacity: 1,
                    x: 0,
                    transition: { type: "spring", stiffness: 300, damping: 24 },
                  },
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[12px] ${c.highlight ? "font-semibold text-foreground" : "text-foreground/50"}`}
                  >
                    {c.name}
                  </span>
                  <AnimatedNumber value={c.score} color={color} size={14} />
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--s3)" }}>
                  <AnimatedBar width={c.score} color={color} delay={i} />
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          className="mt-4 pt-3 border-t text-[12px] text-foreground/55"
          style={{ borderColor: "var(--border)" }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
        >
          Average competitor score:{" "}
          <span className="font-mono font-medium text-foreground/50 tabular-nums">68</span>
        </motion.div>
      </div>
    </MockContainer>
  );
}

/* ── Rewrite Mock (Before / After) ── */

export function RewriteMock() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <MockContainer glow className="max-w-2xl mx-auto">
      <div ref={ref} className="p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <h4 className="text-[14px] font-semibold text-foreground">Hero Rewrite</h4>
          <motion.span
            className="text-[10px] font-mono px-2 py-0.5 rounded font-bold"
            style={{ background: "var(--brand-dim)", color: "var(--brand)" }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.2 }}
          >
            AI OPTIMIZED
          </motion.span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Before */}
          <motion.div
            className="rounded-xl border p-4"
            style={{ background: "var(--s2)" }}
            initial={{ opacity: 0, x: -16 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }}
            transition={{ type: "spring", stiffness: 200, damping: 24, delay: 0.1 }}
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
          </motion.div>

          {/* After */}
          <motion.div
            className="rounded-xl border p-4"
            style={{ background: "var(--s1)" }}
            initial={{ opacity: 0, x: 16 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 16 }}
            transition={{ type: "spring", stiffness: 200, damping: 24, delay: 0.25 }}
          >
            <p
              className="text-[10px] font-mono uppercase tracking-[2px] mb-3"
              style={{ color: "var(--brand)" }}
            >
              After
            </p>
            <p className="text-[15px] font-semibold text-foreground leading-snug mb-2">
              Ship Faster With AI-Powered Design Reviews
            </p>
            <p className="text-[12px] text-foreground/55 leading-relaxed mb-3">
              Get instant UX feedback on any page in 30 seconds. No manual audits, no waiting.
            </p>
            <motion.span
              className="inline-block text-[12px] font-bold px-3 py-1.5 rounded-md cursor-pointer"
              style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
              whileHover={{ scale: 1.04, transition: { type: "spring", stiffness: 400, damping: 17 } }}
              whileTap={{ scale: 0.97 }}
            >
              Start Free Audit
            </motion.span>
          </motion.div>
        </div>
      </div>
    </MockContainer>
  );
}

/* ════════════════════════════════════════════════════════════
   Product Preview Mock (Composite Hero Visual)
   ════════════════════════════════════════════════════════════ */

export function ProductPreviewMock() {
  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, y: { type: "spring", stiffness: 150, damping: 20 } }}
    >
      <div
        className="rounded-lg overflow-hidden mock-card"
      >
        {/* Top bar — minimal, no browser dots */}
        <div
          className="flex items-center gap-2 px-4 py-2 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="text-[10px] font-mono text-foreground/30">
            uxlens.pro/audit/demo-landing-page
          </span>
        </div>

          {/* Dashboard Content */}
          <div className="p-4 sm:p-5 space-y-3">
            <div className="text-center mb-1">
              <p className="text-[10px] text-foreground/45 mb-1">
                Diagnostic Engine v0.7 — UX Dashboard
              </p>
              <p className="text-[14px] font-semibold text-foreground">demo-landing-page.com</p>
            </div>

            <ExecutiveSummaryMock />
            <BarChartMock />
          </div>
      </div>
    </motion.div>
  );
}

/* ── Feature Section Layout Helper ── */

interface FeatureSectionProps {
  label: string;
  headline: string;
  description: string;
  bullets: string[];
  children: React.ReactNode;
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
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center`}>
        {/* Copy side */}
        <ScrollReveal className={`space-y-4 ${reversed ? "lg:order-2" : ""}`}>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-foreground/45">{label}</span>
            {tier && (
              <span
                className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold"
                style={{ background: "var(--brand-dim)", color: "var(--brand)" }}
              >
                {tier}
              </span>
            )}
          </div>
          <h2 className="text-[clamp(22px,3vw,32px)] font-bold tracking-[-0.5px] text-foreground leading-tight">
            {headline}
          </h2>
          <p className="text-[14px] text-foreground/45 leading-relaxed max-w-md">{description}</p>
          <motion.ul
            className="space-y-2 pt-1"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.08, delayChildren: 0.15 },
              },
            }}
          >
            {bullets.map((b) => (
              <motion.li
                key={b}
                className="flex items-center gap-2 text-[12px] text-foreground/40"
                variants={{
                  hidden: { opacity: 0, x: -8 },
                  visible: {
                    opacity: 1,
                    x: 0,
                    transition: { type: "spring", stiffness: 300, damping: 24 },
                  },
                }}
              >
                <Check className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--brand)" }} />
                {b}
              </motion.li>
            ))}
          </motion.ul>
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
   Share Report Mock — Animated share link
   ════════════════════════════════════════════════════════════ */

export function ShareMock() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <MockContainer glow>
      <div ref={ref} className="p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <motion.div
            animate={isInView ? { rotate: [0, -10, 10, 0] } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Share2 className="h-4 w-4" style={{ color: "var(--brand)" }} />
          </motion.div>
          <h4 className="text-[14px] font-semibold text-foreground">Share Report</h4>
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded font-bold"
            style={{ background: "var(--brand-dim)", color: "var(--brand)" }}
          >
            1-CLICK
          </span>
        </div>

        {/* Share link bar */}
        <motion.div
          className="flex items-center gap-2 rounded-xl p-3 mb-4"
          style={{ background: "var(--s2)" }}
          initial={{ opacity: 0, y: 8 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ type: "spring", stiffness: 200, damping: 24, delay: 0.2 }}
        >
          <Link2 className="h-4 w-4 shrink-0" style={{ color: "var(--brand)" }} />
          <span className="flex-1 text-[12px] font-mono text-foreground/50 truncate">
            uxlens.pro/share/a8x2kf9p
          </span>
          <motion.div
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium"
            style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 17, delay: 0.5 }}
          >
            <Copy className="h-3 w-3" />
            Copied!
          </motion.div>
        </motion.div>

        {/* Mini shared report preview */}
        <motion.div
          className="rounded-xl overflow-hidden border"
          style={{ borderColor: "var(--border)", background: "var(--s1)" }}
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ type: "spring", stiffness: 200, damping: 24, delay: 0.35 }}
        >
          <div className="p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-semibold text-foreground">demo-landing.com</p>
                <p className="text-[10px] text-foreground/40">Shared report &bull; Public link</p>
              </div>
              <div
                className="px-2 py-1 rounded-lg text-[11px] font-bold tabular-nums"
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
              ].map((bar, i) => (
                <div key={bar.label} className="flex items-center gap-2">
                  <span className="text-[9px] text-foreground/35 w-[60px] truncate">{bar.label}</span>
                  <AnimatedBar width={bar.w} color={bar.c} delay={i + 5} />
                  <span className="text-[10px] font-mono font-bold text-foreground/40 w-5 text-right tabular-nums">
                    {bar.w}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="px-3.5 py-2 flex items-center justify-between border-t"
            style={{ borderColor: "var(--border)", background: "var(--s2)" }}
          >
            <div className="flex items-center gap-1.5 text-[10px] text-foreground/40">
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-green-500"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              Anyone with the link can view
            </div>
            <span className="text-[10px] font-medium" style={{ color: "var(--brand)" }}>
              Powered by UXLens
            </span>
          </div>
        </motion.div>
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
