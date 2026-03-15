"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Target, Zap, Shield, Eye, Search, Layers, Pen,
  ChevronRight, X, AlertTriangle, ChevronDown, ChevronUp,
  Flame, Maximize2, Minimize2,
} from "lucide-react";
import type { UXAuditResult, AuditSection, Finding, HeatmapZone } from "@/lib/types";

/* ═══════════════════════════════════════════════════════
   Annotated View — Figma-meets-Lighthouse audit experience
   ═══════════════════════════════════════════════════════ */

/** Map section IDs to approximate Y% positions on a full-page screenshot */
const SECTION_Y_MAP: Record<string, { yStart: number; yEnd: number }> = {
  hero:            { yStart: 0.02, yEnd: 0.15 },
  firstscreen:     { yStart: 0.03, yEnd: 0.18 },
  messaging:       { yStart: 0.12, yEnd: 0.35 },
  cta:             { yStart: 0.08, yEnd: 0.45 },
  trust:           { yStart: 0.35, yEnd: 0.65 },
  structure:       { yStart: 0.50, yEnd: 0.80 },
  contradictions:  { yStart: 0.20, yEnd: 0.70 },
};

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
  critical: "oklch(0.55 0.22 20)",
  high:     "oklch(0.60 0.18 30)",
  medium:   "oklch(0.65 0.18 75)",
  low:      "oklch(0.55 0.15 155)",
};

const SEVERITY_DOT_BG: Record<string, string> = {
  critical: "oklch(0.55 0.22 20 / 15%)",
  high:     "oklch(0.60 0.18 30 / 12%)",
  medium:   "oklch(0.65 0.18 75 / 12%)",
  low:      "oklch(0.55 0.15 155 / 10%)",
};

function scoreColor(s: number) {
  if (s >= 75) return "var(--score-high)";
  if (s >= 50) return "var(--score-mid)";
  return "var(--score-low)";
}

interface AnnotationDot {
  id: string;
  x: number;   // 0-1 normalized
  y: number;   // 0-1 normalized
  severity: string;
  finding: Finding;
  sectionName: string;
  sectionId: string;
}

/** Generate annotation dots from audit sections */
function generateAnnotations(sections: AuditSection[]): AnnotationDot[] {
  const dots: AnnotationDot[] = [];
  let globalIdx = 0;

  for (const section of sections) {
    const yRange = SECTION_Y_MAP[section.id] || { yStart: 0.3, yEnd: 0.7 };
    const issues = section.findings.filter(f => f.type === "issue" || f.type === "warning");

    issues.forEach((finding, idx) => {
      const severity = finding.severity || (finding.impact === "high" ? "high" : finding.impact === "medium" ? "medium" : "low");
      // Distribute dots vertically within section range
      const ySpread = yRange.yEnd - yRange.yStart;
      const y = yRange.yStart + (ySpread * (idx + 0.5)) / Math.max(issues.length, 1);
      // Alternate X position to avoid overlapping dots
      const xBase = 0.15 + (globalIdx % 3) * 0.30;
      const xJitter = (Math.sin(globalIdx * 2.7) * 0.08);
      const x = Math.max(0.08, Math.min(0.92, xBase + xJitter));

      dots.push({
        id: `${section.id}-${idx}`,
        x,
        y: Math.min(0.95, y),
        severity,
        finding,
        sectionName: section.name,
        sectionId: section.id,
      });
      globalIdx++;
    });
  }

  return dots;
}

/* ── Finding Card (compact) ── */
function FindingRow({
  dot,
  isActive,
  onClick,
}: {
  dot: AnnotationDot;
  isActive: boolean;
  onClick: () => void;
}) {
  const severity = dot.severity;
  const color = SEVERITY_COLORS[severity] || SEVERITY_COLORS.medium;
  const bg = SEVERITY_DOT_BG[severity] || SEVERITY_DOT_BG.medium;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl p-3 transition-all duration-200 group border ${
        isActive ? "ring-2 shadow-lg scale-[1.01]" : "hover:shadow-md"
      }`}
      style={{
        background: isActive ? bg : "var(--s1)",
        borderColor: isActive ? color : "var(--border)",
        outlineColor: isActive ? color : undefined,
      }}
    >
      <div className="flex items-start gap-2.5">
        {/* Severity dot */}
        <div
          className={`shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
            isActive ? "animate-pulse" : ""
          }`}
          style={{ background: color, color: "#fff" }}
        >
          {dot.finding.severity?.[0]?.toUpperCase() || "!"}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-foreground leading-tight truncate">
            {dot.finding.title}
          </p>
          <p className="text-[11px] text-foreground/50 mt-0.5 line-clamp-2 leading-relaxed">
            {dot.finding.desc}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span
              className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ background: bg, color }}
            >
              {severity}
            </span>
            <span className="text-[10px] text-foreground/40 flex items-center gap-1">
              {SECTION_ICONS[dot.sectionId]}
              {dot.sectionName}
            </span>
          </div>

          {/* Expanded detail */}
          {isActive && (
            <div className="mt-2.5 pt-2.5 flex flex-col gap-1.5" style={{ borderTop: `1px solid ${color}33` }}>
              {dot.finding.whyItMatters && (
                <p className="text-[11px] text-foreground/60 leading-relaxed">
                  <span className="font-semibold text-foreground/65">Why it matters: </span>
                  {dot.finding.whyItMatters}
                </p>
              )}
              {dot.finding.recommendedFix && (
                <p className="text-[11px] leading-relaxed" style={{ color }}>
                  <span className="font-semibold">Fix: </span>
                  {dot.finding.recommendedFix}
                </p>
              )}
              {dot.finding.behavioralMechanism && (
                <p className="text-[10px] text-foreground/45 leading-relaxed italic">
                  {dot.finding.behavioralMechanism}
                </p>
              )}
            </div>
          )}
        </div>

        <ChevronRight
          className={`h-3.5 w-3.5 shrink-0 text-foreground/30 transition-transform ${
            isActive ? "rotate-90" : "group-hover:translate-x-0.5"
          }`}
        />
      </div>
    </button>
  );
}

/* ── Dot on Screenshot ── */
function ScreenshotDot({
  dot,
  isActive,
  onClick,
  index,
}: {
  dot: AnnotationDot;
  isActive: boolean;
  onClick: () => void;
  index: number;
}) {
  const color = SEVERITY_COLORS[dot.severity] || SEVERITY_COLORS.medium;

  return (
    <button
      onClick={onClick}
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
      style={{
        left: `${dot.x * 100}%`,
        top: `${dot.y * 100}%`,
      }}
      title={dot.finding.title}
    >
      {/* Pulse ring */}
      {isActive && (
        <span
          className="absolute inset-[-6px] rounded-full animate-ping opacity-30"
          style={{ background: color }}
        />
      )}
      {/* Outer ring */}
      <span
        className={`relative flex items-center justify-center rounded-full transition-all duration-200 ${
          isActive ? "w-8 h-8 shadow-lg" : "w-6 h-6 shadow-md hover:w-7 hover:h-7"
        }`}
        style={{
          background: color,
          boxShadow: isActive ? `0 0 20px ${color}66` : `0 2px 8px ${color}44`,
        }}
      >
        <span className="text-[10px] font-bold text-white">{index + 1}</span>
      </span>
    </button>
  );
}

/* ── Score Badge (floating on screenshot) ── */
function FloatingScoreBadge({ score, grade }: { score: number; grade: string }) {
  const color = scoreColor(score);
  const circumference = 2 * Math.PI * 18;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div
      className="absolute top-4 left-4 z-20 flex items-center gap-2.5 rounded-xl px-3 py-2 shadow-lg backdrop-blur-md"
      style={{ background: "rgba(255,255,255,0.92)", border: "1px solid rgba(0,0,0,0.08)" }}
    >
      <div className="relative w-[40px] h-[40px]">
        <svg className="-rotate-90 w-full h-full" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r="18" fill="none" strokeWidth="3" stroke="rgba(0,0,0,0.06)" />
          <circle
            cx="22" cy="22" r="18" fill="none" strokeWidth="3" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={dashOffset}
            style={{ stroke: color }}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-[12px] font-bold"
          style={{ color }}
        >
          {score}
        </span>
      </div>
      <div>
        <p className="text-[11px] font-semibold text-gray-900 leading-none">{grade}</p>
        <p className="text-[9px] text-gray-500 mt-0.5">UX Score</p>
      </div>
    </div>
  );
}

/* ── Summary Stats Bar ── */
function SummaryStats({ sections }: { sections: AuditSection[] }) {
  let critical = 0, high = 0, medium = 0, low = 0, positive = 0;
  for (const sec of sections) {
    for (const f of sec.findings) {
      if (f.type === "positive") { positive++; continue; }
      const s = f.severity || f.impact;
      if (s === "critical") critical++;
      else if (s === "high") high++;
      else if (s === "medium") medium++;
      else low++;
    }
  }

  return (
    <div className="flex items-center gap-3 text-[11px]">
      {critical > 0 && (
        <span className="flex items-center gap-1 font-medium" style={{ color: SEVERITY_COLORS.critical }}>
          <span className="w-2 h-2 rounded-full" style={{ background: SEVERITY_COLORS.critical }} />
          {critical} Critical
        </span>
      )}
      {high > 0 && (
        <span className="flex items-center gap-1 font-medium" style={{ color: SEVERITY_COLORS.high }}>
          <span className="w-2 h-2 rounded-full" style={{ background: SEVERITY_COLORS.high }} />
          {high} High
        </span>
      )}
      {medium > 0 && (
        <span className="flex items-center gap-1 text-foreground/50">
          <span className="w-2 h-2 rounded-full" style={{ background: SEVERITY_COLORS.medium }} />
          {medium} Med
        </span>
      )}
      {positive > 0 && (
        <span className="flex items-center gap-1 text-foreground/50">
          <span className="w-2 h-2 rounded-full" style={{ background: SEVERITY_COLORS.low }} />
          {positive} Good
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Annotated View Component
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
  const [activeDot, setActiveDot] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  const screenshotRef = useRef<HTMLDivElement>(null);
  const findingsRef = useRef<HTMLDivElement>(null);
  const findingRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const annotations = generateAnnotations(data.sections);

  // Filter annotations
  const filtered = filter === "all"
    ? annotations
    : annotations.filter(d => d.severity === filter);

  // When a dot is clicked, scroll the finding into view
  const handleDotClick = useCallback((dotId: string) => {
    setActiveDot(prev => prev === dotId ? null : dotId);

    // Scroll finding into view
    const el = findingRefs.current[dotId];
    if (el && findingsRef.current) {
      const container = findingsRef.current;
      const elTop = el.offsetTop - container.offsetTop;
      container.scrollTo({ top: elTop - 12, behavior: "smooth" });
    }
  }, []);

  // When a finding is clicked, scroll the screenshot to show the dot
  const handleFindingClick = useCallback((dotId: string) => {
    setActiveDot(prev => prev === dotId ? null : dotId);

    // Scroll screenshot to dot position
    const dot = annotations.find(d => d.id === dotId);
    if (dot && screenshotRef.current) {
      const container = screenshotRef.current;
      const scrollTarget = dot.y * container.scrollHeight - container.clientHeight / 2;
      container.scrollTo({ top: Math.max(0, scrollTarget), behavior: "smooth" });
    }
  }, [annotations]);

  return (
    <div className="w-full flex flex-col" style={{ height: "calc(100vh - 60px)" }}>
      {/* ── Top Bar ── */}
      <div
        className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b"
        style={{ background: "var(--s1)", borderColor: "var(--border)" }}
      >
        <SummaryStats sections={data.sections} />

        <div className="flex items-center gap-2">
          {/* Severity filter pills */}
          <div className="flex items-center gap-1">
            {["all", "critical", "high", "medium", "low"].map(sev => (
              <button
                key={sev}
                onClick={() => setFilter(sev)}
                className={`text-[10px] font-medium px-2 py-1 rounded-md transition-all ${
                  filter === sev ? "text-white" : "text-foreground/45 hover:text-foreground/60"
                }`}
                style={{
                  background: filter === sev
                    ? (sev === "all" ? "var(--brand)" : SEVERITY_COLORS[sev])
                    : "var(--s2)",
                }}
              >
                {sev === "all" ? `All (${annotations.length})` : sev.charAt(0).toUpperCase() + sev.slice(1)}
              </button>
            ))}
          </div>

          {/* Heatmap toggle */}
          {heatmapZones && heatmapZones.length > 0 && (
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`text-[10px] font-medium px-2 py-1 rounded-md transition-all ${
                showHeatmap ? "text-white" : "text-foreground/45 hover:text-foreground/60"
              }`}
              style={{
                background: showHeatmap ? "oklch(0.60 0.20 30)" : "var(--s2)",
              }}
            >
              🔥 Heatmap
            </button>
          )}

          {/* Panel collapse toggle */}
          <button
            onClick={() => setPanelCollapsed(!panelCollapsed)}
            className="text-foreground/40 hover:text-foreground/60 transition-colors p-1"
            title={panelCollapsed ? "Show panel" : "Hide panel"}
          >
            {panelCollapsed ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Split Panel ── */}
      <div className="flex-1 flex min-h-0">
        {/* LEFT: Screenshot with dots */}
        <div
          ref={screenshotRef}
          className={`relative overflow-y-auto overflow-x-hidden transition-all duration-300 ${
            panelCollapsed ? "flex-1" : "w-[55%] lg:w-[60%]"
          }`}
          style={{ background: "#f0f0f0" }}
        >
          {/* Floating score badge */}
          <FloatingScoreBadge score={data.overallScore} grade={data.grade} />

          {/* Screenshot image */}
          <div className="relative">
            <img
              src={screenshotUrl}
              alt="Page screenshot"
              className="w-full h-auto block"
              draggable={false}
            />

            {/* Heatmap overlay */}
            {showHeatmap && heatmapZones && (
              <HeatmapCanvas
                zones={heatmapZones}
                pageHeight={pageHeight}
                viewportWidth={viewportWidth}
              />
            )}

            {/* Annotation dots */}
            {filtered.map((dot, idx) => (
              <ScreenshotDot
                key={dot.id}
                dot={dot}
                isActive={activeDot === dot.id}
                onClick={() => handleDotClick(dot.id)}
                index={annotations.indexOf(dot)}
              />
            ))}
          </div>
        </div>

        {/* RIGHT: Findings panel */}
        {!panelCollapsed && (
          <div
            ref={findingsRef}
            className="w-[45%] lg:w-[40%] overflow-y-auto border-l flex flex-col"
            style={{ borderColor: "var(--border)", background: "var(--background)" }}
          >
            {/* Panel header */}
            <div
              className="sticky top-0 z-10 px-4 py-3 border-b backdrop-blur-md"
              style={{ background: "var(--background)/95", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[13px] font-semibold text-foreground">
                    Issues Found
                  </h3>
                  <p className="text-[11px] text-foreground/45 mt-0.5">
                    {filtered.length} issue{filtered.length !== 1 ? "s" : ""} • Click to locate
                  </p>
                </div>
                <Flame className="h-4 w-4" style={{ color: "var(--score-low)" }} />
              </div>
            </div>

            {/* Findings list */}
            <div className="flex-1 p-3 flex flex-col gap-2">
              {filtered.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-[12px] text-foreground/40">
                  No issues in this severity level
                </div>
              ) : (
                filtered.map((dot) => (
                  <div
                    key={dot.id}
                    ref={(el) => { findingRefs.current[dot.id] = el; }}
                  >
                    <FindingRow
                      dot={dot}
                      isActive={activeDot === dot.id}
                      onClick={() => handleFindingClick(dot.id)}
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

/* ── Lightweight Heatmap Canvas ── */
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

    const displayWidth = parent.clientWidth;
    const displayHeight = parent.clientHeight || (displayWidth * (pageHeight / viewportWidth));

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw gaussian blobs
    for (const zone of zones) {
      const x = (zone.x / viewportWidth) * displayWidth;
      const y = (zone.y / pageHeight) * displayHeight;
      const radius = (zone.radius / viewportWidth) * displayWidth;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(255, 0, 0, ${zone.intensity * 0.4})`);
      gradient.addColorStop(0.5, `rgba(255, 165, 0, ${zone.intensity * 0.2})`);
      gradient.addColorStop(1, "rgba(255, 165, 0, 0)");

      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
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
