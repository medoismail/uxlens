"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Target, Zap, Shield, Eye, Search, Layers, Pen, ChevronLeft,
  ChevronDown, ChevronRight, RotateCcw, ArrowRight, User, Lock,
  Flame, Brain, HelpCircle, Heart, LogOut, Loader2,
  X, AlertTriangle, Check, ListChecks, Sparkles,
  TrendingUp, Lightbulb, BarChart3, Activity,
  Share2, Link2, Link2Off,
} from "lucide-react";
// Footer removed — side-by-side layout uses full viewport
import { ScreenshotSection } from "@/components/screenshot-section";
import { ChatWidget } from "@/components/chat-widget";
// ScrollReveal removed — side-by-side layout renders sections on demand
import { AnnotatedView } from "@/components/annotated-view";
import { PLAN_FEATURES } from "@/lib/types";
import { CompetitorSection, CompetitorLockedPreview } from "@/components/competitor-section";
import type { UXAuditResult, AuditSection, Finding, PlanTier, HeatmapZone, CompetitorAnalysis, VisualAnalysis, SectionRewrite, HeuristicScore, FirstScreenAnalysis, ConversionKiller, ConversionKillerItem, ActionableItem, ActionItem, PersonaFeedback, AnnotationCoordinate } from "@/lib/types";

interface ResultsReportProps {
  data: UXAuditResult;
  url: string;
  onReset: () => void;
  onHumanAuditRequested: (url: string, email: string) => void;
  isSubscribed?: boolean;
  plan: PlanTier;
  onSubscriptionVerified?: (email: string) => void;
  auditId?: string;
  screenshotUrl?: string;
  heatmapZones?: HeatmapZone[];
  pageHeight?: number;
  viewportWidth?: number;
  screenshotStatus?: "loading" | "done" | "failed";
  heatmapStatus?: "loading" | "done" | "failed";
  visualAnalysis?: VisualAnalysis;
  visualAnalysisStatus?: "loading" | "done" | "failed";
  annotationCoordinates?: AnnotationCoordinate[];
  annotationStatus?: "loading" | "done" | "failed";
  competitorAnalysis?: CompetitorAnalysis;
  competitorStatus?: "loading" | "done" | "failed" | "locked";
  onManualCompetitors?: (urls: string[]) => void;
  isSharedView?: boolean;
  shareToken?: string | null;
  onToggleShare?: () => void;
  shareLoading?: boolean;
  shareCopied?: boolean;
  onCopyShareLink?: () => void;
}

/* ════════════════════════════════════════════════════════════
   Helpers
   ════════════════════════════════════════════════════════════ */

function scoreColor(s: number) {
  if (s >= 75) return "var(--score-high)";
  if (s >= 50) return "var(--score-mid)";
  return "var(--score-low)";
}

function scoreBadgeStyle(s: number): React.CSSProperties {
  if (s >= 75) return { background: "oklch(0.52 0.14 155 / 8%)", color: "var(--score-high)" };
  if (s >= 50) return { background: "oklch(0.58 0.16 75 / 8%)", color: "var(--score-mid)" };
  return { background: "oklch(0.55 0.17 20 / 8%)", color: "var(--score-low)" };
}

function heuristicColor(s: number) {
  if (s >= 7) return "var(--score-high)";
  if (s >= 4) return "var(--score-mid)";
  return "var(--score-low)";
}

function heuristicBg(s: number) {
  if (s >= 7) return "oklch(0.52 0.14 155 / 8%)";
  if (s >= 4) return "oklch(0.58 0.16 75 / 8%)";
  return "oklch(0.55 0.17 20 / 8%)";
}

const SEVERITY_STYLES: Record<string, React.CSSProperties> = {
  critical: { background: "oklch(0.55 0.17 20 / 15%)", color: "var(--score-low)" },
  high: { background: "oklch(0.55 0.17 20 / 10%)", color: "var(--score-low)" },
  medium: { background: "oklch(0.58 0.16 75 / 10%)", color: "var(--score-mid)" },
  low: { background: "oklch(0.52 0.14 155 / 10%)", color: "var(--score-high)" },
};

const SECTION_ICONS: Record<string, React.ReactNode> = {
  hero: <Target className="h-4 w-4" />,
  messaging: <Pen className="h-4 w-4" />,
  cta: <Zap className="h-4 w-4" />,
  trust: <Shield className="h-4 w-4" />,
  structure: <Layers className="h-4 w-4" />,
  contradictions: <Search className="h-4 w-4" />,
  firstscreen: <Eye className="h-4 w-4" />,
};

/** Category definitions — color is score-derived at render time, not per-category.
 *  Per color system rules: "Color = Meaning" — color indicates score health, not category identity.
 *  Category identity comes from icon + label (typography), not color. */
const CATEGORY_DEFS = [
  { key: "messageClarity", label: "Message Clarity", desc: "How quickly visitors understand your offer", icon: <Target className="h-3.5 w-3.5" /> },
  { key: "cognitiveLoad", label: "Cognitive Load", desc: "Mental effort needed to process the page", icon: <Brain className="h-3.5 w-3.5" /> },
  { key: "conversionArch", label: "Conversion Arch.", desc: "Strength of the path from interest to action", icon: <Zap className="h-3.5 w-3.5" /> },
  { key: "trustSignals", label: "Trust Signals", desc: "Credibility cues that reduce visitor hesitation", icon: <Shield className="h-3.5 w-3.5" /> },
  { key: "contradictions", label: "Contradictions", desc: "Consistency between claims and evidence", icon: <Search className="h-3.5 w-3.5" /> },
  { key: "firstScreen", label: "First Screen", desc: "Above-the-fold clarity for cold traffic", icon: <Eye className="h-3.5 w-3.5" /> },
] as const;


function scoreInterpretation(score: number): string {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Adequate";
  if (score >= 40) return "Needs work";
  if (score >= 20) return "Weak";
  return "Critical";
}

const FLAG_STYLES: React.CSSProperties[] = [
  { color: "var(--score-low)", background: "oklch(0.55 0.17 20 / 7%)" },
  { color: "var(--score-mid)", background: "oklch(0.58 0.16 75 / 7%)" },
  { color: "var(--score-high)", background: "oklch(0.52 0.14 155 / 7%)" },
  { color: "var(--accent-purple)", background: "oklch(0.637 0.185 295 / 7%)" },
];

/* ── Derived metric helpers ── */

function deriveConversionRisk(cats: UXAuditResult["categories"]): number {
  return Math.round(100 - (cats.conversionArch.score + cats.firstScreen.score) / 2);
}

function deriveReadability(cm: UXAuditResult["confusionMap"]): number {
  return Math.round(100 - cm.densityScore);
}

function deriveComplexity(cm: UXAuditResult["confusionMap"]): { label: string; color: string } {
  const avg = (cm.jargonScore + cm.frictionWords + cm.decisionParalysis) / 3;
  if (avg >= 70) return { label: "Critical", color: "var(--score-low)" };
  if (avg >= 50) return { label: "High", color: "var(--score-low)" };
  if (avg >= 30) return { label: "Medium", color: "var(--score-mid)" };
  return { label: "Low", color: "var(--score-high)" };
}

function deriveScope(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("a/b") || lower.includes("test") || lower.includes("experiment")) return "A/B Test";
  if (lower.includes("redesign") || lower.includes("rebuild") || lower.includes("overhaul")) return "Redesign";
  if (lower.includes("content") || lower.includes("copy") || lower.includes("write")) return "Content";
  return "Strategic";
}

/* ── Persona icon mapper (replaces emojis with lucide icons) ── */
function getPersonaIcon(persona: string): React.ReactNode {
  const lower = persona.toLowerCase();
  if (lower.includes("ux") || lower.includes("design")) return <Pen className="h-3 w-3" style={{ color: "var(--brand)" }} />;
  if (lower.includes("market")) return <TrendingUp className="h-3 w-3" style={{ color: "var(--brand)" }} />;
  if (lower.includes("product")) return <Layers className="h-3 w-3" style={{ color: "var(--brand)" }} />;
  if (lower.includes("develop") || lower.includes("engineer")) return <Activity className="h-3 w-3" style={{ color: "var(--brand)" }} />;
  if (lower.includes("visitor") || lower.includes("user") || lower.includes("first")) return <Eye className="h-3 w-3" style={{ color: "var(--brand)" }} />;
  return <User className="h-3 w-3" style={{ color: "var(--brand)" }} />;
}

/* ── Union type helpers for backward compatibility ── */
function getKillerText(k: ConversionKiller): string {
  return typeof k === "string" ? k : k.title;
}
function getKillerDetail(k: ConversionKiller): ConversionKillerItem | null {
  return typeof k === "string" ? null : k;
}
function getActionText(a: ActionableItem): string {
  return typeof a === "string" ? a : a.text;
}
function getActionDetail(a: ActionableItem): ActionItem | null {
  return typeof a === "string" ? null : a;
}

const JOURNEY_STAGE_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  awareness: { bg: "oklch(0.62 0.18 275 / 8%)", color: "oklch(0.62 0.18 275)", label: "Awareness" },
  consideration: { bg: "oklch(0.62 0.14 245 / 8%)", color: "oklch(0.62 0.14 245)", label: "Consideration" },
  evaluation: { bg: "oklch(0.58 0.16 75 / 8%)", color: "oklch(0.58 0.16 75)", label: "Evaluation" },
  conviction: { bg: "oklch(0.62 0.15 160 / 8%)", color: "oklch(0.62 0.15 160)", label: "Conviction" },
  action: { bg: "oklch(0.55 0.17 20 / 8%)", color: "oklch(0.55 0.17 20)", label: "Action" },
};

/* ── Sparkline data generator (unique pattern per category index) ── */
const SPARK_PATTERNS = [
  [0.25, 0.50, 1.00, 0.60, 0.80],  // ramp up, peak middle
  [0.80, 0.55, 0.30, 0.65, 1.00],  // high-low-high
  [0.40, 1.00, 0.70, 0.35, 0.55],  // early peak
  [0.60, 0.40, 0.75, 1.00, 0.50],  // late peak
  [1.00, 0.65, 0.40, 0.55, 0.30],  // descending
  [0.35, 0.70, 0.55, 1.00, 0.75],  // double bump
];
function generateSparkData(score: number, index: number = 0): number[] {
  const s = score / 100;
  const pattern = SPARK_PATTERNS[index % SPARK_PATTERNS.length];
  return pattern.map(m => Math.min(1, Math.max(0.08, s * m)));
}

/* ── Dedup helper: check if two finding titles are too similar ── */
function titleWords(t: string): Set<string> {
  return new Set(t.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 2));
}
function isSimilar(a: string, b: string): boolean {
  const wa = titleWords(a);
  const wb = titleWords(b);
  if (wa.size === 0 || wb.size === 0) return false;
  let overlap = 0;
  for (const w of wa) if (wb.has(w)) overlap++;
  const similarity = overlap / Math.min(wa.size, wb.size);
  return similarity >= 0.6;
}

/* ── Top findings extractor (deduped) ── */
function getTopFindings(sections: AuditSection[], max: number = 4): Finding[] {
  const all: Finding[] = [];
  for (const sec of sections) {
    for (const f of sec.findings) {
      if (f.type === "issue" && (f.impact === "high" || f.severity === "critical" || f.severity === "high")) {
        all.push(f);
      }
    }
  }
  // Sort: critical > high severity, then high > medium impact
  all.sort((a, b) => {
    const sevOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const impOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    const aSev = sevOrder[a.severity || "medium"] ?? 2;
    const bSev = sevOrder[b.severity || "medium"] ?? 2;
    if (aSev !== bSev) return aSev - bSev;
    return (impOrder[a.impact] ?? 1) - (impOrder[b.impact] ?? 1);
  });
  // Deduplicate: skip findings whose title is too similar to an already-picked one
  const picked: Finding[] = [];
  for (const f of all) {
    if (picked.length >= max) break;
    if (!picked.some(p => isSimilar(p.title, f.title))) {
      picked.push(f);
    }
  }
  return picked;
}

/* ── Severity counter ── */
function countSeverities(sections: AuditSection[]): Record<string, number> {
  const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const sec of sections) {
    for (const f of sec.findings) {
      if (f.severity && counts[f.severity] !== undefined) {
        counts[f.severity]++;
      } else if (f.impact) {
        counts[f.impact === "high" ? "high" : f.impact === "medium" ? "medium" : "low"]++;
      }
    }
  }
  return counts;
}

/* ── Lock Components ── */

function LockedHint({ count, label }: { count: number; label: string }) {
  return (
    <Link href="/pricing" className="flex items-center gap-2 text-[12px] text-foreground/55 py-2.5 px-3.5 rounded-[7px] transition-colors hover:text-foreground/65 group" style={{ background: "var(--s2)" }}>
      <Lock className="h-3 w-3 shrink-0 text-foreground/45 group-hover:text-foreground/55 transition-colors" />
      <span>{count} {label} — <span className="font-medium underline underline-offset-2">upgrade to unlock</span></span>
    </Link>
  );
}

function UpgradeCard() {
  return (
    <div className="rounded-xl p-4 my-5 text-center" style={{ background: "linear-gradient(135deg, var(--brand-dim), var(--s1))" }}>
      <Lock className="h-5 w-5 mx-auto mb-2" style={{ color: "var(--brand)" }} />
      <h3 className="text-[14px] font-semibold tracking-tight mb-1">Unlock strategic fixes & optimized copy</h3>
      <p className="text-[12px] text-foreground/55 leading-relaxed max-w-sm mx-auto mb-4">Upgrade to get strategic improvements, AI-optimized hero copy, and PDF export.</p>
      <Link href="/pricing" className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[14px] font-bold transition-all duration-150 hover:opacity-90 active:scale-[0.98]" style={{ background: "var(--brand)", color: "var(--brand-fg)" }}>
        View Plans <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function LockedOverlay({ message }: { message: string }) {
  return (
    <Link href="/pricing" className="relative flex flex-col items-center justify-center py-8 rounded-lg text-center group cursor-pointer" style={{ background: "var(--s2)" }}>
      <Lock className="h-5 w-5 mb-2 text-foreground/40 group-hover:text-foreground/55 transition-colors" />
      <p className="text-[12px] text-foreground/50 group-hover:text-foreground/60 transition-colors">{message}</p>
      <span className="mt-2 text-[12px] font-medium underline underline-offset-2 transition-colors" style={{ color: "var(--brand)" }}>Upgrade to unlock</span>
    </Link>
  );
}

/* ════════════════════════════════════════════════════════════
   Main Component
   ════════════════════════════════════════════════════════════ */

export function ResultsReport({
  data, url, onReset, onHumanAuditRequested, plan,
  auditId, screenshotUrl, heatmapZones, pageHeight, viewportWidth, screenshotStatus,
  heatmapStatus, visualAnalysis, visualAnalysisStatus,
  annotationCoordinates, annotationStatus,
  competitorAnalysis, competitorStatus, onManualCompetitors, isSharedView,
  shareToken, onToggleShare, shareLoading, shareCopied, onCopyShareLink,
}: ResultsReportProps) {
  const features = PLAN_FEATURES[plan];
  let domain = url;
  try { domain = new URL(url).hostname.replace("www.", ""); } catch {}

  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"report" | "annotated">("report");
  const [activeNav, setActiveNav] = useState("overview");
  const [blurTestActive, setBlurTestActive] = useState(false);

  // Can show annotated view when we have a screenshot (AI coords optional — falls back to spread positioning)
  const canShowAnnotated = screenshotStatus === "done" && !!screenshotUrl;

  /* ── Derived metrics ── */
  const conversionRisk = deriveConversionRisk(data.categories);
  const readability = deriveReadability(data.confusionMap);
  const trustScore = data.categories.trustSignals.score;
  const complexity = deriveComplexity(data.confusionMap);
  const topFindings = getTopFindings(data.sections);
  const severityCounts = countSeverities(data.sections);

  /* ── Score gauge calculations ── */
  const circumference = 2 * Math.PI * 44;
  const dashOffset = circumference - (data.overallScore / 100) * circumference;
  const dialColor = scoreColor(data.overallScore);

  /* ── Sorted categories for bar chart (worst first) ── */
  const sortedCategories = [...CATEGORY_DEFS].map(cat => ({
    ...cat,
    data: data.categories[cat.key as keyof typeof data.categories],
  })).sort((a, b) => a.data.score - b.data.score);

  /* ── Annotated view mode — full-width Figma-style inspect ── */
  if (viewMode === "annotated" && canShowAnnotated) {
    return (
      <div className="w-screen relative" style={{ left: "50%", marginLeft: "-50vw" }}>
        {/* Figma-style toolbar — matches report view */}
        <div className="w-full h-12 px-3 flex items-center border-b" style={{ borderColor: "var(--border)", background: "var(--background)" }}>
          {/* Left: logo + domain */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Link href="/dashboard" className="shrink-0 transition-opacity hover:opacity-70" aria-label="Back to dashboard">
              <svg width="20" height="20" viewBox="0 0 634 617" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M469.152 100.312L380.036 148.394L440.22 149.221C471.143 149.645 501.374 158.434 527.702 174.653L633 239.519L573.18 336.563L486.965 283.453L516.343 335.97C531.437 362.955 538.939 393.522 538.053 424.426L534.508 548.019L420.528 544.752L423.431 443.557L392.624 495.248C376.795 521.809 354.065 543.588 326.849 558.273L218.008 617L163.848 516.688L252.964 468.604L192.781 467.778C161.857 467.354 131.625 458.566 105.296 442.346L0 377.481L59.8199 280.436L146.032 333.546L116.656 281.03C101.562 254.045 94.06 223.478 94.9464 192.574L98.4916 68.981L212.472 72.2475L209.568 173.442L240.376 121.75C256.205 95.1905 278.934 73.4123 306.15 58.7279L414.992 0L469.152 100.312ZM276.138 284.453C267.545 298.872 267.299 316.781 275.494 331.43C283.685 346.073 299.078 355.235 315.855 355.465C332.632 355.695 348.271 346.959 356.861 332.546C365.454 318.127 365.7 300.218 357.506 285.569C349.314 270.925 333.921 261.763 317.144 261.533C300.367 261.303 284.728 270.04 276.138 284.453Z" fill="#4C2CFF" />
              </svg>
            </Link>
            <span className="w-px h-5 shrink-0" style={{ background: "var(--border)" }} />
            <span className="text-[12px] font-medium text-foreground/55">{domain}</span>
          </div>

          {/* Center: View toggle */}
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ background: "var(--s2)" }}>
              <button
                onClick={() => setViewMode("report")}
                className="text-[11px] font-medium px-4 py-1.5 rounded-md transition-all text-foreground/50 hover:text-foreground/70"
              >
                Report
              </button>
              <button
                className="text-[11px] font-medium px-4 py-1.5 rounded-md transition-all text-white shadow-sm"
                style={{ background: "var(--brand)" }}
              >
                Annotated
              </button>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onReset} className="inline-flex items-center gap-1.5 text-[11px] text-foreground/35 hover:text-foreground/55 transition-colors px-2 py-1 rounded-md hover:bg-foreground/[0.03]">
              <RotateCcw className="h-3 w-3" /> New
            </button>
            {onToggleShare && !isSharedView && (
              shareToken ? (
                <div className="flex items-center gap-1">
                  <button onClick={onCopyShareLink} className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors" style={{ background: "var(--s2)" }}>
                    {shareCopied ? <Check className="h-3 w-3 text-green-600" /> : <Link2 className="h-3 w-3" />}
                    {shareCopied ? "Copied" : "Copy Link"}
                  </button>
                  <button onClick={onToggleShare} disabled={shareLoading} className="inline-flex items-center rounded-md p-1.5 text-red-500/70 hover:bg-red-50 hover:text-red-500 transition-colors">
                    {shareLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2Off className="h-3 w-3" />}
                  </button>
                </div>
              ) : (
                <button onClick={onToggleShare} disabled={shareLoading} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-white transition-all hover:opacity-90" style={{ background: "var(--brand)" }}>
                  {shareLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Share2 className="h-3 w-3" />}
                  Share
                </button>
              )
            )}
          </div>
        </div>

        <AnnotatedView
          data={data}
          screenshotUrl={screenshotUrl!}
          heatmapZones={heatmapZones}
          pageHeight={pageHeight}
          viewportWidth={viewportWidth}
          annotationCoordinates={annotationCoordinates}
        />
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════
     Report v2 — Side-by-side inspect layout
     Left: nav sidebar with score + section tabs
     Right: selected section content, scrollable
     ═══════════════════════════════════════════════════════ */

  /* ── Count issues/items per tab for badges ── */
  const totalIssues = data.sections.reduce((sum, s) => sum + s.findings.filter(f => f.type === "issue" || f.type === "warning").length, 0);
  const killerCount = sortedCategories.filter(c => c.data.score < 50).length;
  const heuristicIssueCount = data.heuristicEvaluation ? data.heuristicEvaluation.heuristics.filter(h => h.score < 5).length : 0;
  const improvementCount = data.quickWins.length + (features.improvements ? data.strategicFixes.length : 0);
  const trustIssueCount = (data.trustMatrix?.filter(t => t.score < 50).length ?? 0) + (data.confusionMap ? [data.confusionMap.jargonScore, data.confusionMap.densityScore, data.confusionMap.frictionWords, data.confusionMap.decisionParalysis].filter(s => s > 50).length : 0);
  const attentionIssueCount = data.firstScreenAnalysis.clarityConfidence < 70 ? 1 : 0;

  const navSections: {
    id: string;
    label: string;
    icon: React.ReactNode;
    color: string;
    badge?: number;
  }[] = [
    { id: "overview", label: "Overview", icon: <Target className="h-3.5 w-3.5" />, color: "var(--brand)" },
    { id: "killers", label: "Killers", icon: <Flame className="h-3.5 w-3.5" />, color: "var(--score-low)", badge: killerCount || undefined },
    { id: "metrics", label: "Metrics", icon: <BarChart3 className="h-3.5 w-3.5" />, color: "var(--brand)", badge: 6 },
    ...(topFindings.length > 0 ? [{ id: "insights", label: "Insights", icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "var(--score-mid)", badge: topFindings.length }] : []),
    { id: "sections", label: "Sections", icon: <Layers className="h-3.5 w-3.5" />, color: "var(--brand)", badge: totalIssues || undefined },
    { id: "visual", label: "Visual", icon: <Activity className="h-3.5 w-3.5" />, color: "var(--accent-blue)" },
    ...(data.trustMatrix?.length > 0 || data.confusionMap ? [{ id: "trust", label: "Trust", icon: <Shield className="h-3.5 w-3.5" />, color: "var(--accent-blue)", badge: trustIssueCount || undefined }] : []),
    { id: "attention", label: "Attention", icon: <Eye className="h-3.5 w-3.5" />, color: "var(--brand)", badge: attentionIssueCount || undefined },
    ...(data.heuristicEvaluation ? [{ id: "heuristics", label: "Heuristics", icon: <ListChecks className="h-3.5 w-3.5" />, color: "var(--accent-purple)", badge: heuristicIssueCount || undefined }] : []),
    { id: "improvements", label: "Fixes", icon: <Lightbulb className="h-3.5 w-3.5" />, color: "var(--score-high)", badge: improvementCount || undefined },
    { id: "rewrite", label: "Rewrite", icon: <Sparkles className="h-3.5 w-3.5" />, color: "var(--brand)" },
    ...((data.personaFeedback?.length ?? 0) > 0 ? [{ id: "personas", label: "Feedback", icon: <User className="h-3.5 w-3.5" />, color: "var(--brand)", badge: data.personaFeedback?.length }] : []),
    { id: "competitors", label: "Competitors", icon: <TrendingUp className="h-3.5 w-3.5" />, color: "var(--accent-purple)" },
  ] as { id: string; label: string; icon: React.ReactNode; color: string; badge?: number }[];

  /* ── Section content renderer ── */
  const renderSectionContent = (sectionId: string) => {
    switch (sectionId) {
      case "overview":
        return (
          <div className="flex flex-col gap-4">
            {/* Row 1: Score + metric boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {/* UX Score gauge */}
              <div className="col-span-2 sm:col-span-1 dash-card rounded-xl border p-4 flex flex-col items-center justify-center" style={{ background: "var(--s1)" }}>
                <div className="relative w-[56px] h-[56px] mb-1.5">
                  <svg className="-rotate-90 w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="44" fill="none" strokeWidth="7" style={{ stroke: "var(--s3)" }} />
                    <circle cx="50" cy="50" r="44" fill="none" strokeWidth="7" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset} className="animate-ring-fill" style={{ stroke: dialColor, "--ring-circumference": circumference, "--ring-offset": dashOffset } as React.CSSProperties} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[18px] font-bold tabular-nums leading-none animate-count-up" style={{ color: dialColor }}>{data.overallScore}</span>
                  </div>
                </div>
                <span className="text-[11px] text-foreground/55 font-medium">UX Score</span>
                <span className="text-[9px] text-foreground/40 mt-0.5">{data.grade}</span>
              </div>
              <MetricCard label="Conversion Risk" value={conversionRisk} suffix="%" color={scoreColor(100 - conversionRisk)} />
              <MetricCard label="Readability" value={readability} suffix="%" color={scoreColor(readability)} />
              <MetricCard label="Trust" value={trustScore} suffix="/100" color={scoreColor(trustScore)} />
              <div className="dash-card rounded-xl border p-4 flex flex-col items-center justify-center text-center" style={{ background: "var(--s1)" }}>
                <span className="text-[18px] font-bold animate-count-up mb-0.5" style={{ color: complexity.color }}>{complexity.label}</span>
                <span className="text-[10px] text-foreground/60 font-medium">Complexity</span>
              </div>
            </div>

            {/* Severity pill bar */}
            <div className="flex items-center gap-2 px-1">
              {(Object.entries(severityCounts) as [string, number][]).filter(([, c]) => c > 0).map(([sev, count]) => (
                <span key={sev} className="flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-md" style={{ background: SEVERITY_STYLES[sev]?.background, color: SEVERITY_STYLES[sev]?.color }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "currentColor" }} />
                  {count} {sev}
                </span>
              ))}
              <span className="text-[10px] text-foreground/30 ml-auto">{totalIssues} total issues</span>
            </div>

            {/* Revenue Impact Banner */}
            {topFindings.length > 0 && topFindings.some(f => f.impactHeadline) && (
              <div className="rounded-xl border p-4 border-l-3" style={{ background: "var(--s1)", borderLeft: "3px solid var(--score-low)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4" style={{ color: "var(--score-low)" }} />
                  <span className="text-[12px] font-semibold" style={{ color: "var(--score-low)" }}>Revenue at Risk</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {topFindings.filter(f => f.impactHeadline).slice(0, 3).map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--score-low)" }} />
                      <span className="text-foreground/60 flex-1">{f.impactHeadline}</span>
                      {f.estimatedConversionLift && (
                        <span className="text-[10px] font-medium shrink-0" style={{ color: "var(--score-high)" }}>↑ {f.estimatedConversionLift} if fixed</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Row 2: Executive summary (visual cards) */}
            <div className="rounded-xl border p-4" style={{ background: "var(--s1)", borderColor: "hsl(var(--primary) / 0.2)" }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded-full" style={{ background: scoreColor(data.overallScore) }} />
                <p className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wide">Executive Summary</p>
              </div>
              {/* Visual priority cards extracted from summary */}
              {(() => {
                const summary = data.executiveSummary || "";
                const fixMatch = summary.match(/Fix first:?\s*\[1\]\s*([^[]*)\[2\]\s*([^[]*)\[3\]\s*([^.]*)/i);
                const liftMatch = summary.match(/(\d+-\d+%|\d+%)/);
                const verdictText = fixMatch ? summary.slice(0, summary.indexOf("Fix first")).trim() : summary;
                return (
                  <>
                    <p className="text-[12px] text-foreground/65 leading-relaxed mb-3">{verdictText}</p>
                    {fixMatch && (
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {[fixMatch[1], fixMatch[2], fixMatch[3]].map((fix, i) => (
                          <div key={i} className="rounded-lg p-2.5 relative overflow-hidden" style={{ background: "var(--s2)" }}>
                            <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: i === 0 ? "var(--score-low)" : i === 1 ? "var(--score-mid)" : "var(--score-high)" }} />
                            <span className="text-[18px] font-bold block mb-1" style={{ color: i === 0 ? "var(--score-low)" : i === 1 ? "var(--score-mid)" : "var(--score-high)", opacity: 0.3 }}>#{i + 1}</span>
                            <span className="text-[10px] text-foreground/60 leading-snug block">{fix.trim().replace(/\.?\s*$/, "")}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      {liftMatch && (
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "oklch(0.52 0.14 155 / 10%)", color: "var(--score-high)" }}>
                          Estimated lift: {liftMatch[1]}
                        </span>
                      )}
                      {data.flags.map((flag, i) => (
                        <span key={i} className="text-[11px] px-2 py-[3px] rounded-[5px]" style={FLAG_STYLES[i % FLAG_STYLES.length]}>{flag}</span>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Row 3: Category bars (compact — all 6 in one card) */}
            <div className="rounded-xl border p-4" style={{ background: "var(--s1)" }}>
              <p className="text-[10px] font-semibold text-foreground/40 uppercase tracking-wide mb-3">Category Scores</p>
              <div className="flex flex-col gap-2">
                {sortedCategories.map((cat) => (
                  <div key={cat.key} className="flex items-center gap-2.5">
                    <span className="text-[11px] text-foreground/55 w-[120px] shrink-0 truncate">{cat.label}</span>
                    <div className="flex-1 h-[5px] rounded-full overflow-hidden relative" style={{ background: "var(--s3)" }}>
                      <div className="h-full rounded-full" style={{ background: scoreColor(cat.data.score), width: `${cat.data.score}%` }} />
                      {cat.data.benchmark != null && (
                        <div className="absolute top-[-3px] w-[2px] h-[11px] rounded-full" style={{ left: `${cat.data.benchmark}%`, background: "var(--foreground)", opacity: 0.25 }} title={`Industry avg: ${cat.data.benchmark}`} />
                      )}
                    </div>
                    <span className="text-[12px] font-bold font-mono w-7 text-right" style={{ color: scoreColor(cat.data.score) }}>{cat.data.score}</span>
                    {cat.data.benchmark != null && (
                      <span className="text-[9px] font-mono w-9 text-right" style={{ color: cat.data.score >= cat.data.benchmark ? "#22c55e" : "#ef4444", opacity: 0.7 }}>
                        {cat.data.score >= cat.data.benchmark ? "+" : ""}{cat.data.score - cat.data.benchmark}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Row 4: Effort/Impact Matrix (visual quadrant) */}
            {(() => {
              const allFindings = data.sections.flatMap(s => s.findings).filter(f => f.type !== "positive" && f.estimatedEffort);
              if (allFindings.length === 0) return null;
              const isQuick = (f: Finding) => {
                const e = (f.estimatedEffort || "").toLowerCase();
                return e.includes("15 min") || e.includes("30 min") || e.includes("1 hour") || e.includes("min");
              };
              const isHigh = (f: Finding) => f.impact === "high" || f.severity === "critical" || f.severity === "high";
              const quickWins = allFindings.filter(f => isQuick(f) && isHigh(f));
              const easyImprove = allFindings.filter(f => isQuick(f) && !isHigh(f));
              const strategic = allFindings.filter(f => !isQuick(f) && isHigh(f));
              const later = allFindings.filter(f => !isQuick(f) && !isHigh(f));
              return (
                <div className="rounded-xl border p-4" style={{ background: "var(--s1)" }}>
                  <p className="text-[10px] font-semibold text-foreground/40 uppercase tracking-wide mb-3">Fix Priority Matrix</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Quick Wins", emoji: "🎯", items: quickWins, color: "#22c55e" },
                      { label: "Strategic", emoji: "🧠", items: strategic, color: "#f59e0b" },
                      { label: "Easy Tweaks", emoji: "✨", items: easyImprove, color: "#3b82f6" },
                      { label: "Later", emoji: "📋", items: later, color: "var(--foreground)" },
                    ].map((q) => (
                      <div key={q.label} className="rounded-lg p-2.5" style={{ background: "var(--s2)" }}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-[11px]">{q.emoji}</span>
                          <span className="text-[10px] font-semibold" style={{ color: q.color, opacity: 0.85 }}>{q.label}</span>
                          <span className="text-[10px] font-bold font-mono ml-auto" style={{ color: q.color, opacity: 0.7 }}>{q.items.length}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          {q.items.slice(0, 2).map((f, i) => (
                            <span key={i} className="text-[10px] text-foreground/50 truncate">{f.title}</span>
                          ))}
                          {q.items.length > 2 && <span className="text-[9px] text-foreground/35">+{q.items.length - 2} more</span>}
                          {q.items.length === 0 && <span className="text-[9px] text-foreground/25">None</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-2 text-[9px] text-foreground/30">
                    <span>← Low effort &nbsp;|&nbsp; High effort →</span>
                  </div>
                </div>
              );
            })()}

            {/* Row 5: Top critical issues (collapsed preview — click to go to Insights) */}
            {topFindings.length > 0 && (
              <div className="rounded-xl border p-4" style={{ background: "var(--s1)" }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-semibold text-foreground/40 uppercase tracking-wide">Top Issues</p>
                  <button onClick={() => setActiveNav("insights")} className="text-[10px] font-medium flex items-center gap-1 hover:text-foreground/60 transition-colors" style={{ color: "var(--brand)" }}>
                    View all <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex flex-col gap-1.5">
                  {topFindings.slice(0, 4).map((f, i) => {
                    const sevStyle = SEVERITY_STYLES[f.severity || "medium"] || {};
                    return (
                      <div key={i} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-foreground/[0.02] transition-colors cursor-pointer" onClick={() => setActiveNav("insights")}>
                        <span className="text-[9px] font-bold uppercase px-1.5 py-[2px] rounded" style={sevStyle}>{f.severity || f.impact}</span>
                        <span className="text-[11px] text-foreground/60 flex-1 truncate">{f.title}</span>
                        <ChevronRight className="h-3 w-3 text-foreground/20 shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Row 5: Quick nav cards to key sections */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "sections", label: "Section Analysis", count: totalIssues, icon: <Layers className="h-3.5 w-3.5" />, color: "var(--brand)" },
                { id: "improvements", label: "Fixes Available", count: improvementCount, icon: <Lightbulb className="h-3.5 w-3.5" />, color: "var(--score-high)" },
                { id: "heuristics", label: "Heuristics", count: heuristicIssueCount, icon: <ListChecks className="h-3.5 w-3.5" />, color: "var(--accent-purple)" },
              ].map(nav => (
                <button
                  key={nav.id}
                  onClick={() => setActiveNav(nav.id)}
                  className="rounded-xl p-3 text-left transition-all hover:shadow-sm group"
                  style={{ background: "var(--s1)" }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span style={{ color: nav.color }}>{nav.icon}</span>
                    {nav.count > 0 && (
                      <span className="text-[9px] font-bold px-1.5 py-[1px] rounded-md text-white" style={{ background: nav.color }}>{nav.count}</span>
                    )}
                  </div>
                  <p className="text-[10px] text-foreground/50 group-hover:text-foreground/65 transition-colors">{nav.label}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case "killers":
        return (
          <DashSection icon={<Flame className="h-4 w-4" style={{ color: "var(--score-low)" }} />} title="Conversion Killers" subtitle="Sorted by weakness — lowest scores first">
            <div className="flex flex-col gap-3">
              {sortedCategories.map((cat) => (
                <BarChartRow key={cat.key} label={cat.label} score={cat.data.score} color={scoreColor(cat.data.score)} note={cat.data.note} />
              ))}
            </div>
          </DashSection>
        );

      case "metrics":
        return (
          <DashSection icon={<BarChart3 className="h-4 w-4" style={{ color: "var(--brand)" }} />} title="UX Metrics" subtitle="Six diagnostic categories">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CATEGORY_DEFS.map((cat, idx) => {
                const catData = data.categories[cat.key as keyof typeof data.categories];
                return <MetricGridCard key={cat.key} label={cat.label} score={catData.score} color={scoreColor(catData.score)} icon={cat.icon} sparkData={generateSparkData(catData.score, idx)} note={catData.note} desc={cat.desc} />;
              })}
            </div>
          </DashSection>
        );

      case "insights":
        return (
          <DashSection icon={<AlertTriangle className="h-4 w-4" style={{ color: "var(--score-mid)" }} />} title="AI Insights" subtitle="Highest-impact issues identified">
            <div className="flex flex-col gap-2.5">
              {topFindings.map((f, i) => (
                <InsightDashCard key={i} finding={f} defaultOpen={i === 0} />
              ))}
            </div>
            {data.conversionKillers.length > 0 && (
              <div className="mt-4 pt-4">
                <p className="text-[12px] uppercase tracking-[2px] text-foreground/45 mb-2.5">Top conversion blockers</p>
                <div className="flex flex-col gap-2">
                  {data.conversionKillers.map((k, i) => {
                    const detail = getKillerDetail(k);
                    return (
                      <div key={i} className="rounded-lg p-3 px-3.5" style={{ background: "var(--s2)" }}>
                        <div className="flex gap-2.5 text-[12px] leading-relaxed text-foreground/65">
                          <span className="font-bold shrink-0" style={{ color: "var(--score-low)" }}>{i + 1}.</span>
                          <div className="flex-1">
                            {detail ? (
                              <>
                                <span className="font-semibold text-foreground/60">{detail.title}</span>
                                <p className="text-[12px] text-foreground/55 mt-0.5">{detail.description}</p>
                                {(detail.affectedVisitors || detail.behavioralCascade || detail.expectedLift) && (
                                  <div className="flex flex-col gap-1 mt-2">
                                    {detail.affectedVisitors && <p className="text-[10px] text-foreground/55"><span className="font-medium text-foreground/60">Affects:</span> {detail.affectedVisitors}</p>}
                                    {detail.behavioralCascade && <p className="text-[10px] text-foreground/55"><span className="font-medium text-foreground/60">Cascade:</span> {detail.behavioralCascade}</p>}
                                    {detail.expectedLift && <p className="text-[10px] font-medium" style={{ color: "var(--score-high)" }}>↑ {detail.expectedLift}</p>}
                                  </div>
                                )}
                              </>
                            ) : (
                              <span>{getKillerText(k)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </DashSection>
        );

      case "sections":
        return (
          <DashSection icon={<Layers className="h-4 w-4" style={{ color: "var(--brand)" }} />} title="Section Analysis" subtitle="Per-section scores and issue breakdown">
            {!expandedSection ? (
              /* Grid view — no section selected */
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {data.sections.map((sec) => (
                  <SectionCard key={sec.id} section={sec} isExpanded={false} onClick={() => setExpandedSection(sec.id)} />
                ))}
              </div>
            ) : (
              /* Master-detail view — section selected */
              <div className="flex gap-3" style={{ minHeight: "400px" }}>
                {/* Left: compact section buttons */}
                <div className="w-[180px] shrink-0 flex flex-col gap-1">
                  {data.sections.map((sec) => {
                    const isActive = expandedSection === sec.id;
                    const issueCount = sec.findings.filter(f => f.type === "issue").length;
                    return (
                      <button
                        key={sec.id}
                        onClick={() => setExpandedSection(sec.id)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all duration-200 w-full ${
                          isActive ? "shadow-sm" : "hover:bg-foreground/[0.02]"
                        }`}
                        style={isActive ? { background: "var(--s2)", borderLeft: "2px solid var(--brand)" } : { borderLeft: "2px solid transparent" }}
                      >
                        <div className="w-7 h-7 rounded-lg grid place-items-center shrink-0" style={{ background: isActive ? "var(--brand-dim)" : "var(--s2)" }}>
                          {SECTION_ICONS[sec.id] || <Layers className="h-3 w-3" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[11px] font-medium truncate ${isActive ? "text-foreground" : "text-foreground/55"}`}>{sec.name}</p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold font-mono" style={{ color: scoreColor(sec.score) }}>{sec.score}</span>
                            {issueCount > 0 && (
                              <span className="text-[9px] px-1 py-[1px] rounded" style={{ background: "oklch(0.55 0.17 20 / 8%)", color: "var(--score-low)" }}>{issueCount}</span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Right: detail panel */}
                {(() => {
                  const sec = data.sections.find(s => s.id === expandedSection);
                  if (!sec) return null;
                  return (
                    <div className="flex-1 min-w-0 rounded-xl p-4 animate-fade-in" style={{ background: "var(--s2)" }}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg grid place-items-center" style={{ background: "var(--s1)" }}>
                            {SECTION_ICONS[sec.id] || <Layers className="h-4 w-4" />}
                          </div>
                          <div>
                            <h4 className="text-[14px] font-semibold">{sec.name}</h4>
                            <p className="text-[11px] text-foreground/45">{sec.subtitle}</p>
                          </div>
                          <span className="text-[20px] font-bold font-mono ml-2" style={{ color: scoreColor(sec.score) }}>{sec.score}</span>
                        </div>
                        <button onClick={() => setExpandedSection(null)} className="text-foreground/40 hover:text-foreground/65 transition-colors p-1 rounded-md hover:bg-foreground/[0.03]">
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Findings */}
                      <div className="flex flex-col gap-2 mb-4">
                        {sec.findings.map((f, i) => <FindingCard key={i} finding={f} />)}
                      </div>

                      {/* Recommendations */}
                      {features.improvements && sec.recommendations.length > 0 && (
                        <div className="mb-3">
                          <p className="text-[12px] uppercase tracking-[2px] text-foreground/50 mb-2">Recommendations</p>
                          <div className="flex flex-col gap-1.5">
                            {sec.recommendations.map((r, i) => (
                              <div key={i} className="flex gap-2 text-[12px] leading-relaxed text-foreground/65 p-2.5 rounded-md border-l-2" style={{ background: "var(--s1)", borderColor: "var(--brand)" }}>
                                <span className="font-medium shrink-0" style={{ color: "var(--brand)" }}>{i + 1}.</span>
                                <span>{r}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {!features.improvements && sec.recommendations.length > 0 && <LockedHint count={sec.recommendations.length} label="recommendations" />}

                      {/* Section rewrite */}
                      {sec.rewrite && features.improvements && <div className="mt-3"><SectionRewriteBlock rewrite={sec.rewrite} /></div>}
                      {sec.rewrite && !features.improvements && <div className="mt-3"><LockedHint count={1} label="AI rewrite suggestions" /></div>}
                    </div>
                  );
                })()}
              </div>
            )}
          </DashSection>
        );

      case "visual":
        return (
          <DashSection icon={<Activity className="h-4 w-4" style={{ color: "var(--accent-blue)" }} />} title="Visual Analytics" subtitle="UX quality breakdown and issue distribution">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="rounded-xl border p-4 flex flex-col items-center" style={{ background: "var(--s1)", borderColor: "var(--border)" }}>
                <p className="text-[12px] uppercase tracking-[2px] text-foreground/50 mb-3 self-start">UX Score Radar</p>
                <RadarChart categories={data.categories} />
              </div>
              <div className="flex flex-col gap-3">
                <div className="rounded-xl border p-4" style={{ background: "var(--s1)", borderColor: "var(--border)" }}>
                  <p className="text-[12px] uppercase tracking-[2px] text-foreground/50 mb-2.5">Issue Severity</p>
                  <SeverityDistribution counts={severityCounts} />
                </div>
                {visualAnalysis && visualAnalysisStatus === "done" && (
                  <div className="rounded-xl border p-4" style={{ background: "var(--s1)", borderColor: "var(--border)" }}>
                    <p className="text-[12px] uppercase tracking-[2px] text-foreground/50 mb-2.5">Visual Health</p>
                    <div className="flex flex-col gap-2">
                      {[
                        { label: "Layout", score: visualAnalysis.layoutScore },
                        { label: "Hierarchy", score: visualAnalysis.visualHierarchyScore },
                        { label: "Whitespace", score: visualAnalysis.whitespaceScore },
                        { label: "Contrast", score: visualAnalysis.colorContrastScore },
                        { label: "Mobile", score: visualAnalysis.mobileReadinessScore },
                      ].map(dim => (
                        <div key={dim.label} className="flex items-center gap-2 text-[12px]">
                          <span className="w-16 text-foreground/55 shrink-0">{dim.label}</span>
                          <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: "var(--s3)" }}>
                            <div className="h-full rounded-full animate-bar-width" style={{ background: scoreColor(dim.score), width: `${dim.score}%`, "--bar-width": `${dim.score}%` } as React.CSSProperties} />
                          </div>
                          <span className="w-7 text-right font-mono font-bold" style={{ color: scoreColor(dim.score) }}>{dim.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {visualAnalysisStatus === "loading" && (
                  <div className="rounded-xl border p-5" style={{ background: "var(--s1)", borderColor: "var(--border)" }}>
                    <p className="text-[12px] uppercase tracking-[2px] text-foreground/45 mb-3">Visual Health</p>
                    <div className="flex items-center gap-2 justify-center py-4">
                      <div className="h-3.5 w-3.5 border-2 border-foreground/15 border-t-foreground/40 rounded-full animate-spin" />
                      <span className="text-[12px] text-foreground/50">Analyzing...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DashSection>
        );

      case "trust":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {data.trustMatrix && data.trustMatrix.length > 0 && (
              <div className="rounded-xl border p-4" style={{ background: "var(--s1)" }}>
                <div className="flex items-center gap-2 mb-3.5">
                  <div className="w-7 h-7 rounded-lg grid place-items-center shrink-0" style={{ background: "var(--s2)" }}>
                    <Shield className="h-3.5 w-3.5" style={{ color: "var(--accent-blue)" }} />
                  </div>
                  <div>
                    <h3 className="text-[12px] font-semibold">Trust Matrix</h3>
                    <p className="text-[10px] text-foreground/55">Five trust dimensions</p>
                  </div>
                </div>
                {/* Visual ring gauges */}
                <div className="grid grid-cols-5 gap-1.5 mb-3">
                  {[...data.trustMatrix].sort((a, b) => a.score - b.score).map((item) => {
                    const r = 22; const c = 2 * Math.PI * r; const offset = c - (item.score / 100) * c;
                    return (
                      <div key={item.label} className="flex flex-col items-center gap-1.5 p-2 rounded-lg" style={{ background: "var(--s2)" }}>
                        <svg width="54" height="54" viewBox="0 0 54 54">
                          <circle cx="27" cy="27" r={r} fill="none" stroke="var(--s3)" strokeWidth="4" />
                          <circle cx="27" cy="27" r={r} fill="none" stroke={scoreColor(item.score)} strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} transform="rotate(-90 27 27)" style={{ transition: "stroke-dashoffset 0.8s ease" }} />
                          <text x="27" y="27" textAnchor="middle" dominantBaseline="central" fill={scoreColor(item.score)} fontSize="13" fontWeight="700" fontFamily="var(--font-mono)">{item.score}</text>
                        </svg>
                        <span className="text-[9px] text-foreground/55 text-center leading-tight">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
                {/* Behavioral notes collapsed */}
                <div className="flex flex-col gap-1">
                  {data.trustMatrix.filter(t => t.behavioralNote).slice(0, 2).map((item, i) => (
                    <p key={i} className="text-[10px] text-foreground/45 leading-relaxed"><span className="font-medium text-foreground/55">{item.label}:</span> {item.behavioralNote}</p>
                  ))}
                </div>
              </div>
            )}
            {data.confusionMap && (
              <div className="rounded-xl border p-4" style={{ background: "var(--s1)" }}>
                <div className="flex items-center gap-2 mb-3.5">
                  <div className="w-7 h-7 rounded-lg grid place-items-center shrink-0" style={{ background: "var(--s2)" }}>
                    <Brain className="h-3.5 w-3.5" style={{ color: "var(--accent-purple)" }} />
                  </div>
                  <div>
                    <h3 className="text-[12px] font-semibold">Confusion Map</h3>
                    <p className="text-[10px] text-foreground/55">Cognitive friction breakdown</p>
                  </div>
                </div>
                {/* Visual meter cards with emoji indicators */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Jargon", emoji: "📖", score: data.confusionMap.jargonScore, impact: data.confusionMap.jargonImpact },
                    { label: "Density", emoji: "📊", score: data.confusionMap.densityScore, impact: data.confusionMap.densityImpact },
                    { label: "Friction", emoji: "🚧", score: data.confusionMap.frictionWords, impact: data.confusionMap.frictionImpact },
                    { label: "Paralysis", emoji: "🔀", score: data.confusionMap.decisionParalysis, impact: data.confusionMap.paralysisImpact },
                  ].sort((a, b) => b.score - a.score).map((item) => (
                    <div key={item.label} className="rounded-lg p-2.5" style={{ background: "var(--s2)" }}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-[13px]">{item.emoji}</span>
                        <span className="text-[10px] font-medium text-foreground/60">{item.label}</span>
                        <span className="text-[12px] font-bold font-mono ml-auto" style={{ color: scoreColor(100 - item.score) }}>{item.score}</span>
                      </div>
                      <div className="h-[4px] rounded-full overflow-hidden" style={{ background: "var(--s3)" }}>
                        <div className="h-full rounded-full" style={{ background: scoreColor(100 - item.score), width: `${item.score}%`, transition: "width 0.8s ease" }} />
                      </div>
                      {item.impact && <p className="text-[9px] text-foreground/40 leading-snug mt-1.5 line-clamp-2">{item.impact}</p>}
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-foreground/35 mt-2 text-center">Higher = more friction</p>
              </div>
            )}
          </div>
        );

      case "attention":
        return (
          <DashSection icon={<Eye className="h-4 w-4" style={{ color: "var(--brand)" }} />} title="Attention Insight" subtitle="Where visitors focus and what they miss">
            {data.firstScreenAnalysis.immediateUnderstanding && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3.5">
                <MiniInsight icon={<Eye className="h-3.5 w-3.5" />} label="First impression" value={data.firstScreenAnalysis.immediateUnderstanding} color="var(--brand)" hint="What visitors understand within 5 seconds" />
                <MiniInsight icon={<HelpCircle className="h-3.5 w-3.5" />} label="Unanswered" value={data.firstScreenAnalysis.unansweredQuestion} color="var(--score-mid)" hint="The question most likely to cause bounce" />
                <MiniInsight icon={<Heart className="h-3.5 w-3.5" />} label="Dominant emotion" value={data.firstScreenAnalysis.dominantEmotion} color="var(--accent-purple)" hint="The emotional response triggered by the first screen" />
                <MiniInsight icon={<LogOut className="h-3.5 w-3.5" />} label="#1 exit reason" value={data.firstScreenAnalysis.exitReason} color="var(--score-low)" hint="The primary reason a visitor would leave within 8 seconds" />
                {data.firstScreenAnalysis.visitorMentalModel && (
                  <MiniInsight icon={<Brain className="h-3.5 w-3.5" />} label="Visitor mental model" value={data.firstScreenAnalysis.visitorMentalModel} color="var(--brand)" hint="What visitors THINK the page is about in the first 5 seconds" />
                )}
                {data.firstScreenAnalysis.decisionBarrier && (
                  <MiniInsight icon={<Lock className="h-3.5 w-3.5" />} label="Decision barrier" value={data.firstScreenAnalysis.decisionBarrier} color="oklch(0.58 0.16 75)" hint="The primary question blocking the visitor from engaging further" />
                )}
                {data.firstScreenAnalysis.attentionSequence && data.firstScreenAnalysis.attentionSequence.length > 0 && (
                  <MiniInsight icon={<Eye className="h-3.5 w-3.5" />} label="Attention sequence" value={data.firstScreenAnalysis.attentionSequence.map((s, i) => `${i + 1}. ${s}`).join(" → ")} color="var(--brand)" hint="What visitors look at first → second → third" />
                )}
                <div className="flex gap-2.5 p-3 rounded-lg text-[12px] leading-relaxed sm:col-span-2" style={{ background: "var(--s2)" }}>
                  <span className="shrink-0 mt-0.5" style={{ color: scoreColor(data.firstScreenAnalysis.clarityConfidence) }}><Target className="h-3.5 w-3.5" /></span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground/70">Clarity confidence: </span>
                    <span className="text-[16px] font-bold font-mono" style={{ color: scoreColor(data.firstScreenAnalysis.clarityConfidence) }}>{data.firstScreenAnalysis.clarityConfidence}%</span>
                    <span className="text-[10px] text-foreground/50">
                      {data.firstScreenAnalysis.clarityConfidence >= 70 ? "Visitors likely understand the offer" : data.firstScreenAnalysis.clarityConfidence >= 40 ? "Some visitors may struggle to understand" : "Most visitors will leave confused"}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {screenshotUrl ? (
              <ScreenshotSection screenshotUrl={screenshotUrl} heatmapZones={heatmapZones} pageHeight={pageHeight} viewportWidth={viewportWidth} heatmapLoading={heatmapStatus === "loading"} />
            ) : screenshotStatus === "loading" ? (
              <div className="rounded-xl border overflow-hidden" style={{ background: "var(--s2)" }}>
                <div className="relative" style={{ paddingBottom: "40%" }}>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 0%, var(--brand-dim) 50%, transparent 100%)", animation: "shimmer 1.8s ease-in-out infinite" }} />
                    </div>
                    <div className="relative flex items-center gap-2.5">
                      <div className="h-4 w-4 border-2 border-foreground/15 border-t-foreground/40 rounded-full animate-spin" />
                      <span className="text-[12px] text-foreground/55 font-medium">Generating screenshot & heatmap...</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : screenshotStatus === "failed" ? (
              <div className="rounded-xl border p-5 flex items-center justify-center" style={{ background: "var(--s1)", minHeight: "60px" }}>
                <p className="text-[12px] text-foreground/45">Screenshot capture unavailable for this page</p>
              </div>
            ) : null}

            {/* 5-Second Test — blur simulation */}
            {screenshotUrl && (
              <div className="mt-4 rounded-xl border p-4" style={{ background: "var(--s1)", borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" style={{ color: "var(--brand)" }} />
                    <div>
                      <h4 className="text-[13px] font-semibold">5-Second Test Simulation</h4>
                      <p className="text-[10px] text-foreground/45">What visitors notice vs miss in the first 5 seconds</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setBlurTestActive(!blurTestActive)}
                    className="text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all"
                    style={blurTestActive
                      ? { background: "var(--brand)", color: "white" }
                      : { background: "var(--s2)", color: "var(--foreground)" }
                    }
                  >
                    {blurTestActive ? "Show Full" : "Run 5s Test"}
                  </button>
                </div>
                <div className="relative rounded-lg overflow-hidden" style={{ maxHeight: "400px" }}>
                  <img
                    src={screenshotUrl}
                    alt="Website screenshot used for UXLens 5-second first impression test"
                    className="w-full object-cover object-top transition-all duration-700"
                    style={blurTestActive ? { filter: "blur(12px) brightness(0.7)" } : {}}
                  />
                  {/* Unblurred spotlight circles over attention areas */}
                  {blurTestActive && heatmapZones && heatmapZones.length > 0 && (
                    <div className="absolute inset-0">
                      {/* SVG mask: everything blurred except attention circles */}
                      <svg className="absolute inset-0 w-full h-full" style={{ mixBlendMode: "normal" }}>
                        <defs>
                          <mask id="blur-mask">
                            <rect width="100%" height="100%" fill="black" />
                            {heatmapZones.slice(0, 8).map((zone, i) => (
                              <circle
                                key={i}
                                cx={`${(zone.x / (viewportWidth || 1440)) * 100}%`}
                                cy={`${(zone.y / (pageHeight || 900)) * 100}%`}
                                r={`${Math.max(zone.radius / (viewportWidth || 1440) * 100, 3)}%`}
                                fill="white"
                                opacity={zone.intensity}
                              />
                            ))}
                          </mask>
                        </defs>
                      </svg>
                      {/* Clear image on top, masked to only show attention zones */}
                      <img
                        src={screenshotUrl}
                        alt="Attention zone spotlight overlay for 5-second test"
                        className="absolute inset-0 w-full h-full object-cover object-top"
                        style={{
                          maskImage: `url(#blur-mask)`,
                          WebkitMaskImage: `url(#blur-mask)`,
                        }}
                      />
                      {/* Fallback: radial gradient spotlights */}
                      {heatmapZones.slice(0, 5).map((zone, i) => {
                        const xPct = (zone.x / (viewportWidth || 1440)) * 100;
                        const yPct = (zone.y / (pageHeight || 900)) * 100;
                        const sizePct = Math.max(zone.radius / (viewportWidth || 1440) * 200, 8);
                        return (
                          <div
                            key={`spot-${i}`}
                            className="absolute rounded-full animate-fade-in"
                            style={{
                              left: `${xPct}%`,
                              top: `${yPct}%`,
                              width: `${sizePct}%`,
                              paddingBottom: `${sizePct}%`,
                              transform: "translate(-50%, -50%)",
                              background: `radial-gradient(circle, transparent 30%, oklch(0.504 0.282 276.1 / ${zone.intensity * 0.25}) 100%)`,
                              border: `1.5px solid oklch(0.504 0.282 276.1 / ${zone.intensity * 0.4})`,
                              boxShadow: `0 0 ${zone.intensity * 20}px oklch(0.504 0.282 276.1 / ${zone.intensity * 0.15})`,
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                  {blurTestActive && (!heatmapZones || heatmapZones.length === 0) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2.5 text-center">
                        <p className="text-[12px] font-medium text-foreground/70">Heatmap data needed for spotlight effect</p>
                        <p className="text-[10px] text-foreground/45">The blur shows what visitors likely miss</p>
                      </div>
                    </div>
                  )}
                </div>
                {blurTestActive && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-lg p-2.5" style={{ background: "oklch(0.504 0.282 276.1 / 5%)" }}>
                      <p className="text-[10px] font-semibold mb-0.5" style={{ color: "var(--brand)" }}>What visitors see</p>
                      <p className="text-[10px] text-foreground/50">Bright areas = high attention zones where eyes naturally land</p>
                    </div>
                    <div className="rounded-lg p-2.5" style={{ background: "oklch(0.55 0.17 20 / 5%)" }}>
                      <p className="text-[10px] font-semibold mb-0.5" style={{ color: "var(--score-low)" }}>What they miss</p>
                      <p className="text-[10px] text-foreground/50">Blurred areas = content most visitors skip in the first 5 seconds</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DashSection>
        );

      case "heuristics":
        if (!data.heuristicEvaluation) return null;
        return (
          <DashSection icon={<ListChecks className="h-4 w-4" style={{ color: "var(--accent-purple)" }} />} title="Heuristic Insights" subtitle={`Nielsen's 10 heuristics — Overall: ${data.heuristicEvaluation.overallHeuristicScore.toFixed(1)}/10`}>
            {/* Radar chart + overall score */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-4 p-3 rounded-xl border" style={{ background: "var(--s2)", borderColor: "var(--border)" }}>
              {/* SVG Spider/Radar Chart */}
              <div className="shrink-0">
                <svg width="200" height="200" viewBox="0 0 200 200">
                  {/* Grid rings */}
                  {[0.2, 0.4, 0.6, 0.8, 1.0].map((ring) => (
                    <polygon key={ring} points={Array.from({ length: 10 }, (_, i) => {
                      const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
                      return `${100 + Math.cos(angle) * 80 * ring},${100 + Math.sin(angle) * 80 * ring}`;
                    }).join(" ")} fill="none" stroke="var(--foreground)" strokeOpacity={0.07} strokeWidth="1" />
                  ))}
                  {/* Axis lines */}
                  {Array.from({ length: 10 }, (_, i) => {
                    const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
                    return <line key={i} x1="100" y1="100" x2={100 + Math.cos(angle) * 80} y2={100 + Math.sin(angle) * 80} stroke="var(--foreground)" strokeOpacity={0.05} strokeWidth="1" />;
                  })}
                  {/* Data polygon */}
                  <polygon points={data.heuristicEvaluation.heuristics.map((h, i) => {
                    const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
                    const r = (h.score / 10) * 80;
                    return `${100 + Math.cos(angle) * r},${100 + Math.sin(angle) * r}`;
                  }).join(" ")} fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" strokeWidth="2" />
                  {/* Score dots + labels */}
                  {data.heuristicEvaluation.heuristics.map((h, i) => {
                    const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
                    const r = (h.score / 10) * 80;
                    const labelR = 92;
                    return (
                      <g key={h.id}>
                        <circle cx={100 + Math.cos(angle) * r} cy={100 + Math.sin(angle) * r} r="3" fill={heuristicColor(h.score)} />
                        <text x={100 + Math.cos(angle) * labelR} y={100 + Math.sin(angle) * labelR} textAnchor="middle" dominantBaseline="central" fill="var(--foreground)" fillOpacity="0.4" fontSize="7" fontWeight="500">
                          {h.name.split(" ").slice(0, 2).join(" ")}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <span className="text-[28px] font-bold font-mono" style={{ color: heuristicColor(data.heuristicEvaluation.overallHeuristicScore) }}>{data.heuristicEvaluation.overallHeuristicScore.toFixed(1)}<span className="text-[14px] text-foreground/30">/10</span></span>
                <span className="text-[12px] font-semibold">Overall Heuristic Score</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {[...data.heuristicEvaluation.heuristics].sort((a, b) => a.score - b.score).slice(0, 3).map((h) => (
                    <span key={h.id} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: heuristicBg(h.score), color: heuristicColor(h.score) }}>
                      {h.name.split(" ").slice(0, 2).join(" ")}: {h.score}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[...data.heuristicEvaluation.heuristics].sort((a, b) => a.score - b.score).map((h) => (
                <HeuristicCard key={h.id} heuristic={h} />
              ))}
            </div>
          </DashSection>
        );

      case "improvements":
        return (
          <DashSection icon={<Lightbulb className="h-4 w-4" style={{ color: "var(--score-high)" }} />} title="Improvements" subtitle="Quick wins and strategic fixes">
            {data.quickWins.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-6 h-6 rounded-full grid place-items-center" style={{ background: "oklch(0.52 0.14 155 / 12%)" }}>
                    <Zap className="h-3 w-3" style={{ color: "var(--score-high)" }} />
                  </div>
                  <p className="text-[12px] font-semibold" style={{ color: "var(--score-high)" }}>Quick Wins</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold" style={{ background: "oklch(0.52 0.14 155 / 10%)", color: "var(--score-high)" }}>{data.quickWins.length}</span>
                  <span className="text-[10px] text-foreground/40 ml-auto">Under 1 hour each</span>
                </div>
                <div className="flex flex-col gap-2 mb-5">
                  {data.quickWins.map((w, i) => {
                    const detail = getActionDetail(w);
                    return (
                      <div key={i} className="rounded-lg p-3 relative overflow-hidden" style={{ background: "var(--s2)" }}>
                        <div className="absolute top-0 left-0 w-[3px] h-full" style={{ background: "var(--score-high)" }} />
                        <div className="flex items-start gap-2.5 pl-1">
                          <div className="w-5 h-5 rounded-full grid place-items-center shrink-0 mt-0.5" style={{ background: "oklch(0.52 0.14 155 / 10%)" }}>
                            <Check className="h-3 w-3" style={{ color: "var(--score-high)" }} />
                          </div>
                          <div className="flex-1">
                            <span className="text-[12px] text-foreground/70">{getActionText(w)}</span>
                            {detail?.expectedImpact && (
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <TrendingUp className="h-3 w-3" style={{ color: "var(--score-high)", opacity: 0.6 }} />
                                <span className="text-[10px] font-medium" style={{ color: "var(--score-high)", opacity: 0.7 }}>{detail.expectedImpact}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            {features.improvements && data.strategicFixes.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-6 h-6 rounded-full grid place-items-center" style={{ background: "oklch(0.637 0.185 295 / 12%)" }}>
                    <Target className="h-3 w-3" style={{ color: "var(--accent-purple)" }} />
                  </div>
                  <p className="text-[12px] font-semibold" style={{ color: "var(--accent-purple)" }}>Strategic Fixes</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold" style={{ background: "oklch(0.637 0.185 295 / 10%)", color: "var(--accent-purple)" }}>{data.strategicFixes.length}</span>
                  <span className="text-[10px] text-foreground/40 ml-auto">Deeper changes</span>
                </div>
                <div className="flex flex-col gap-2">
                  {data.strategicFixes.map((f, i) => {
                    const text = getActionText(f);
                    const detail = getActionDetail(f);
                    return (
                      <div key={i} className="rounded-lg p-3 relative overflow-hidden" style={{ background: "var(--s2)" }}>
                        <div className="absolute top-0 left-0 w-[3px] h-full" style={{ background: "var(--accent-purple)" }} />
                        <div className="flex items-start gap-2.5 pl-1">
                          <span className="w-5 h-5 rounded-full grid place-items-center shrink-0 text-[10px] font-bold" style={{ background: "oklch(0.637 0.185 295 / 10%)", color: "var(--accent-purple)" }}>{i + 1}</span>
                          <div className="flex-1">
                            <span className="text-[12px] text-foreground/70">{text}</span>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: "var(--accent-purple)", background: "oklch(0.637 0.185 295 / 7%)" }}>{deriveScope(text)}</span>
                              {detail?.expectedImpact && (
                                <span className="text-[10px] font-medium" style={{ color: "var(--accent-purple)", opacity: 0.7 }}>{detail.expectedImpact}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            {!features.improvements && data.strategicFixes.length > 0 && <LockedHint count={data.strategicFixes.length} label="strategic fixes" />}
            {data.uxStrengths && data.uxStrengths.length > 0 && (
              <div className="mt-5 pt-4">
                <p className="text-[12px] uppercase tracking-[2px] mb-2.5 flex items-center gap-1.5" style={{ color: "var(--score-high)" }}>
                  <Sparkles className="h-3 w-3" /> UX Strengths
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {data.uxStrengths.map((s, i) => (
                    <div key={i} className="flex gap-2 text-[12px] leading-relaxed text-foreground/65 p-2 px-2.5 rounded-md" style={{ background: "oklch(0.52 0.14 155 / 4%)" }}>
                      <Check className="h-3 w-3 shrink-0 mt-0.5" style={{ color: "var(--score-high)" }} />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!features.improvements && <UpgradeCard />}
          </DashSection>
        );

      case "rewrite":
        return (
          <div className="flex flex-col gap-4">
            <HeroRewrite rewrite={data.rewrite} locked={!features.improvements} />
            {features.improvements && data.rewrite.rewriteRationale && (
              <p className="text-[12px] text-foreground/50 leading-relaxed px-1">{data.rewrite.rewriteRationale}</p>
            )}
          </div>
        );

      case "personas":
        if (!data.personaFeedback?.length) return null;
        return (
          <DashSection icon={<User className="h-4 w-4" style={{ color: "var(--brand)" }} />} title="What Each Stakeholder Thinks" subtitle="Your page reviewed through 5 professional lenses">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {data.personaFeedback.map((p: PersonaFeedback, i: number) => (
                <div key={i} className="rounded-xl p-3.5 border transition-all duration-200 hover:border-foreground/10" style={{ background: "var(--s1)", borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--brand-dim)" }}>
                      {getPersonaIcon(p.persona)}
                    </span>
                    <span className="text-[12px] font-semibold text-foreground">{p.persona}</span>
                    <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded" style={{
                      background: p.priority === "high" ? "oklch(0.65 0.25 29 / 10%)" : p.priority === "medium" ? "oklch(0.72 0.19 75 / 10%)" : "oklch(0.52 0.14 155 / 8%)",
                      color: p.priority === "high" ? "var(--score-low)" : p.priority === "medium" ? "var(--score-mid)" : "var(--score-high)",
                    }}>{p.priority}</span>
                  </div>
                  <p className="text-[11px] text-foreground/55 leading-relaxed mb-2">{p.feedback}</p>
                  <p className="text-[11px] font-medium text-foreground/70">
                    <span className="text-foreground/40">Top concern: </span>{p.topConcern}
                  </p>
                </div>
              ))}
            </div>
          </DashSection>
        );

      case "competitors":
        return (
          <div>
            {isSharedView ? (
              competitorAnalysis && <CompetitorSection data={competitorAnalysis} status="done" />
            ) : (
              competitorStatus && competitorStatus !== "locked" ? (
                <CompetitorSection data={competitorAnalysis} status={competitorStatus} onManualCompetitors={onManualCompetitors} />
              ) : (
                <CompetitorLockedPreview />
              )
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const tabsRef = useRef<HTMLDivElement>(null);
  const scrollTabs = useCallback((dir: "left" | "right") => {
    if (!tabsRef.current) return;
    tabsRef.current.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  }, []);

  return (
    <div className="w-screen relative z-[1]" style={{ left: "50%", marginLeft: "-50vw" }}>
      {/* ── Figma-style toolbar — logo left, tools center, actions right ── */}
      <div className="w-full h-12 px-3 flex items-center border-b" style={{ borderColor: "var(--border)", background: "var(--background)" }}>

        {/* ▸ Left: Logo + project info */}
        <div className="flex items-center gap-2.5 min-w-0 shrink-0">
          <Link href="/dashboard" className="shrink-0 flex items-center gap-1.5 transition-opacity hover:opacity-70" aria-label="Back to dashboard">
            <svg width="20" height="20" viewBox="0 0 634 617" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path fillRule="evenodd" clipRule="evenodd" d="M469.152 100.312L380.036 148.394L440.22 149.221C471.143 149.645 501.374 158.434 527.702 174.653L633 239.519L573.18 336.563L486.965 283.453L516.343 335.97C531.437 362.955 538.939 393.522 538.053 424.426L534.508 548.019L420.528 544.752L423.431 443.557L392.624 495.248C376.795 521.809 354.065 543.588 326.849 558.273L218.008 617L163.848 516.688L252.964 468.604L192.781 467.778C161.857 467.354 131.625 458.566 105.296 442.346L0 377.481L59.8199 280.436L146.032 333.546L116.656 281.03C101.562 254.045 94.06 223.478 94.9464 192.574L98.4916 68.981L212.472 72.2475L209.568 173.442L240.376 121.75C256.205 95.1905 278.934 73.4123 306.15 58.7279L414.992 0L469.152 100.312ZM276.138 284.453C267.545 298.872 267.299 316.781 275.494 331.43C283.685 346.073 299.078 355.235 315.855 355.465C332.632 355.695 348.271 346.959 356.861 332.546C365.454 318.127 365.7 300.218 357.506 285.569C349.314 270.925 333.921 261.763 317.144 261.533C300.367 261.303 284.728 270.04 276.138 284.453Z" fill="#4C2CFF" />
            </svg>
          </Link>
          <span className="w-px h-5 shrink-0" style={{ background: "var(--border)" }} />
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative w-[24px] h-[24px] shrink-0">
              <svg className="-rotate-90 w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" strokeWidth="8" style={{ stroke: "var(--s3)" }} />
                <circle cx="50" cy="50" r="44" fill="none" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset} style={{ stroke: dialColor }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[8px] font-bold" style={{ color: dialColor }}>{data.overallScore}</span>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-foreground leading-none truncate">{domain}</p>
              <p className="text-[9px] text-foreground/30 mt-0.5 truncate">
                {data.pageTypeLabel ? `${data.pageTypeLabel} Audit` : "UX Audit"}
              </p>
            </div>
          </div>
        </div>

        {/* ▸ Center: Report label */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ background: "var(--s2)" }}>
            <span className="text-[11px] font-medium px-4 py-1.5 rounded-md text-white shadow-sm" style={{ background: "var(--brand)" }}>
              Report
            </span>
          </div>
        </div>

        {/* ▸ Right: Actions + share */}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={onReset} className="inline-flex items-center gap-1.5 text-[11px] text-foreground/35 hover:text-foreground/55 transition-colors px-2 py-1 rounded-md hover:bg-foreground/[0.03]">
            <RotateCcw className="h-3 w-3" /> New
          </button>
          {onToggleShare && !isSharedView && (
            shareToken ? (
              <div className="flex items-center gap-1">
                <button onClick={onCopyShareLink} className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors" style={{ background: "var(--s2)", color: "var(--foreground)" }}>
                  {shareCopied ? <Check className="h-3 w-3 text-green-600" /> : <Link2 className="h-3 w-3" />}
                  {shareCopied ? "Copied" : "Copy Link"}
                </button>
                <button onClick={onToggleShare} disabled={shareLoading} className="inline-flex items-center rounded-md p-1.5 text-red-500/70 transition-colors hover:bg-red-50 hover:text-red-500">
                  {shareLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2Off className="h-3 w-3" />}
                </button>
              </div>
            ) : (
              <button onClick={onToggleShare} disabled={shareLoading} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-white transition-all hover:opacity-90" style={{ background: "var(--brand)" }}>
                {shareLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Share2 className="h-3 w-3" />}
                Share
              </button>
            )
          )}
        </div>
      </div>

      {/* ── 3-panel body ── */}
      <div className="flex" style={{ height: "calc(100vh - 48px)" }}>

        {/* LEFT SIDEBAR — compact flat nav */}
        <div className="w-[180px] shrink-0 border-r overflow-y-auto hidden md:flex flex-col" style={{ borderColor: "var(--border)", background: "var(--background)" }}>
          <div className="py-1.5 flex flex-col">
            {navSections.map((sec) => {
              const isActive = activeNav === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveNav(sec.id)}
                  className={`w-full flex items-center gap-2 px-3 py-[7px] text-left transition-colors duration-100 ${
                    isActive ? "" : "hover:bg-foreground/[0.03]"
                  }`}
                  style={isActive ? { background: "var(--brand-dim)" } : undefined}
                >
                  <span className="shrink-0" style={{ color: isActive ? "var(--brand)" : "var(--foreground)", opacity: isActive ? 1 : 0.3 }}>{sec.icon}</span>
                  <span className={`text-[11px] flex-1 truncate ${isActive ? "font-semibold text-foreground" : "text-foreground/50"}`}>
                    {sec.label}
                  </span>
                  {sec.badge !== undefined && sec.badge > 0 && (
                    <span className="text-[9px] font-medium tabular-nums" style={{ color: isActive ? "var(--brand)" : "var(--foreground)", opacity: isActive ? 0.7 : 0.25 }}>
                      {sec.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* CENTER CANVAS — main content */}
        <div className="flex-1 overflow-y-auto">
          {/* Mobile-only horizontal tabs (hidden on md+) */}
          <div className="md:hidden sticky top-0 z-20 border-b" style={{ background: "var(--background)", borderColor: "var(--border)" }}>
            <div className="relative flex items-center">
              <button onClick={() => scrollTabs("left")} className="shrink-0 w-7 h-full flex items-center justify-center text-foreground/25 hover:text-foreground/50 transition-colors" aria-label="Scroll tabs left">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <div ref={tabsRef} className="flex-1 overflow-x-auto hide-scrollbar">
                <div className="flex items-center gap-0.5 min-w-max py-1">
                  {navSections.map((sec) => {
                    const isActive = activeNav === sec.id;
                    return (
                      <button
                        key={sec.id}
                        onClick={() => setActiveNav(sec.id)}
                        className={`relative shrink-0 flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-all rounded-md ${
                          isActive ? "text-foreground" : "text-foreground/40 hover:text-foreground/60 hover:bg-foreground/[0.03]"
                        }`}
                      >
                        <span style={isActive ? { color: sec.color } : undefined}>{sec.icon}</span>
                        <span>{sec.label}</span>
                        {sec.badge !== undefined && sec.badge > 0 && (
                          <span className="text-[9px] font-bold px-1.5 py-[1px] rounded-md" style={isActive ? { background: sec.color, color: "white" } : { background: "var(--s2)", color: "var(--foreground)", opacity: 0.4 }}>
                            {sec.badge}
                          </span>
                        )}
                        {isActive && <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full" style={{ background: "var(--brand)" }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button onClick={() => scrollTabs("right")} className="shrink-0 w-7 h-full flex items-center justify-center text-foreground/25 hover:text-foreground/50 transition-colors" aria-label="Scroll tabs right">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 sm:p-6 max-w-[860px] mx-auto">
            {renderSectionContent(activeNav)}

            {/* Shared view CTA */}
            {isSharedView && activeNav === "overview" && (
              <div className="mt-6">
                <div className="rounded-xl border border-border p-6 text-center" style={{ background: "var(--s1)" }}>
                  <p className="text-sm font-medium text-foreground mb-1">Want your own UX audit?</p>
                  <p className="text-xs text-foreground/60 mb-4">Get a comprehensive 10-layer diagnostic for any landing page</p>
                  <a href="/" className="inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-medium text-white transition-all hover:opacity-90" style={{ background: "var(--brand)" }}>
                    <Sparkles className="h-3.5 w-3.5" /> Try UXLens Free
                  </a>
                </div>
              </div>
            )}

            {/* Human audit CTA */}
            {!isSharedView && activeNav === "improvements" && (
              <div className="mt-6">
                <HumanAuditCTA url={url} onRequested={onHumanAuditRequested} />
              </div>
            )}

            {/* Bottom action */}
            {!isSharedView && activeNav === "competitors" && (
              <div className="flex justify-center pt-6 pb-4">
                <button onClick={onReset} className="inline-flex items-center gap-2 rounded-lg shadow-elevation-1 px-6 py-2.5 text-[14px] font-medium text-foreground transition-all duration-150 hover:opacity-90 active:scale-[0.98]" style={{ background: "var(--s1)" }}>
                  <RotateCcw className="h-3.5 w-3.5" /> Analyze another page
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Hide scrollbar */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {!isSharedView && features.aiChat && auditId && <ChatWidget auditId={auditId} plan={plan} />}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Dashboard Sub-Components
   ════════════════════════════════════════════════════════════ */

/* ── Dashboard Section Wrapper ── */
function DashSection({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border p-5 pb-6 mb-6" style={{ background: "var(--s1)" }}>
      <div className="flex items-center gap-3 pb-4 mb-4">
        <div className="w-7 h-7 rounded-lg grid place-items-center shrink-0" style={{ background: "var(--s2)" }}>{icon}</div>
        <div>
          <h3 className="text-[15px] font-semibold">{title}</h3>
          <p className="text-[12px] text-foreground/45">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

/* ── Metric Card ── */
function MetricCard({ label, value, suffix = "", color }: { label: string; value: number; suffix?: string; color: string }) {
  return (
    <div className="dash-card rounded-xl border p-4 flex flex-col items-center justify-center text-center" style={{ background: "var(--s1)" }}>
      <div className="flex items-baseline gap-0.5 mb-1">
        <span className="text-[24px] font-bold tabular-nums animate-count-up" style={{ color }}>{value}</span>
        {suffix && <span className="text-[11px] text-foreground/40">{suffix}</span>}
      </div>
      <span className="text-[11px] text-foreground/50 font-medium leading-tight">{label}</span>
    </div>
  );
}

/* ── Bar Chart Row ── */
function BarChartRow({ label, score, color, note }: { label: string; score: number; color: string; note: string }) {
  return (
    <div className="group">
      <div className="flex items-center gap-3">
        <span className="text-[12px] text-foreground/60 w-[130px] sm:w-[155px] shrink-0 truncate">{label}</span>
        <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: "var(--s3)" }}>
          <div className="h-full rounded-full animate-bar-width" style={{ background: color, width: `${score}%`, "--bar-width": `${score}%` } as React.CSSProperties} />
        </div>
        <span className="text-[14px] font-bold font-mono w-8 text-right" style={{ color }}>{score}</span>
      </div>
      {/* Note — slides open on hover */}
      {note && (
        <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-200">
          <div className="overflow-hidden">
            <p className="text-[10px] text-foreground/55 leading-relaxed pt-1.5 pl-[130px] sm:pl-[155px] ml-3">{note}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Metric Grid Card with Sparkline ── */
function MetricGridCard({ label, score, color, icon, sparkData, note, desc }: { label: string; score: number; color: string; icon: React.ReactNode; sparkData: number[]; note?: string; desc?: string }) {
  return (
    <div className="dash-card rounded-xl border p-4" style={{ background: "var(--s1)" }}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 text-[12px] text-foreground/50">
          <span style={{ color }}>{icon}</span>
          <span className="truncate">{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[20px] font-bold font-mono" style={{ color }}>{score}</span>
          <span className="text-[10px] text-foreground/40 leading-none">{scoreInterpretation(score)}</span>
        </div>
      </div>
      {desc && <p className="text-[10px] text-foreground/40 mb-2 leading-snug">{desc}</p>}
      {/* Score bar — single clean progress indicator */}
      <div className="h-[4px] rounded-full overflow-hidden" style={{ background: "var(--s3)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ background: color, width: `${score}%` }} />
      </div>
      {note && <p className="text-[10px] text-foreground/45 leading-snug mt-2.5">{note}</p>}
    </div>
  );
}

/* ── Insight Dashboard Card (expandable) ── */
function InsightDashCard({ finding, defaultOpen = false }: { finding: Finding; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const styles = {
    issue: { bg: "oklch(0.55 0.17 20 / 5%)", border: "oklch(0.55 0.17 20 / 10%)", color: "var(--score-low)", icon: <X className="h-3 w-3" /> },
    warning: { bg: "oklch(0.58 0.16 75 / 5%)", border: "oklch(0.58 0.16 75 / 10%)", color: "var(--score-mid)", icon: <AlertTriangle className="h-3 w-3" /> },
    positive: { bg: "oklch(0.52 0.14 155 / 5%)", border: "oklch(0.52 0.14 155 / 10%)", color: "var(--score-high)", icon: <Check className="h-3 w-3" /> },
  };
  const s = styles[finding.type];
  const impactBadge: Record<string, React.CSSProperties> = {
    high: { background: "oklch(0.55 0.17 20 / 15%)", color: "var(--score-low)" },
    medium: { background: "oklch(0.58 0.16 75 / 15%)", color: "var(--score-mid)" },
    low: { background: "oklch(0.52 0.14 155 / 15%)", color: "var(--score-high)" },
  };

  return (
    <div className="rounded-xl cursor-pointer transition-all duration-200" style={{ background: s.bg }} onClick={() => setOpen(!open)}>
      <div className="flex items-center gap-3 p-4">
        <span className="shrink-0" style={{ color: s.color }}>{s.icon}</span>
        <div className="flex-1 min-w-0">
          <span className="text-[12px] font-medium block" style={{ color: s.color }}>{finding.title}</span>
          {!open && finding.desc && <p className="text-[12px] text-foreground/55 mt-0.5 line-clamp-1">{finding.desc}</p>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {finding.severity && <span className="text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider" style={SEVERITY_STYLES[finding.severity] || {}}>{finding.severity}</span>}
          {!open && finding.estimatedConversionLift && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: "oklch(0.52 0.14 155 / 10%)", color: "var(--score-high)" }}>
              {"↑"} {finding.estimatedConversionLift}
            </span>
          )}
          {!open && finding.estimatedEffort && finding.estimatedEffort !== "—" && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full text-foreground/50 hidden sm:inline" style={{ background: "var(--s2)" }}>
              {finding.estimatedEffort}
            </span>
          )}
        </div>
        <ChevronDown className={`h-3 w-3 text-foreground/50 transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`} />
      </div>
      <div className={`insight-expand ${open ? "open" : ""}`}>
        <div>
          <div className="px-3.5 pb-3.5 pt-0 text-[12px] text-foreground/65 leading-relaxed">
            <p className="pt-3">{finding.desc}</p>

            {/* Revenue impact strip */}
            {(finding.impactHeadline || finding.estimatedConversionLift || finding.estimatedEffort) && (
              <div className="mt-2.5 flex flex-wrap items-center gap-2 p-2.5 rounded-lg" style={{ background: finding.type === "positive" ? "oklch(0.52 0.14 155 / 6%)" : "oklch(0.55 0.17 20 / 6%)" }}>
                {finding.impactHeadline && (
                  <span className="text-[11px] font-semibold" style={{ color: finding.type === "positive" ? "var(--score-high)" : "var(--score-low)" }}>
                    {finding.impactHeadline}
                  </span>
                )}
                {finding.estimatedConversionLift && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "oklch(0.52 0.14 155 / 10%)", color: "var(--score-high)" }}>
                    ↑ {finding.estimatedConversionLift}
                  </span>
                )}
                {finding.estimatedEffort && finding.estimatedEffort !== "—" && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full text-foreground/50" style={{ background: "var(--s2)" }}>
                    ⏱ {finding.estimatedEffort}
                  </span>
                )}
              </div>
            )}

            {/* Behavioral context block */}
            {finding.userExperience && (
              <div className="mt-2.5 p-2.5 rounded-md text-[12px] border-l-2" style={{ background: "var(--brand-dim)", borderColor: "var(--brand-glow)" }}>
                <span className="font-semibold text-foreground/70 flex items-center gap-1 mb-0.5"><User className="h-3 w-3" style={{ color: "var(--brand)" }} /> User experience</span>
                <span className="text-foreground/55">{finding.userExperience}</span>
              </div>
            )}

            {/* Journey stage + behavioral mechanism badges */}
            {(finding.journeyStage || finding.behavioralMechanism) && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {finding.journeyStage && JOURNEY_STAGE_COLORS[finding.journeyStage] && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: JOURNEY_STAGE_COLORS[finding.journeyStage].bg, color: JOURNEY_STAGE_COLORS[finding.journeyStage].color }}>
                    {JOURNEY_STAGE_COLORS[finding.journeyStage].label} stage
                  </span>
                )}
                {finding.behavioralMechanism && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ color: "var(--foreground)", opacity: 0.4, background: "var(--s2)" }}>
                    {finding.behavioralMechanism}
                  </span>
                )}
              </div>
            )}

            {/* Friction cascade */}
            {finding.frictionCascade && (
              <div className="mt-2 p-2.5 rounded-md text-[12px]" style={{ background: "var(--s1)" }}>
                <span className="font-semibold" style={{ color: "var(--score-low)" }}>Friction cascade: </span>
                <span className="text-foreground/55">{finding.frictionCascade}</span>
              </div>
            )}

            {finding.whyItMatters && (
              <div className="mt-1.5 p-2.5 rounded-md text-[12px]" style={{ background: "oklch(0.58 0.16 75 / 4%)" }}>
                <span className="font-semibold" style={{ color: "var(--score-mid)" }}>Why it matters: </span>{finding.whyItMatters}
              </div>
            )}
            {finding.recommendedFix && (
              <div className="mt-1.5 p-2.5 rounded-md text-[12px]" style={{ background: "oklch(0.52 0.14 155 / 4%)" }}>
                <span className="font-semibold" style={{ color: "var(--score-high)" }}>Fix: </span>{finding.recommendedFix}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Section Card (compact, clickable) ── */
function SectionCard({ section, isExpanded, onClick }: { section: AuditSection; isExpanded: boolean; onClick: () => void }) {
  const issueCount = section.findings.filter(f => f.type === "issue").length;
  return (
    <button onClick={onClick} className={`dash-card rounded-xl border p-4 text-left transition-all duration-250 w-full ${isExpanded ? "ring-2" : ""}`} style={{ background: "var(--s1)", "--tw-ring-color": "var(--brand-glow)" } as React.CSSProperties}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg grid place-items-center shrink-0" style={{ background: "var(--s2)" }}>
          {SECTION_ICONS[section.id] || <Layers className="h-3.5 w-3.5" />}
        </div>
        <ChevronRight className={`h-3 w-3 text-foreground/30 ml-auto transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
      </div>
      <p className="text-[12px] font-semibold text-foreground/65 mb-1 truncate">{section.name}</p>
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: scoreColor(section.score) }} />
        <span className="text-[18px] font-bold font-mono" style={{ color: scoreColor(section.score) }}>{section.score}</span>
        {issueCount > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "oklch(0.55 0.17 20 / 8%)", color: "var(--score-low)" }}>{issueCount}</span>
        )}
      </div>
      <span className="text-[10px] text-foreground/35 mt-2 flex items-center gap-0.5">View details <ChevronRight className="h-2.5 w-2.5" /></span>
    </button>
  );
}

/* ── Radar Chart (SVG) ── */
function RadarChart({ categories }: { categories: UXAuditResult["categories"] }) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 72;
  const cats = [
    { label: "Clarity", score: categories.messageClarity.score },
    { label: "Cog. Load", score: categories.cognitiveLoad.score },
    { label: "Conversion", score: categories.conversionArch.score },
    { label: "Trust", score: categories.trustSignals.score },
    { label: "Contradictions", score: categories.contradictions.score },
    { label: "First Screen", score: categories.firstScreen.score },
  ];

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
    const r = (value / 100) * maxR;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const gridLevels = [25, 50, 75, 100];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="animate-radar">
      {/* Grid */}
      {gridLevels.map(level => {
        const pts = Array.from({ length: 6 }, (_, i) => getPoint(i, level));
        return <polygon key={level} points={pts.map(p => `${p.x},${p.y}`).join(" ")} fill="none" stroke="var(--s3)" strokeWidth="1" />;
      })}
      {/* Axis lines */}
      {Array.from({ length: 6 }, (_, i) => {
        const p = getPoint(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--s3)" strokeWidth="1" />;
      })}
      {/* Data polygon */}
      <polygon
        points={cats.map((c, i) => { const p = getPoint(i, c.score); return `${p.x},${p.y}`; }).join(" ")}
        fill="oklch(0.504 0.282 276.1 / 12%)"
        stroke="var(--brand)"
        strokeWidth="2"
      />
      {/* Data dots — per-category color */}
      {cats.map((c, i) => { const p = getPoint(i, c.score); return <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="var(--brand)" />; })}
      {/* Labels */}
      {cats.map((c, i) => {
        const p = getPoint(i, 130);
        return <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" className="text-[10px] fill-foreground/55">{c.label}</text>;
      })}
    </svg>
  );
}

/* ── Severity Distribution ── */
function SeverityDistribution({ counts }: { counts: Record<string, number> }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  const items = [
    { label: "Critical", count: counts.critical, color: "var(--score-low)", bg: "oklch(0.55 0.17 20 / 15%)" },
    { label: "High", count: counts.high, color: "var(--score-low)", bg: "oklch(0.55 0.17 20 / 10%)" },
    { label: "Medium", count: counts.medium, color: "var(--score-mid)", bg: "oklch(0.58 0.16 75 / 10%)" },
    { label: "Low", count: counts.low, color: "var(--score-high)", bg: "oklch(0.52 0.14 155 / 10%)" },
  ].filter(i => i.count > 0);

  return (
    <div className="flex flex-col gap-2">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-2.5 text-[12px]">
          <span className="w-14 text-foreground/55 shrink-0">{item.label}</span>
          <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: "var(--s3)" }}>
            <div className="h-full rounded-full animate-bar-width" style={{ background: item.color, width: `${(item.count / total) * 100}%`, "--bar-width": `${(item.count / total) * 100}%` } as React.CSSProperties} />
          </div>
          <span className="font-mono font-bold w-5 text-right" style={{ color: item.color }}>{item.count}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Mini Insight (for first-screen analysis) ── */
function MiniInsight({ icon, label, value, color, hint }: { icon: React.ReactNode; label: string; value: string; color: string; hint?: string }) {
  return (
    <div className="rounded-lg p-3 text-[12px] leading-relaxed relative overflow-hidden" style={{ background: "var(--s2)" }}>
      <div className="absolute top-0 left-0 w-[3px] h-full rounded-r" style={{ background: color, opacity: 0.6 }} />
      <div className="flex items-start gap-2 pl-1">
        <div className="w-6 h-6 rounded-md grid place-items-center shrink-0 mt-0.5" style={{ background: `color-mix(in oklch, ${color} 15%, transparent)` }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-wider block mb-0.5" style={{ color, opacity: 0.75 }}>{label}</span>
          <span className="text-[11px] text-foreground/65 block">{value}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Heuristic Card ── */
function HeuristicCard({ heuristic }: { heuristic: HeuristicScore }) {
  const color = heuristicColor(heuristic.score);
  return (
    <div className="rounded-lg border p-3" style={{ background: "var(--s1)", borderColor: "var(--border)" }}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="text-[12px] font-semibold leading-snug flex-1">{heuristic.name}</div>
        <span className="text-[12px] font-bold font-mono px-1.5 py-0.5 rounded-[5px] shrink-0" style={{ color, background: heuristicBg(heuristic.score) }}>{heuristic.score}/10</span>
      </div>
      <div className="h-[3px] rounded-full overflow-hidden mb-1.5" style={{ background: "var(--s3)" }}>
        <div className="h-full rounded-full animate-bar-width" style={{ background: color, width: `${heuristic.score * 10}%`, "--bar-width": `${heuristic.score * 10}%` } as React.CSSProperties} />
      </div>
      {heuristic.issues.length > 0 && (
        <div className="flex flex-col gap-1 mb-1">
          {heuristic.issues.slice(0, 2).map((issue, i) => (
            <div key={i} className="flex gap-1.5 text-[12px] leading-relaxed">
              <X className="h-3 w-3 shrink-0 mt-0.5" style={{ color: "var(--score-low)" }} />
              <span className="text-foreground/60 line-clamp-2">{issue}</span>
            </div>
          ))}
        </div>
      )}
      {heuristic.passes.length > 0 && (
        <div className="flex flex-col gap-1">
          {heuristic.passes.slice(0, 1).map((pass, i) => (
            <div key={i} className="flex gap-1.5 text-[12px] leading-relaxed">
              <Check className="h-3 w-3 shrink-0 mt-0.5" style={{ color: "var(--score-high)" }} />
              <span className="text-foreground/60 line-clamp-2">{pass}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Finding Card ── */
function FindingCard({ finding }: { finding: Finding }) {
  const styles = {
    issue: { bg: "oklch(0.55 0.17 20 / 5%)", border: "oklch(0.55 0.17 20 / 10%)", titleColor: "var(--score-low)", icon: <X className="h-3 w-3" /> },
    warning: { bg: "oklch(0.58 0.16 75 / 5%)", border: "oklch(0.58 0.16 75 / 10%)", titleColor: "var(--score-mid)", icon: <AlertTriangle className="h-3 w-3" /> },
    positive: { bg: "oklch(0.52 0.14 155 / 5%)", border: "oklch(0.52 0.14 155 / 10%)", titleColor: "var(--score-high)", icon: <Check className="h-3 w-3" /> },
  };
  const s = styles[finding.type];
  return (
    <div className="flex gap-3 p-3 rounded-lg text-[12px] leading-relaxed" style={{ background: s.bg }}>
      <span className="shrink-0 mt-0.5" style={{ color: s.titleColor }}>{s.icon}</span>
      <div className="flex-1">
        <div className="font-medium mb-0.5" style={{ color: s.titleColor }}>
          {finding.title}
          {finding.severity && <span className="text-[10px] px-[5px] py-[1px] rounded ml-1.5 uppercase tracking-wider" style={SEVERITY_STYLES[finding.severity] || {}}>{finding.severity}</span>}
          {finding.category && <span className="text-[10px] px-1.5 py-[1px] rounded ml-1.5 text-foreground/50" style={{ background: "var(--s2)" }}>{finding.category}</span>}
        </div>
        <div className="text-foreground/65">{finding.desc}</div>
        {/* Revenue impact */}
        {(finding.impactHeadline || finding.estimatedConversionLift || finding.estimatedEffort) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-2 p-2 rounded-md" style={{ background: finding.type === "positive" ? "oklch(0.52 0.14 155 / 5%)" : "oklch(0.55 0.17 20 / 5%)" }}>
            {finding.impactHeadline && (
              <span className="text-[11px] font-semibold" style={{ color: finding.type === "positive" ? "var(--score-high)" : "var(--score-low)" }}>
                {finding.impactHeadline}
              </span>
            )}
            {finding.estimatedConversionLift && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: "oklch(0.52 0.14 155 / 10%)", color: "var(--score-high)" }}>
                ↑ {finding.estimatedConversionLift}
              </span>
            )}
            {finding.estimatedEffort && finding.estimatedEffort !== "—" && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full text-foreground/50" style={{ background: "var(--s2)" }}>
                ⏱ {finding.estimatedEffort}
              </span>
            )}
          </div>
        )}
        {/* Behavioral badges */}
        {(finding.journeyStage || finding.behavioralMechanism) && (
          <div className="flex flex-wrap items-center gap-1 mt-1.5">
            {finding.journeyStage && JOURNEY_STAGE_COLORS[finding.journeyStage] && (
              <span className="text-[10px] px-1.5 py-[2px] rounded-full font-medium" style={{ background: JOURNEY_STAGE_COLORS[finding.journeyStage].bg, color: JOURNEY_STAGE_COLORS[finding.journeyStage].color }}>
                {JOURNEY_STAGE_COLORS[finding.journeyStage].label}
              </span>
            )}
            {finding.behavioralMechanism && (
              <span className="text-[10px] px-1.5 py-[2px] rounded-full text-foreground/55" style={{ background: "var(--s2)" }}>
                {finding.behavioralMechanism}
              </span>
            )}
          </div>
        )}
        {finding.userExperience && (
          <div className="mt-1.5 p-2 rounded-md text-[12px] border-l-2" style={{ background: "oklch(0.62 0.18 275 / 4%)", borderColor: "oklch(0.62 0.18 275 / 30%)" }}>
            <span className="text-foreground/55">{finding.userExperience}</span>
          </div>
        )}
        {finding.whyItMatters && (
          <div className="mt-1.5 p-2 rounded-md text-[12px]" style={{ background: "oklch(0.58 0.16 75 / 4%)" }}>
            <span className="font-semibold" style={{ color: "var(--score-mid)" }}>Why it matters: </span>
            <span className="text-foreground/55">{finding.whyItMatters}</span>
          </div>
        )}
        {finding.recommendedFix && (
          <div className="mt-1.5 p-2 rounded-md text-[12px]" style={{ background: "oklch(0.52 0.14 155 / 4%)" }}>
            <span className="font-semibold" style={{ color: "var(--score-high)" }}>Fix: </span>
            <span className="text-foreground/55">{finding.recommendedFix}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Hero Rewrite ── */
function HeroRewrite({ rewrite, locked }: { rewrite: UXAuditResult["rewrite"]; locked: boolean }) {
  return (
    <div className="rounded-xl border overflow-hidden mb-4" style={{ background: "var(--s1)" }}>
      <div className="flex items-center gap-2.5 px-4 py-3" style={{ background: "var(--s2)" }}>
        <span className="font-semibold text-[14px]">Hero Rewrite</span>
        <span className="text-[12px] px-2 py-0.5 rounded tracking-wide" style={{ color: "var(--brand)", background: "var(--brand-dim)" }}>AI OPTIMIZED</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2">
        <div className="p-4">
          <p className="text-[12px] uppercase tracking-[1.5px] text-foreground/50 mb-2.5">Before</p>
          <p className="text-[16px] leading-tight mb-2 text-foreground/50 line-through">{rewrite.beforeHeadline || "\u2014"}</p>
          <p className="text-[12px] text-foreground/65 leading-relaxed mb-2.5">{rewrite.beforeSubheadline || "\u2014"}</p>
          <span className="inline-block px-4 py-2 rounded-md text-[12px] font-semibold text-foreground/50 line-through" style={{ background: "var(--s2)" }}>{rewrite.beforeCTA || "\u2014"}</span>
        </div>
        <div className="p-4 relative">
          <p className="text-[12px] uppercase tracking-[1.5px] text-foreground/50 mb-2.5">After</p>
          {locked ? (
            <LockedOverlay message="AI-optimized copy is available on paid plans" />
          ) : (
            <>
              <p className="text-[16px] leading-tight mb-2 text-foreground">{rewrite.afterHeadline || "\u2014"}</p>
              <p className="text-[12px] text-foreground/70 leading-relaxed mb-2.5">{rewrite.afterSubheadline || "\u2014"}</p>
              <span className="inline-block px-4 py-2 rounded-md text-[12px] font-bold" style={{ background: "var(--brand)", color: "var(--brand-fg)" }}>{rewrite.afterCTA || "\u2014"}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Section Rewrite Block ── */
function SectionRewriteBlock({ rewrite }: { rewrite: SectionRewrite }) {
  if (rewrite.type === "text") {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[12px] uppercase tracking-[2px] text-foreground/50">AI Rewrite</span>
          <span className="text-[12px] px-1.5 py-0.5 rounded tracking-wide" style={{ color: "var(--brand)", background: "var(--brand-dim)" }}>COPY-READY</span>
        </div>
        <div className="flex flex-col gap-3">
          {rewrite.items.map((item, i) => (
            <div key={i} className="rounded-lg border overflow-hidden" style={{ background: "var(--s1)" }}>
              <div className="px-3.5 py-2" style={{ background: "var(--s2)" }}>
                <span className="text-[12px] font-semibold text-foreground/65">{item.label}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2">
                <div className="p-3.5">
                  <p className="text-[10px] uppercase tracking-[1.5px] text-foreground/45 mb-1.5">Before</p>
                  <p className="text-[12px] text-foreground/55 leading-relaxed line-through">{item.before}</p>
                </div>
                <div className="p-3.5">
                  <p className="text-[10px] uppercase tracking-[1.5px] text-foreground/45 mb-1.5">After</p>
                  <p className="text-[12px] text-foreground/70 leading-relaxed">{item.after}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {rewrite.rationale && <p className="text-[12px] text-foreground/50 leading-relaxed mt-3 px-1">{rewrite.rationale}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[12px] uppercase tracking-[2px] text-foreground/50">AI Structure Rewrite</span>
        <span className="text-[12px] px-1.5 py-0.5 rounded tracking-wide" style={{ color: "var(--brand)", background: "var(--brand-dim)" }}>SUGGESTED</span>
      </div>
      {rewrite.suggestedOrder.length > 0 && (
        <div className="mb-3">
          <p className="text-[12px] font-semibold text-foreground/55 mb-2">Suggested order</p>
          <div className="flex flex-col gap-1.5">
            {rewrite.suggestedOrder.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 text-[12px] text-foreground/65 px-3 py-2 rounded-[7px]" style={{ background: "var(--s1)" }}>
                <span className="font-mono text-[12px] font-bold min-w-[18px]" style={{ color: "var(--brand)" }}>{i + 1}</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {rewrite.additions.length > 0 && (
        <div className="mb-3">
          <p className="text-[12px] font-semibold mb-2" style={{ color: "var(--score-high)" }}>Add</p>
          <div className="flex flex-col gap-1.5">
            {rewrite.additions.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 text-[12px] text-foreground/65 px-3 py-2 rounded-[7px] border-l-2" style={{ background: "oklch(0.52 0.14 155 / 5%)", borderColor: "var(--score-high)" }}>
                <span className="text-[12px] shrink-0" style={{ color: "var(--score-high)" }}>+</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {rewrite.removals.length > 0 && (
        <div className="mb-3">
          <p className="text-[12px] font-semibold mb-2" style={{ color: "var(--score-low)" }}>Remove / Reword</p>
          <div className="flex flex-col gap-1.5">
            {rewrite.removals.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 text-[12px] text-foreground/65 px-3 py-2 rounded-[7px] border-l-2" style={{ background: "oklch(0.55 0.17 20 / 5%)", borderColor: "var(--score-low)" }}>
                <span className="text-[12px] shrink-0" style={{ color: "var(--score-low)" }}>-</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {rewrite.rationale && <p className="text-[12px] text-foreground/50 leading-relaxed mt-2 px-1">{rewrite.rationale}</p>}
    </div>
  );
}

/* ── Report Divider ── */
function ReportDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 my-6 text-foreground/35 text-[12px] uppercase tracking-[2px]">
      <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
      {label}
      <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
    </div>
  );
}

/* ── Human Audit CTA ── */
function HumanAuditCTA({ url, onRequested }: { url: string; onRequested: (url: string, email: string) => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Please enter a valid email"); return; }
    setSending(true);
    try {
      await fetch("/api/human-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, email: email.trim() }),
      });
      onRequested(url, email.trim());
    } catch {
      setError("Failed to send request. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-2 mb-6 rounded-xl border p-5" style={{ background: "linear-gradient(to bottom, var(--s1), transparent)" }}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-5">
        <div className="flex-1">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "var(--brand)" }}>
              <User className="h-3.5 w-3.5" style={{ color: "var(--brand-fg)" }} />
            </div>
            <h3 className="text-[14px] font-semibold tracking-tight">Want a deeper review?</h3>
          </div>
          <p className="text-[12px] text-foreground/55 leading-relaxed max-w-xs">Get a detailed report from a senior UX professional, delivered within 2-3 business days.</p>
          <p className="mt-2 text-[20px] font-bold tracking-tight">$300 <span className="text-[12px] font-normal text-foreground/50">one-time</span></p>
        </div>
        <form onSubmit={handleSubmit} className="w-full sm:w-64 shrink-0 space-y-2.5">
          <div className="focus-glow rounded-lg border transition-all duration-200" style={{ borderColor: "var(--border2)", background: "var(--background)" }}>
            <input type="email" placeholder="you@example.com" value={email} onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }} className="h-10 w-full rounded-lg bg-transparent px-4 text-[14px] text-foreground placeholder:text-foreground/50 focus:outline-none" />
          </div>
          {error && <p className="text-[12px] text-destructive animate-fade-in pl-1">{error}</p>}
          <button type="submit" disabled={!email.trim() || sending} className="inline-flex w-full h-10 items-center justify-center gap-2 rounded-lg px-5 text-[14px] font-bold transition-all duration-150 hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none" style={{ background: "var(--brand)", color: "var(--brand-fg)" }}>
            {sending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending...</> : <>Request Human Audit <ArrowRight className="h-3.5 w-3.5" /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
