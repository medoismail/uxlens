"use client";

import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Eye, EyeOff, Flame, X } from "lucide-react";
import type { UXAuditResult, AuditSection, Finding, HeatmapZone, AnnotationCoordinate } from "@/lib/types";

/* ═══════════════════════════════════════════════════════
   Annotated View v6 — Redesigned inspect mode
   Dark-first, motion-animated, design-token-based
   ═══════════════════════════════════════════════════════ */

/* ── Severity → design token mapping ── */
const SEV = {
  critical: { color: "var(--score-low)", bg: "oklch(0.55 0.17 20 / 8%)" },
  high:     { color: "var(--score-low)", bg: "oklch(0.55 0.17 20 / 6%)" },
  medium:   { color: "var(--score-mid)", bg: "oklch(0.58 0.16 75 / 6%)" },
  low:      { color: "var(--score-high)", bg: "oklch(0.52 0.14 155 / 5%)" },
} as const;

function sevStyle(sev: string) {
  return SEV[sev as keyof typeof SEV] || SEV.medium;
}

/* ── Types ── */
interface Annotation {
  id: string;
  index: number;
  x: number;
  y: number;
  severity: string;
  finding: Finding;
  sectionName: string;
  sectionId: string;
}

/* ── Force-directed jitter (preserved) ── */
function spreadDots(pts: { x: number; y: number }[], iters = 30, minDist = 0.04): { x: number; y: number }[] {
  const r = pts.map(p => ({ ...p }));
  if (r.length <= 1) return r;
  const orig = pts.map(p => ({ ...p }));
  for (let t = 0; t < iters; t++) {
    const f = r.map(() => ({ fx: 0, fy: 0 }));
    for (let i = 0; i < r.length; i++) {
      for (let j = i + 1; j < r.length; j++) {
        const dx = r[i].x - r[j].x, dy = r[i].y - r[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < minDist && d > 0.001) {
          const s = ((minDist - d) / minDist) * 0.4;
          const nx = dx / d, ny = dy / d;
          f[i].fx += nx * s; f[i].fy += ny * s;
          f[j].fx -= nx * s; f[j].fy -= ny * s;
        }
      }
    }
    for (let i = 0; i < r.length; i++) {
      f[i].fx += (orig[i].x - r[i].x) * 0.15;
      f[i].fy += (orig[i].y - r[i].y) * 0.15;
    }
    const damp = 1 - (t / iters) * 0.5;
    for (let i = 0; i < r.length; i++) {
      r[i].x = Math.min(0.95, Math.max(0.05, r[i].x + f[i].fx * damp));
      r[i].y = Math.min(0.98, Math.max(0.02, r[i].y + f[i].fy * damp));
    }
  }
  return r;
}

/* ── Build annotations from sections ── */
function buildAnnotations(sections: AuditSection[], ai?: AnnotationCoordinate[]): Annotation[] {
  const items: { finding: Finding; sectionName: string; sectionId: string; gi: number }[] = [];
  let idx = 0;
  for (const sec of sections) {
    for (const f of sec.findings) {
      if (f.type === "issue" || f.type === "warning") {
        items.push({ finding: f, sectionName: sec.name, sectionId: sec.id, gi: idx++ });
      }
    }
  }
  const raw = items.map((f, i) => {
    let x = 0.15 + (i % 3) * 0.35, y = (i + 1) / (items.length + 1);
    if (ai) {
      const m = ai.find(c => c.findingIndex === f.gi) ??
        ai.find(c => c.title.toLowerCase().includes(f.finding.title.toLowerCase().slice(0, 20)) ||
          f.finding.title.toLowerCase().includes(c.title.toLowerCase().slice(0, 20)));
      if (m) { x = m.x; y = m.y; }
    }
    return { x: Math.min(0.95, Math.max(0.05, x)), y: Math.min(0.98, Math.max(0.02, y)) };
  });
  const spread = spreadDots(raw);
  return items.map((f, i) => ({
    id: `${f.sectionId}-${i}`,
    index: i + 1,
    x: spread[i].x,
    y: spread[i].y,
    severity: f.finding.severity || (f.finding.impact === "high" ? "high" : f.finding.impact === "medium" ? "medium" : "low"),
    finding: f.finding,
    sectionName: f.sectionName,
    sectionId: f.sectionId,
  }));
}

/* ═══════════════════════════════════════════════════════
   Dot — animated marker on screenshot
   ═══════════════════════════════════════════════════════ */

const Dot = memo(function Dot({
  ann, isActive, isHovered, onClick, onHover, delay,
}: {
  ann: Annotation; isActive: boolean; isHovered: boolean;
  onClick: () => void; onHover: (h: boolean) => void; delay: number;
}) {
  const { color } = sevStyle(ann.severity);
  const on = isActive || isHovered;

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className="absolute z-10 group"
      style={{ left: `${ann.x * 100}%`, top: `${ann.y * 100}%`, transform: "translate(-50%, -50%)" }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, type: "spring", stiffness: 500, damping: 25 }}
    >
      {/* Pulse ring */}
      <AnimatePresence>
        {on && (
          <motion.span
            className="absolute inset-[-10px] rounded-full"
            style={{ border: `2px solid ${color}`, opacity: 0.3 }}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: [1, 1.4], opacity: [0.4, 0] }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      {/* Dot body */}
      <motion.span
        className="relative flex items-center justify-center rounded-full text-white font-bold"
        animate={{
          width: on ? 28 : 20,
          height: on ? 28 : 20,
          fontSize: on ? 11 : 9,
          boxShadow: on
            ? `0 0 0 2px var(--s1), 0 0 20px ${color}`
            : "0 0 0 2px var(--s1), 0 2px 6px rgba(0,0,0,0.3)",
        }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
        style={{ background: color }}
        whileHover={{ scale: 1.15 }}
      >
        {ann.index}
      </motion.span>

      {/* Tooltip */}
      <motion.span
        className={`absolute whitespace-normal text-[10px] font-medium px-2.5 py-2 rounded-xl pointer-events-none ${
          ann.x > 0.65 ? "right-full mr-3" : "left-full ml-3"
        } top-1/2 -translate-y-1/2`}
        style={{
          background: "var(--s1)",
          color: "var(--foreground)",
          maxWidth: 200,
          lineHeight: 1.4,
          backdropFilter: "blur(16px)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px var(--border)",
          opacity: on ? 1 : 0,
          transition: "opacity 0.15s",
        }}
      >
        {ann.finding.title}
      </motion.span>
    </motion.button>
  );
});

/* ═══════════════════════════════════════════════════════
   Card — finding in right panel
   ═══════════════════════════════════════════════════════ */

const Card = memo(function Card({
  ann, isActive, isHovered, onClick, onHover,
}: {
  ann: Annotation; isActive: boolean; isHovered: boolean;
  onClick: () => void; onHover: (h: boolean) => void;
}) {
  const { color, bg } = sevStyle(ann.severity);
  const on = isActive || isHovered;

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className="w-full text-left rounded-xl transition-colors duration-150 relative"
      style={{ padding: "10px 12px" }}
      animate={{
        backgroundColor: on ? bg : "transparent",
      }}
      layout
    >
      {/* Active left bar */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
            style={{ background: color }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            exit={{ scaleY: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          />
        )}
      </AnimatePresence>

      <div className="flex items-start gap-2.5">
        {/* Number badge */}
        <motion.span
          className="shrink-0 w-[20px] h-[20px] rounded-full flex items-center justify-center text-[9px] font-bold text-white mt-0.5"
          style={{ background: color }}
          animate={{ scale: on ? 1.1 : 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          {ann.index}
        </motion.span>

        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-foreground/70 leading-snug">{ann.finding.title}</p>

          {/* Meta */}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[9px] font-semibold uppercase" style={{ color, opacity: 0.8 }}>
              {ann.severity}
            </span>
            <span className="text-[9px] text-foreground/20">·</span>
            <span className="text-[9px] text-foreground/25">{ann.sectionName}</span>
          </div>

          {/* Expanded detail */}
          <div
            style={{
              display: "grid",
              gridTemplateRows: isActive ? "1fr" : "0fr",
              transition: "grid-template-rows 300ms cubic-bezier(0.33, 1, 0.68, 1)",
            }}
          >
            <div className="overflow-hidden">
              <div className="pt-2.5 flex flex-col gap-2">
                <p className="text-[11px] text-foreground/45 leading-relaxed">{ann.finding.desc}</p>
                {ann.finding.whyItMatters && (
                  <div className="rounded-lg p-2.5" style={{ background: "var(--s2)" }}>
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-foreground/25 mb-1">Why it matters</p>
                    <p className="text-[11px] text-foreground/40 leading-relaxed">{ann.finding.whyItMatters}</p>
                  </div>
                )}
                {ann.finding.recommendedFix && (
                  <div className="rounded-lg p-2.5" style={{ background: bg }}>
                    <p className="text-[9px] font-semibold uppercase tracking-wider mb-1" style={{ color, opacity: 0.6 }}>Fix</p>
                    <p className="text-[11px] leading-relaxed" style={{ color, opacity: 0.8 }}>{ann.finding.recommendedFix}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <motion.div
          animate={{ rotate: isActive ? 90 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="shrink-0 mt-1"
        >
          <ChevronDown className="h-3 w-3 text-foreground/15" style={{ transform: "rotate(-90deg)" }} />
        </motion.div>
      </div>
    </motion.button>
  );
});

/* ═══════════════════════════════════════════════════════
   Heatmap canvas (preserved, restyled)
   ═══════════════════════════════════════════════════════ */

function HeatmapCanvas({ zones, pageHeight, viewportWidth }: { zones: HeatmapZone[]; pageHeight: number; viewportWidth: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cvs = ref.current;
    if (!cvs || !zones.length) return;
    const p = cvs.parentElement;
    if (!p) return;
    const w = p.clientWidth, h = p.clientHeight || (w * (pageHeight / viewportWidth));
    cvs.width = w; cvs.height = h;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    for (const z of zones) {
      const x = (z.x / viewportWidth) * w, y = (z.y / pageHeight) * h, r = (z.radius / viewportWidth) * w;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(255,0,0,${z.intensity * 0.4})`);
      g.addColorStop(0.5, `rgba(255,165,0,${z.intensity * 0.2})`);
      g.addColorStop(1, "rgba(255,165,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }, [zones, pageHeight, viewportWidth]);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none opacity-50" style={{ mixBlendMode: "screen" }} />;
}

/* ═══════════════════════════════════════════════════════
   Main — AnnotatedView
   ═══════════════════════════════════════════════════════ */

interface AnnotatedViewProps {
  data: UXAuditResult;
  screenshotUrl: string;
  heatmapZones?: HeatmapZone[];
  pageHeight?: number;
  viewportWidth?: number;
  annotationCoordinates?: AnnotationCoordinate[];
  onClose?: () => void;
}

export function AnnotatedView({
  data, screenshotUrl, heatmapZones,
  pageHeight = 3000, viewportWidth = 1280,
  annotationCoordinates, onClose,
}: AnnotatedViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showDots, setShowDots] = useState(true);

  const leftRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const all = useMemo(() => buildAnnotations(data.sections, annotationCoordinates), [data.sections, annotationCoordinates]);
  const filtered = useMemo(() => filter === "all" ? all : all.filter(a => a.severity === filter), [all, filter]);

  const sevCounts = useMemo(() => {
    const c: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    all.forEach(a => { c[a.severity] = (c[a.severity] || 0) + 1; });
    return c;
  }, [all]);

  const onDotClick = useCallback((id: string) => {
    setActiveId(p => p === id ? null : id);
    const el = cardRefs.current[id];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const onCardClick = useCallback((id: string) => {
    const wasActive = activeId === id;
    setActiveId(wasActive ? null : id);
    if (!wasActive && leftRef.current) {
      const ann = all.find(a => a.id === id);
      if (ann) {
        const h = leftRef.current.scrollHeight;
        leftRef.current.scrollTo({ top: Math.max(0, ann.y * h - leftRef.current.clientHeight / 3), behavior: "smooth" });
      }
    }
  }, [activeId, all]);

  const onHover = useCallback((id: string, h: boolean) => setHoveredId(h ? id : null), []);

  const FILTERS = ["all", "critical", "high", "medium", "low"] as const;

  return (
    <div className="relative flex flex-col" style={{ height: "calc(100vh - 80px)" }}>

      {/* ── Side-by-side panels ── */}
      <div className="flex-1 flex min-h-0">

        {/* LEFT: Screenshot */}
        <div
          ref={leftRef}
          className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col"
          style={{ background: "var(--s1)" }}
        >
          {/* Browser chrome */}
          <div className="flex items-center gap-1.5 px-3.5 py-2 shrink-0 sticky top-0 z-20" style={{ background: "var(--s1)", boxShadow: "0 1px 0 var(--border)" }}>
            <span className="w-[6px] h-[6px] rounded-full" style={{ background: "var(--foreground)", opacity: 0.08 }} />
            <span className="w-[6px] h-[6px] rounded-full" style={{ background: "var(--foreground)", opacity: 0.08 }} />
            <span className="w-[6px] h-[6px] rounded-full" style={{ background: "var(--foreground)", opacity: 0.08 }} />
            <div className="flex-1 mx-2 h-[18px] rounded-md flex items-center px-2.5" style={{ background: "var(--s3)" }}>
              <span className="text-[8px] text-foreground/10 truncate font-mono">Inspect</span>
            </div>
          </div>
          <div className="relative w-full">
            <motion.img
              layoutId="audit-screenshot"
              src={screenshotUrl}
              alt="Annotated page"
              className="w-full h-auto block"
              draggable={false}
              transition={{ layout: { type: "spring", stiffness: 200, damping: 0.8 * 2 * Math.sqrt(200) } }}
            />
            {showHeatmap && heatmapZones && (
              <HeatmapCanvas zones={heatmapZones} pageHeight={pageHeight} viewportWidth={viewportWidth} />
            )}
            {showDots && !showHeatmap && filtered.map((ann, i) => (
              <Dot
                key={ann.id}
                ann={ann}
                isActive={activeId === ann.id}
                isHovered={hoveredId === ann.id}
                onClick={() => onDotClick(ann.id)}
                onHover={h => onHover(ann.id, h)}
                delay={0.15 + i * 0.03}
              />
            ))}
          </div>
        </div>

        {/* RIGHT: Findings panel */}
        <motion.div
          className="w-[360px] shrink-0 overflow-y-auto flex flex-col md:flex"
          style={{ background: "var(--s1)", boxShadow: "-1px 0 0 rgba(255,255,255,0.04)" }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 28 }}
        >
          {/* Panel header with filters */}
          <div className="sticky top-0 z-10 px-4 py-3 flex flex-col gap-2" style={{ background: "var(--s1)" }}>
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold text-foreground/50">
                {filtered.length} issue{filtered.length !== 1 ? "s" : ""}
              </p>
              <p className="text-[10px] text-foreground/15">Click to locate</p>
            </div>
            <div className="flex items-center gap-1">
              {FILTERS.map(sev => {
                const count = sev === "all" ? all.length : sevCounts[sev] || 0;
                if (sev !== "all" && count === 0) return null;
                const isActive = filter === sev;
                return (
                  <motion.button
                    key={sev}
                    onClick={() => setFilter(sev)}
                    className="text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors"
                    style={{
                      background: isActive ? (sev === "all" ? "var(--foreground)" : sevStyle(sev).color) : "var(--s2)",
                      color: isActive ? (sev === "all" ? "var(--background)" : "white") : "var(--foreground)",
                      opacity: isActive ? 1 : 0.3,
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {sev === "all" ? `All (${count})` : `${sev.charAt(0).toUpperCase() + sev.slice(1)} (${count})`}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Cards */}
          <div className="flex-1 px-2 pb-4 flex flex-col gap-0.5">
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <motion.div
                  key="empty"
                  className="flex-1 flex items-center justify-center text-[11px] text-foreground/20 py-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  No issues at this severity
                </motion.div>
              ) : (
                filtered.map(ann => (
                  <motion.div
                    key={ann.id}
                    ref={el => { cardRefs.current[ann.id] = el; }}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Card
                      ann={ann}
                      isActive={activeId === ann.id}
                      isHovered={hoveredId === ann.id}
                      onClick={() => onCardClick(ann.id)}
                      onHover={h => onHover(ann.id, h)}
                    />
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* ── Floating bottom bar ── */}
      <motion.div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-2 rounded-2xl"
        style={{
          background: "var(--s1)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px var(--border)",
          backdropFilter: "blur(16px)",
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Dots toggle */}
        <motion.button
          onClick={() => setShowDots(!showDots)}
          className="p-1.5 rounded-xl transition-colors"
          style={{ background: showDots ? "var(--s2)" : "transparent" }}
          whileTap={{ scale: 0.9 }}
        >
          {showDots ? <Eye className="h-3.5 w-3.5 text-foreground/40" /> : <EyeOff className="h-3.5 w-3.5 text-foreground/20" />}
        </motion.button>

        {/* Heatmap toggle */}
        {heatmapZones && heatmapZones.length > 0 && (
          <motion.button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className="p-1.5 rounded-xl transition-colors"
            style={{ background: showHeatmap ? "oklch(0.55 0.17 20 / 15%)" : "transparent" }}
            whileTap={{ scale: 0.9 }}
          >
            <Flame className={`h-3.5 w-3.5 ${showHeatmap ? "text-red-500" : "text-foreground/20"}`} />
          </motion.button>
        )}

        {onClose && (
          <>
            <span className="w-px h-4 mx-0.5" style={{ background: "var(--border)" }} />
            <motion.button
              onClick={onClose}
              className="p-1.5 rounded-xl transition-colors"
              style={{ background: "oklch(0.55 0.17 20 / 10%)" }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="h-3.5 w-3.5" style={{ color: "var(--score-low)" }} />
            </motion.button>
          </>
        )}
      </motion.div>
    </div>
  );
}
