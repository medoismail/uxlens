"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Target, Zap, Shield, Eye, Search, Layers, Pen,
  ChevronRight, Flame, Maximize2, Minimize2,
} from "lucide-react";
import type { UXAuditResult, AuditSection, Finding, HeatmapZone } from "@/lib/types";

/* ═══════════════════════════════════════════════════════
   Annotated View v2 — Margin annotations + highlight bands
   Like PDF review tools: markers on the edge, bands on hover
   ═══════════════════════════════════════════════════════ */

/**
 * Map each audit section to its approximate vertical region on the page.
 * These are ordered top-to-bottom as they typically appear on a landing page.
 * Y values are 0-1 normalized percentages of total page height.
 */
const SECTION_REGIONS: { id: string; yCenter: number }[] = [
  { id: "hero",           yCenter: 0.06 },
  { id: "firstscreen",    yCenter: 0.10 },
  { id: "messaging",      yCenter: 0.22 },
  { id: "cta",            yCenter: 0.15 },
  { id: "trust",          yCenter: 0.45 },
  { id: "structure",      yCenter: 0.60 },
  { id: "contradictions",  yCenter: 0.35 },
];

function getSectionY(sectionId: string): number {
  return SECTION_REGIONS.find(s => s.id === sectionId)?.yCenter ?? 0.5;
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  hero: <Target className="h-3 w-3" />,
  messaging: <Pen className="h-3 w-3" />,
  cta: <Zap className="h-3 w-3" />,
  trust: <Shield className="h-3 w-3" />,
  structure: <Layers className="h-3 w-3" />,
  contradictions: <Search className="h-3 w-3" />,
  firstscreen: <Eye className="h-3 w-3" />,
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#dc2626",
  high:     "#ea580c",
  medium:   "#ca8a04",
  low:      "#16a34a",
};

const SEVERITY_BG: Record<string, string> = {
  critical: "rgba(220,38,38,0.08)",
  high:     "rgba(234,88,12,0.06)",
  medium:   "rgba(202,138,4,0.06)",
  low:      "rgba(22,163,74,0.05)",
};

function scoreColor(s: number) {
  if (s >= 75) return "var(--score-high)";
  if (s >= 50) return "var(--score-mid)";
  return "var(--score-low)";
}

interface Annotation {
  id: string;
  index: number;       // global numbering (1, 2, 3...)
  y: number;           // 0-1 normalized Y on screenshot
  severity: string;
  finding: Finding;
  sectionName: string;
  sectionId: string;
}

/** Generate annotations sorted top-to-bottom */
function generateAnnotations(sections: AuditSection[]): Annotation[] {
  const raw: Annotation[] = [];
  let idx = 0;

  for (const section of sections) {
    const baseY = getSectionY(section.id);
    const issues = section.findings.filter(f => f.type === "issue" || f.type === "warning");

    issues.forEach((finding, i) => {
      const severity = finding.severity || (finding.impact === "high" ? "high" : finding.impact === "medium" ? "medium" : "low");
      // Spread findings within section: offset each by ~2% so they don't overlap
      const y = Math.min(0.95, Math.max(0.02, baseY + (i - issues.length / 2) * 0.025));

      raw.push({
        id: `${section.id}-${i}`,
        index: idx + 1,
        y,
        severity,
        finding,
        sectionName: section.name,
        sectionId: section.id,
      });
      idx++;
    });
  }

  // Sort by Y position and re-number
  raw.sort((a, b) => a.y - b.y);
  raw.forEach((a, i) => { a.index = i + 1; });

  return raw;
}

/* ── Finding Card in right panel ── */
function FindingCard({
  ann,
  isActive,
  onClick,
}: {
  ann: Annotation;
  isActive: boolean;
  onClick: () => void;
}) {
  const color = SEVERITY_COLORS[ann.severity] || SEVERITY_COLORS.medium;
  const bg = SEVERITY_BG[ann.severity] || SEVERITY_BG.medium;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl p-3.5 transition-all duration-200 group ${
        isActive ? "shadow-lg" : "hover:shadow-sm"
      }`}
      style={{
        background: isActive ? bg : "var(--s1)",
        border: `1.5px solid ${isActive ? color : "var(--border)"}`,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Number badge */}
        <span
          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
          style={{ background: color }}
        >
          {ann.index}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-foreground leading-snug">
            {ann.finding.title}
          </p>
          <p className="text-[11px] text-foreground/50 mt-1 line-clamp-2 leading-relaxed">
            {ann.finding.desc}
          </p>

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-2">
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ background: bg, color }}
            >
              {ann.severity}
            </span>
            <span className="text-[10px] text-foreground/35 flex items-center gap-1">
              {SECTION_ICONS[ann.sectionId]}
              {ann.sectionName}
            </span>
          </div>

          {/* Expanded detail when active */}
          {isActive && (
            <div className="mt-3 pt-3 flex flex-col gap-2" style={{ borderTop: `1px solid ${color}22` }}>
              {ann.finding.whyItMatters && (
                <p className="text-[11px] text-foreground/55 leading-relaxed">
                  <span className="font-semibold text-foreground/65">Impact: </span>
                  {ann.finding.whyItMatters}
                </p>
              )}
              {ann.finding.recommendedFix && (
                <div className="rounded-lg p-2.5" style={{ background: `${color}0a` }}>
                  <p className="text-[11px] leading-relaxed font-medium" style={{ color }}>
                    ✦ {ann.finding.recommendedFix}
                  </p>
                </div>
              )}
              {ann.finding.behavioralMechanism && (
                <p className="text-[10px] text-foreground/40 leading-relaxed italic">
                  ↳ {ann.finding.behavioralMechanism}
                </p>
              )}
            </div>
          )}
        </div>

        <ChevronRight
          className={`h-3.5 w-3.5 shrink-0 mt-1 text-foreground/25 transition-transform duration-200 ${
            isActive ? "rotate-90" : "group-hover:translate-x-0.5"
          }`}
        />
      </div>
    </button>
  );
}

/* ── Margin marker on the screenshot edge ── */
function MarginMarker({
  ann,
  isActive,
  onClick,
  side,
}: {
  ann: Annotation;
  isActive: boolean;
  onClick: () => void;
  side: "left" | "right";
}) {
  const color = SEVERITY_COLORS[ann.severity] || SEVERITY_COLORS.medium;

  return (
    <button
      onClick={onClick}
      className="absolute z-10 transition-all duration-200 group"
      style={{
        top: `${ann.y * 100}%`,
        [side]: 0,
        transform: "translateY(-50%)",
      }}
      title={`#${ann.index}: ${ann.finding.title}`}
    >
      {/* The tab/marker */}
      <div
        className={`flex items-center gap-1 transition-all duration-200 ${
          side === "right" ? "rounded-l-lg pl-2 pr-1.5" : "rounded-r-lg pr-2 pl-1.5"
        } ${isActive ? "py-1.5 shadow-lg" : "py-1 group-hover:py-1.5"}`}
        style={{
          background: isActive ? color : `${color}dd`,
          boxShadow: isActive ? `0 0 16px ${color}44` : undefined,
        }}
      >
        <span className="text-[10px] font-bold text-white leading-none">
          {ann.index}
        </span>
      </div>
    </button>
  );
}

/* ── Highlight band across screenshot ── */
function HighlightBand({
  y,
  color,
  isActive,
}: {
  y: number;
  color: string;
  isActive: boolean;
}) {
  if (!isActive) return null;

  return (
    <div
      className="absolute left-0 right-0 z-[5] pointer-events-none transition-all duration-300"
      style={{
        top: `${y * 100}%`,
        transform: "translateY(-50%)",
        height: "48px",
        background: `linear-gradient(180deg, transparent 0%, ${color}15 30%, ${color}20 50%, ${color}15 70%, transparent 100%)`,
        borderTop: `1.5px solid ${color}40`,
        borderBottom: `1.5px solid ${color}40`,
      }}
    />
  );
}

/* ── Floating score badge ── */
function ScoreBadge({ score, grade }: { score: number; grade: string }) {
  const color = scoreColor(score);
  const circ = 2 * Math.PI * 16;
  const offset = circ - (score / 100) * circ;

  return (
    <div
      className="sticky top-3 z-20 ml-3 mb-3 inline-flex items-center gap-2 rounded-xl px-3 py-2 shadow-lg backdrop-blur-md"
      style={{ background: "rgba(255,255,255,0.93)", border: "1px solid rgba(0,0,0,0.06)" }}
    >
      <div className="relative w-[34px] h-[34px]">
        <svg className="-rotate-90 w-full h-full" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="16" fill="none" strokeWidth="3" stroke="rgba(0,0,0,0.05)" />
          <circle
            cx="20" cy="20" r="16" fill="none" strokeWidth="3" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            style={{ stroke: color }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold" style={{ color }}>
          {score}
        </span>
      </div>
      <div>
        <p className="text-[11px] font-semibold text-gray-900 leading-none">{grade}</p>
        <p className="text-[9px] text-gray-400">UX Score</p>
      </div>
    </div>
  );
}

/* ── Issue count summary ── */
function IssueSummary({ annotations }: { annotations: Annotation[] }) {
  const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  annotations.forEach(a => { counts[a.severity] = (counts[a.severity] || 0) + 1; });

  return (
    <div className="flex items-center gap-2.5 text-[11px]">
      {Object.entries(counts).filter(([, c]) => c > 0).map(([sev, count]) => (
        <span key={sev} className="flex items-center gap-1 font-medium" style={{ color: SEVERITY_COLORS[sev] }}>
          <span className="w-[7px] h-[7px] rounded-full" style={{ background: SEVERITY_COLORS[sev] }} />
          {count} {sev.charAt(0).toUpperCase() + sev.slice(1)}
        </span>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════ */

interface AnnotatedViewProps {
  data: UXAuditResult;
  screenshotUrl: string;
  heatmapZones?: HeatmapZone[];
  pageHeight?: number;
  viewportWidth?: number;
}

export function AnnotatedView({
  data,
  screenshotUrl,
  heatmapZones,
  pageHeight = 3000,
  viewportWidth = 1280,
}: AnnotatedViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);

  const screenshotRef = useRef<HTMLDivElement>(null);
  const findingsRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const allAnnotations = generateAnnotations(data.sections);
  const filtered = filter === "all"
    ? allAnnotations
    : allAnnotations.filter(a => a.severity === filter);

  const activeAnn = allAnnotations.find(a => a.id === activeId) || null;

  // Click marker → scroll finding into view
  const handleMarkerClick = useCallback((id: string) => {
    setActiveId(prev => prev === id ? null : id);
    const el = cardRefs.current[id];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  // Click finding → scroll screenshot to that region
  const handleCardClick = useCallback((id: string) => {
    const wasActive = activeId === id;
    setActiveId(wasActive ? null : id);

    if (!wasActive) {
      const ann = allAnnotations.find(a => a.id === id);
      if (ann && screenshotRef.current) {
        const target = ann.y * screenshotRef.current.scrollHeight - screenshotRef.current.clientHeight / 3;
        screenshotRef.current.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
      }
    }
  }, [activeId, allAnnotations]);

  return (
    <div className="w-full flex flex-col" style={{ height: "calc(100vh - 56px)" }}>
      {/* ── Top toolbar ── */}
      <div
        className="shrink-0 flex items-center justify-between px-4 py-2 border-b"
        style={{ background: "var(--s1)", borderColor: "var(--border)" }}
      >
        <IssueSummary annotations={allAnnotations} />

        <div className="flex items-center gap-1.5">
          {/* Filter pills */}
          {(["all", "critical", "high", "medium", "low"] as const).map(sev => {
            const count = sev === "all" ? allAnnotations.length : allAnnotations.filter(a => a.severity === sev).length;
            if (sev !== "all" && count === 0) return null;
            return (
              <button
                key={sev}
                onClick={() => setFilter(sev)}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-md transition-all ${
                  filter === sev ? "text-white shadow-sm" : "text-foreground/40 hover:text-foreground/55"
                }`}
                style={{
                  background: filter === sev
                    ? (sev === "all" ? "var(--brand)" : SEVERITY_COLORS[sev])
                    : "transparent",
                }}
              >
                {sev === "all" ? `All ${count}` : count}
              </button>
            );
          })}

          <span className="w-px h-4 mx-1" style={{ background: "var(--border)" }} />

          {/* Heatmap toggle */}
          {heatmapZones && heatmapZones.length > 0 && (
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`text-[10px] font-semibold px-2.5 py-1 rounded-md transition-all ${
                showHeatmap ? "text-white shadow-sm" : "text-foreground/40 hover:text-foreground/55"
              }`}
              style={{ background: showHeatmap ? "#ef4444" : "transparent" }}
            >
              🔥
            </button>
          )}

          {/* Panel toggle */}
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className="text-foreground/35 hover:text-foreground/55 transition-colors p-1"
          >
            {panelOpen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Main split ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* LEFT: Screenshot + margin markers + highlight bands */}
        <div
          ref={screenshotRef}
          className={`relative overflow-y-auto overflow-x-hidden transition-all duration-300 ${
            panelOpen ? "flex-[3]" : "flex-1"
          }`}
          style={{ background: "var(--s2)" }}
        >
          <ScoreBadge score={data.overallScore} grade={data.grade} />

          <div className="relative mx-auto" style={{ maxWidth: "720px" }}>
            {/* The screenshot image with shadow */}
            <div className="relative mx-4 mb-6 rounded-lg overflow-hidden shadow-xl border" style={{ borderColor: "var(--border)" }}>
              <img
                src={screenshotUrl}
                alt="Page screenshot"
                className="w-full h-auto block"
                draggable={false}
              />

              {/* Heatmap canvas overlay */}
              {showHeatmap && heatmapZones && (
                <HeatmapCanvas zones={heatmapZones} pageHeight={pageHeight} viewportWidth={viewportWidth} />
              )}

              {/* Highlight band for active annotation */}
              {activeAnn && (
                <HighlightBand
                  y={activeAnn.y}
                  color={SEVERITY_COLORS[activeAnn.severity] || SEVERITY_COLORS.medium}
                  isActive={true}
                />
              )}

              {/* Margin markers on the RIGHT edge */}
              {filtered.map(ann => (
                <MarginMarker
                  key={ann.id}
                  ann={ann}
                  isActive={activeId === ann.id}
                  onClick={() => handleMarkerClick(ann.id)}
                  side="right"
                />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Findings panel */}
        {panelOpen && (
          <div
            ref={findingsRef}
            className="flex-[2] max-w-[420px] min-w-[300px] overflow-y-auto border-l flex flex-col"
            style={{ borderColor: "var(--border)", background: "var(--background)" }}
          >
            {/* Panel header */}
            <div
              className="sticky top-0 z-10 px-4 py-3 border-b"
              style={{ background: "var(--background)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[13px] font-semibold text-foreground">
                    {filtered.length} Issue{filtered.length !== 1 ? "s" : ""} Found
                  </h3>
                  <p className="text-[10px] text-foreground/40 mt-0.5">
                    Click an issue to highlight on page
                  </p>
                </div>
                <Flame className="h-4 w-4 text-foreground/20" />
              </div>
            </div>

            {/* Cards */}
            <div className="flex-1 p-3 flex flex-col gap-2">
              {filtered.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-[12px] text-foreground/35 py-12">
                  No issues at this severity
                </div>
              ) : (
                filtered.map(ann => (
                  <div key={ann.id} ref={el => { cardRefs.current[ann.id] = el; }}>
                    <FindingCard
                      ann={ann}
                      isActive={activeId === ann.id}
                      onClick={() => handleCardClick(ann.id)}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Heatmap Canvas ── */
function HeatmapCanvas({
  zones,
  pageHeight,
  viewportWidth,
}: {
  zones: HeatmapZone[];
  pageHeight: number;
  viewportWidth: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || zones.length === 0) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const w = parent.clientWidth;
    const h = parent.clientHeight || (w * (pageHeight / viewportWidth));
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);

    for (const zone of zones) {
      const x = (zone.x / viewportWidth) * w;
      const y = (zone.y / pageHeight) * h;
      const r = (zone.radius / viewportWidth) * w;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, `rgba(255,0,0,${zone.intensity * 0.4})`);
      grad.addColorStop(0.5, `rgba(255,165,0,${zone.intensity * 0.2})`);
      grad.addColorStop(1, "rgba(255,165,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }, [zones, pageHeight, viewportWidth]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-60"
      style={{ mixBlendMode: "multiply" }}
    />
  );
}
