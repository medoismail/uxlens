"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  ChevronRight, Flame, AlertTriangle, AlertCircle, Info,
  ChevronDown, Eye, EyeOff,
} from "lucide-react";
import type { UXAuditResult, AuditSection, Finding, HeatmapZone, AnnotationCoordinate } from "@/lib/types";

/* ═══════════════════════════════════════════════════════
   Annotated View v5 — Figma-style inspect mode
   Side-by-side: screenshot (left) + findings (right)
   Both scroll independently, always visible together
   ═══════════════════════════════════════════════════════ */

const SEV_COLOR: Record<string, string> = {
  critical: "#dc2626",
  high:     "#ea580c",
  medium:   "#ca8a04",
  low:      "#16a34a",
};
const SEV_BG: Record<string, string> = {
  critical: "rgba(220,38,38,0.07)",
  high:     "rgba(234,88,12,0.06)",
  medium:   "rgba(202,138,4,0.05)",
  low:      "rgba(22,163,74,0.04)",
};

function scoreColor(s: number) {
  if (s >= 75) return "var(--score-high)";
  if (s >= 50) return "var(--score-mid)";
  return "var(--score-low)";
}

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

/* ── Force-directed jitter ── */
function spreadDots(
  pts: { x: number; y: number }[],
  iters = 30,
  minDist = 0.04,
): { x: number; y: number }[] {
  const r = pts.map(p => ({ ...p }));
  if (r.length <= 1) return r;
  const orig = pts.map(p => ({ ...p }));

  for (let t = 0; t < iters; t++) {
    const f = r.map(() => ({ fx: 0, fy: 0 }));
    for (let i = 0; i < r.length; i++) {
      for (let j = i + 1; j < r.length; j++) {
        const dx = r[i].x - r[j].x;
        const dy = r[i].y - r[j].y;
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
        ai.find(c =>
          c.title.toLowerCase().includes(f.finding.title.toLowerCase().slice(0, 20)) ||
          f.finding.title.toLowerCase().includes(c.title.toLowerCase().slice(0, 20))
        );
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

/* ── Dot on screenshot ── */
function Dot({
  ann, isActive, isHovered, onClick, onHover,
}: {
  ann: Annotation; isActive: boolean; isHovered: boolean;
  onClick: () => void; onHover: (h: boolean) => void;
}) {
  const c = SEV_COLOR[ann.severity] || SEV_COLOR.medium;
  const on = isActive || isHovered;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className="absolute z-10 transition-all duration-200 group"
      style={{
        left: `${ann.x * 100}%`,
        top: `${ann.y * 100}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {on && (
        <span className="absolute inset-[-8px] rounded-full animate-ping" style={{ background: `${c}18`, animationDuration: "1.5s" }} />
      )}
      {on && (
        <span className="absolute inset-[-5px] rounded-full" style={{ background: `${c}22` }} />
      )}
      <span
        className={`relative flex items-center justify-center rounded-full text-white font-bold transition-all duration-150 ${
          on ? "w-7 h-7 text-[11px]" : "w-[21px] h-[21px] text-[9px] group-hover:scale-110"
        }`}
        style={{
          background: c,
          boxShadow: on
            ? `0 0 0 2.5px white, 0 0 16px ${c}44, 0 2px 8px rgba(0,0,0,0.15)`
            : `0 0 0 2px white, 0 1px 4px rgba(0,0,0,0.2)`,
        }}
      >
        {ann.index}
      </span>
      {/* Tooltip — flip near right edge */}
      <span
        className={`absolute whitespace-normal text-[10px] font-medium px-2 py-1.5 rounded-lg shadow-xl pointer-events-none transition-opacity duration-150 ${
          on ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        } ${ann.x > 0.65 ? "right-full mr-2.5" : "left-full ml-2.5"} top-1/2 -translate-y-1/2`}
        style={{ background: "rgba(15,15,15,0.9)", color: "#fff", maxWidth: 180, lineHeight: 1.35, backdropFilter: "blur(6px)" }}
      >
        {ann.finding.title.length > 45 ? ann.finding.title.slice(0, 45) + "…" : ann.finding.title}
      </span>
    </button>
  );
}

/* ── Finding card in right panel ── */
function Card({
  ann, isActive, isHovered, onClick, onHover,
}: {
  ann: Annotation; isActive: boolean; isHovered: boolean;
  onClick: () => void; onHover: (h: boolean) => void;
}) {
  const c = SEV_COLOR[ann.severity] || SEV_COLOR.medium;
  const bg = SEV_BG[ann.severity] || SEV_BG.medium;
  const on = isActive || isHovered;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={`w-full text-left rounded-lg transition-all duration-200 group ${on ? "shadow-sm" : ""}`}
      style={{
        background: on ? bg : "transparent",
        border: `1px solid ${on ? c + "30" : "transparent"}`,
        padding: "10px 12px",
      }}
    >
      <div className="flex items-start gap-2.5">
        {/* Number */}
        <span
          className="shrink-0 w-[22px] h-[22px] rounded-full flex items-center justify-center text-[9px] font-bold text-white mt-0.5"
          style={{ background: c, boxShadow: on ? `0 0 8px ${c}30` : "none" }}
        >
          {ann.index}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-foreground leading-snug">{ann.finding.title}</p>

          {/* Severity + section — compact meta */}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[9px] font-bold uppercase px-1.5 py-[2px] rounded" style={{ background: bg, color: c }}>
              {ann.severity}
            </span>
            <span className="text-[9px] text-foreground/30">{ann.sectionName}</span>
          </div>

          {/* Description — show on active only to keep panel compact */}
          {isActive && (
            <div className="mt-2 flex flex-col gap-2 animate-fade-in">
              <p className="text-[11px] text-foreground/55 leading-relaxed">{ann.finding.desc}</p>
              {ann.finding.whyItMatters && (
                <p className="text-[11px] text-foreground/45 leading-relaxed">
                  <span className="font-medium text-foreground/55">Why it matters: </span>
                  {ann.finding.whyItMatters}
                </p>
              )}
              {ann.finding.recommendedFix && (
                <div className="rounded-md p-2" style={{ background: `${c}08` }}>
                  <p className="text-[11px] leading-relaxed font-medium" style={{ color: c }}>
                    {ann.finding.recommendedFix}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <ChevronRight
          className={`h-3 w-3 shrink-0 mt-1.5 transition-transform duration-150 ${
            isActive ? "rotate-90 text-foreground/35" : "text-foreground/15 group-hover:text-foreground/30"
          }`}
        />
      </div>
    </button>
  );
}

/* ── Heatmap canvas ── */
function HeatmapCanvas({ zones, pageHeight, viewportWidth }: { zones: HeatmapZone[]; pageHeight: number; viewportWidth: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cvs = ref.current;
    if (!cvs || !zones.length) return;
    const p = cvs.parentElement;
    if (!p) return;
    const w = p.clientWidth;
    const h = p.clientHeight || (w * (pageHeight / viewportWidth));
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
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none opacity-60" style={{ mixBlendMode: "multiply" }} />;
}

/* ═══════════════════════════════════════════════════════
   Main — full-viewport side-by-side inspect mode
   Left: screenshot with dots (scrollable)
   Right: finding cards (scrollable)
   ═══════════════════════════════════════════════════════ */

interface AnnotatedViewProps {
  data: UXAuditResult;
  screenshotUrl: string;
  heatmapZones?: HeatmapZone[];
  pageHeight?: number;
  viewportWidth?: number;
  annotationCoordinates?: AnnotationCoordinate[];
}

export function AnnotatedView({
  data, screenshotUrl, heatmapZones,
  pageHeight = 3000, viewportWidth = 1280,
  annotationCoordinates,
}: AnnotatedViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showDots, setShowDots] = useState(true);

  const leftRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const all = useMemo(() => buildAnnotations(data.sections, annotationCoordinates), [data.sections, annotationCoordinates]);
  const filtered = filter === "all" ? all : all.filter(a => a.severity === filter);

  const sevCounts = useMemo(() => {
    const c: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    all.forEach(a => { c[a.severity] = (c[a.severity] || 0) + 1; });
    return c;
  }, [all]);

  // Click dot → scroll right panel to card
  const onDotClick = useCallback((id: string) => {
    setActiveId(p => p === id ? null : id);
    const el = cardRefs.current[id];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  // Click card → scroll left panel to dot
  const onCardClick = useCallback((id: string) => {
    const wasActive = activeId === id;
    setActiveId(wasActive ? null : id);
    if (!wasActive && leftRef.current) {
      const ann = all.find(a => a.id === id);
      if (ann) {
        const h = leftRef.current.scrollHeight;
        const target = ann.y * h - leftRef.current.clientHeight / 3;
        leftRef.current.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
      }
    }
  }, [activeId, all]);

  const onDotHover = useCallback((id: string, h: boolean) => setHoveredId(h ? id : null), []);
  const onCardHover = useCallback((id: string, h: boolean) => setHoveredId(h ? id : null), []);

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 80px)" }}>
      {/* ── Compact top bar ── */}
      <div
        className="shrink-0 flex items-center justify-between px-4 py-2 border-b"
        style={{ background: "var(--background)", borderColor: "var(--border)" }}
      >
        {/* Left: score + counts */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ScoreRing score={data.overallScore} size={28} />
            <span className="text-[12px] font-semibold text-foreground">
              {all.length} issues
            </span>
          </div>
          <div className="flex items-center gap-2">
            {(Object.entries(sevCounts) as [string, number][]).filter(([, c]) => c > 0).map(([sev, count]) => (
              <span key={sev} className="flex items-center gap-1 text-[10px] font-medium" style={{ color: SEV_COLOR[sev] }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: SEV_COLOR[sev] }} />
                {count}
              </span>
            ))}
          </div>
        </div>

        {/* Right: filters + toggles */}
        <div className="flex items-center gap-1">
          {(["all", "critical", "high", "medium", "low"] as const).map(sev => {
            const count = sev === "all" ? all.length : sevCounts[sev] || 0;
            if (sev !== "all" && count === 0) return null;
            return (
              <button
                key={sev}
                onClick={() => setFilter(sev)}
                className={`text-[10px] font-semibold px-2 py-1 rounded-md transition-all ${
                  filter === sev ? "text-white" : "text-foreground/30 hover:text-foreground/50"
                }`}
                style={{ background: filter === sev ? (sev === "all" ? "var(--foreground)" : SEV_COLOR[sev]) : undefined }}
              >
                {sev === "all" ? "All" : sev.charAt(0).toUpperCase() + sev.slice(1)}
              </button>
            );
          })}

          <span className="w-px h-3.5 mx-1" style={{ background: "var(--border)" }} />

          <button onClick={() => setShowDots(!showDots)} className="p-1 text-foreground/30 hover:text-foreground/50 transition-colors">
            {showDots ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>

          {heatmapZones && heatmapZones.length > 0 && (
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`text-[10px] font-semibold px-2 py-1 rounded-md transition-all ${showHeatmap ? "text-white" : "text-foreground/30 hover:text-foreground/50"}`}
              style={{ background: showHeatmap ? "#ef4444" : undefined }}
            >
              Heat
            </button>
          )}
        </div>
      </div>

      {/* ── Side-by-side panels ── */}
      <div className="flex-1 flex min-h-0">

        {/* LEFT: Screenshot with dots — independent scroll */}
        <div
          ref={leftRef}
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{ background: "#f5f5f5" }}
        >
          <div className="p-4">
            <div
              className="relative rounded-xl overflow-hidden mx-auto"
              style={{
                maxWidth: 680,
                border: "1px solid var(--border)",
                boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
              }}
            >
              <img
                src={screenshotUrl}
                alt="Page screenshot"
                className="w-full h-auto block"
                draggable={false}
              />
              {showHeatmap && heatmapZones && (
                <HeatmapCanvas zones={heatmapZones} pageHeight={pageHeight} viewportWidth={viewportWidth} />
              )}
              {showDots && !showHeatmap && filtered.map(ann => (
                <Dot
                  key={ann.id}
                  ann={ann}
                  isActive={activeId === ann.id}
                  isHovered={hoveredId === ann.id}
                  onClick={() => onDotClick(ann.id)}
                  onHover={h => onDotHover(ann.id, h)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Findings panel — independent scroll */}
        <div
          className="w-[340px] shrink-0 overflow-y-auto border-l flex flex-col"
          style={{ borderColor: "var(--border)", background: "var(--background)" }}
        >
          {/* Panel header */}
          <div className="sticky top-0 z-10 px-4 py-3 border-b" style={{ background: "var(--background)", borderColor: "var(--border)" }}>
            <p className="text-[12px] font-semibold text-foreground">
              {filtered.length} Issue{filtered.length !== 1 ? "s" : ""}
            </p>
            <p className="text-[10px] text-foreground/35 mt-0.5">
              Click to locate on screenshot
            </p>
          </div>

          {/* Card list */}
          <div className="flex-1 p-2 flex flex-col gap-0.5">
            {filtered.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-[11px] text-foreground/30 py-8">
                No issues at this severity
              </div>
            ) : (
              filtered.map(ann => (
                <div key={ann.id} ref={el => { cardRefs.current[ann.id] = el; }}>
                  <Card
                    ann={ann}
                    isActive={activeId === ann.id}
                    isHovered={hoveredId === ann.id}
                    onClick={() => onCardClick(ann.id)}
                    onHover={h => onCardHover(ann.id, h)}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile: bottom sheet hint (on small screens right panel would stack) ── */}
      <style>{`
        @media (max-width: 768px) {
          /* Stack vertically on mobile */
          .flex-1.flex.min-h-0 {
            flex-direction: column !important;
          }
          .flex-1.flex.min-h-0 > div:first-child {
            max-height: 50vh;
          }
          .flex-1.flex.min-h-0 > div:last-child {
            width: 100% !important;
            border-left: none !important;
            border-top: 1px solid var(--border);
          }
        }
      `}</style>
    </div>
  );
}

/* ── Tiny score ring ── */
function ScoreRing({ score, size = 28 }: { score: number; size?: number }) {
  const color = scoreColor(score);
  const r = size / 2 - 3;
  const circ = 2 * Math.PI * r;
  const off = circ - (score / 100) * circ;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="-rotate-90 w-full h-full" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="2.5" stroke="var(--border)" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off} style={{ stroke: color }} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-bold" style={{ color, fontSize: size * 0.32 }}>{score}</span>
    </div>
  );
}
