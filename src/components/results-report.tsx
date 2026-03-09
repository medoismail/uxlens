"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Target, Zap, Shield, Eye, Search, Layers, Pen,
  ChevronDown, RotateCcw, ArrowRight, User, Lock,
  Flame, Brain, HelpCircle, Heart, LogOut,
  X, AlertTriangle, Check,
} from "lucide-react";
import { Footer } from "@/components/footer";
import { ScreenshotSection } from "@/components/screenshot-section";
import { PdfExportButton } from "@/components/pdf-export-button";
import { PLAN_FEATURES } from "@/lib/types";
import type { UXAuditResult, AuditSection, Finding, PlanTier, HeatmapZone } from "@/lib/types";

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
}

/* ── Helpers ── */

function scoreColor(s: number) {
  if (s >= 75) return "var(--score-high)";
  if (s >= 50) return "var(--score-mid)";
  return "var(--score-low)";
}

function scoreBadgeStyle(s: number): React.CSSProperties {
  if (s >= 75) return { background: "oklch(0.623 0.178 145 / 8%)", color: "var(--score-high)" };
  if (s >= 50) return { background: "oklch(0.725 0.187 91 / 8%)", color: "var(--score-mid)" };
  return { background: "oklch(0.647 0.176 17 / 8%)", color: "var(--score-low)" };
}

function confusionColor(s: number) {
  const inverted = 100 - s;
  if (inverted >= 70) return "var(--score-high)";
  if (inverted >= 40) return "var(--score-mid)";
  return "var(--score-low)";
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  hero: <Target className="h-4 w-4" />,
  messaging: <Pen className="h-4 w-4" />,
  cta: <Zap className="h-4 w-4" />,
  trust: <Shield className="h-4 w-4" />,
  structure: <Layers className="h-4 w-4" />,
  contradictions: <Search className="h-4 w-4" />,
  firstscreen: <Eye className="h-4 w-4" />,
};

const CATEGORY_DEFS = [
  { key: "messageClarity", label: "Message Clarity", color: "var(--brand)" },
  { key: "cognitiveLoad", label: "Cognitive Load", color: "var(--accent-blue)" },
  { key: "conversionArch", label: "Conversion Arch.", color: "var(--accent-purple)" },
  { key: "trustSignals", label: "Trust Signals", color: "var(--score-high)" },
  { key: "contradictions", label: "Contradictions", color: "var(--score-low)" },
  { key: "firstScreen", label: "First Screen", color: "var(--brand-strong)" },
] as const;

const FLAG_STYLES: React.CSSProperties[] = [
  { color: "var(--score-low)", borderColor: "oklch(0.647 0.176 17 / 20%)", background: "oklch(0.647 0.176 17 / 7%)" },
  { color: "var(--score-mid)", borderColor: "oklch(0.725 0.187 91 / 20%)", background: "oklch(0.725 0.187 91 / 7%)" },
  { color: "var(--score-high)", borderColor: "oklch(0.623 0.178 145 / 20%)", background: "oklch(0.623 0.178 145 / 7%)" },
  { color: "var(--accent-purple)", borderColor: "oklch(0.637 0.185 295 / 20%)", background: "oklch(0.637 0.185 295 / 7%)" },
];

/* ── Lock Components ── */

function LockedHint({ count, label }: { count: number; label: string }) {
  return (
    <Link
      href="/pricing"
      className="flex items-center gap-2 text-[12px] text-foreground/35 py-2.5 px-3.5 rounded-[7px] border border-dashed transition-colors hover:text-foreground/50 hover:border-foreground/20 group"
      style={{ borderColor: "var(--border)" }}
    >
      <Lock className="h-3 w-3 shrink-0 text-foreground/25 group-hover:text-foreground/40 transition-colors" />
      <span>{count} {label} — <span className="font-medium underline underline-offset-2">upgrade to unlock</span></span>
    </Link>
  );
}

function UpgradeCard() {
  return (
    <div className="rounded-xl border p-5 my-6 text-center" style={{ background: "linear-gradient(135deg, var(--brand-dim), var(--s1))", borderColor: "var(--brand-glow)" }}>
      <Lock className="h-5 w-5 mx-auto mb-2" style={{ color: "var(--brand)" }} />
      <h3 className="text-[14px] font-semibold tracking-tight mb-1">Unlock strategic fixes & optimized copy</h3>
      <p className="text-[12px] text-foreground/40 leading-relaxed max-w-sm mx-auto mb-4">
        Upgrade to get strategic fixes, section recommendations, AI-optimized hero copy, and PDF export.
      </p>
      <Link
        href="/pricing"
        className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-bold transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
        style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
      >
        View Plans
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function LockedOverlay({ message }: { message: string }) {
  return (
    <Link
      href="/pricing"
      className="relative flex flex-col items-center justify-center py-8 rounded-lg text-center group cursor-pointer"
      style={{ background: "var(--s2)" }}
    >
      <Lock className="h-5 w-5 mb-2 text-foreground/20 group-hover:text-foreground/35 transition-colors" />
      <p className="text-[12px] text-foreground/30 group-hover:text-foreground/45 transition-colors">{message}</p>
      <span className="mt-2 text-[12px] font-medium underline underline-offset-2 transition-colors" style={{ color: "var(--brand)" }}>
        Upgrade to unlock
      </span>
    </Link>
  );
}

/* ── Main Component ── */

export function ResultsReport({
  data, url, onReset, onHumanAuditRequested, plan,
  screenshotUrl, heatmapZones, pageHeight, viewportWidth,
}: ResultsReportProps) {
  const features = PLAN_FEATURES[plan];
  let domain = url;
  try { domain = new URL(url).hostname.replace("www.", ""); } catch {}

  const circumference = 2 * Math.PI * 44;
  const dashOffset = circumference - (data.overallScore / 100) * circumference;
  const dialColor = scoreColor(data.overallScore);

  return (
    <div className="w-full max-w-[960px] mx-auto py-10 px-7 relative z-[1]">
      {/* Report header */}
      <div className="text-center animate-fade-in mb-6">
        <p className="text-[12px] font-mono uppercase tracking-[2px] text-foreground/30 mb-2">
          9-Layer UX Audit Report
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{domain}</h1>

        {/* PDF Export button — Starter+ only */}
        {features.pdfExport && (
          <div className="mt-3">
            <PdfExportButton data={data} url={url} />
          </div>
        )}
      </div>

      {/* ─── Score Banner ─── */}
      <div className="fu fu-1 relative overflow-hidden rounded-[14px] border p-7 flex flex-col sm:flex-row gap-7 items-center sm:items-center mb-5" style={{ background: "var(--s1)", borderColor: "var(--border2)" }}>
        {/* Glow */}
        <div className="absolute -top-20 -right-20 w-[220px] h-[220px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, var(--brand-glow) 0%, transparent 65%)" }} />

        {/* Score dial */}
        <div className="relative w-24 h-24 shrink-0">
          <svg className="-rotate-90 w-full h-full" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" strokeWidth="7" style={{ stroke: "var(--s3)" }} />
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
            <span className="text-[26px] font-bold tabular-nums leading-none" style={{ color: dialColor }}>{data.overallScore}</span>
            <span className="text-[12px] uppercase tracking-[1px] text-foreground/35 mt-0.5">/ 100</span>
          </div>
        </div>

        {/* Score info */}
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <h2 className="text-2xl font-light tracking-tight mb-1">{data.grade}</h2>
          <p className="text-[12px] text-foreground/50 leading-relaxed mb-3 max-w-[500px]">{data.executiveSummary}</p>
          <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
            {data.flags.map((flag, i) => (
              <span key={i} className="text-[12px] px-2.5 py-0.5 rounded-[5px] border" style={FLAG_STYLES[i % FLAG_STYLES.length]}>
                {flag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Screenshot + Heatmap (all tiers) ─── */}
      {screenshotUrl && heatmapZones && pageHeight && viewportWidth && (
        <ScreenshotSection
          screenshotUrl={screenshotUrl}
          heatmapZones={heatmapZones}
          pageHeight={pageHeight}
          viewportWidth={viewportWidth}
        />
      )}

      {/* ─── Category Grid (all tiers) ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-5 stagger-children">
        {CATEGORY_DEFS.map((cat) => {
          const catData = data.categories[cat.key as keyof typeof data.categories];
          return (
            <div key={cat.key} className="rounded-[10px] border p-4" style={{ background: "var(--s1)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5 text-[12px] text-foreground/40 tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cat.color }} />
                  {cat.label}
                </div>
                <span className="text-[18px] font-bold font-mono" style={{ color: cat.color }}>{catData.score}</span>
              </div>
              <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "var(--s3)" }}>
                <div
                  className="h-full rounded-full animate-bar-width"
                  style={{ background: cat.color, width: `${catData.score}%`, "--bar-width": `${catData.score}%` } as React.CSSProperties}
                />
              </div>
              <p className="text-[12px] text-foreground/30 mt-2 leading-snug line-clamp-2">{catData.note}</p>
            </div>
          );
        })}
      </div>

      {/* ─── Conversion Killers (all tiers see ALL) ─── */}
      <AccordionSection
        icon={<Flame className="h-4 w-4" style={{ color: "var(--score-low)" }} />}
        name="Top Conversion Killers"
        subtitle="Highest-impact issues causing drop-off"
        defaultOpen
        className="fu fu-3"
      >
        <div className="flex flex-col gap-2 mb-4">
          {data.conversionKillers.map((k, i) => (
            <div key={i} className="flex gap-2.5 text-[12px] leading-relaxed text-foreground/50 p-2.5 px-3.5 rounded-[7px] border-l-2" style={{ background: "var(--s2)", borderColor: "var(--score-low)" }}>
              <span className="font-medium shrink-0 min-w-[18px]" style={{ color: "var(--score-low)" }}>{i + 1}.</span>
              <span>{k}</span>
            </div>
          ))}
        </div>

        {data.quickWins.length > 0 && (
          <>
            <p className="text-[12px] uppercase tracking-[2px] mb-2.5" style={{ color: "var(--score-high)" }}>Quick wins (under 1 hour)</p>
            <div className="flex flex-col gap-2 mb-4">
              {data.quickWins.map((w, i) => (
                <div key={i} className="flex gap-2.5 text-[12px] leading-relaxed text-foreground/50 p-2.5 px-3.5 rounded-[7px] border-l-2" style={{ background: "var(--s2)", borderColor: "var(--score-high)" }}>
                  <span className="font-medium shrink-0 min-w-[18px]" style={{ color: "var(--score-high)" }}>{i + 1}.</span>
                  <span>{w}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Strategic fixes — Starter+ only */}
        {features.improvements && data.strategicFixes.length > 0 && (
          <>
            <p className="text-[12px] uppercase tracking-[2px] mb-2.5" style={{ color: "var(--accent-purple)" }}>Strategic fixes</p>
            <div className="flex flex-col gap-2">
              {data.strategicFixes.map((f, i) => (
                <div key={i} className="flex gap-2.5 text-[12px] leading-relaxed text-foreground/50 p-2.5 px-3.5 rounded-[7px] border-l-2" style={{ background: "var(--s2)", borderColor: "var(--accent-purple)" }}>
                  <span className="font-medium shrink-0 min-w-[18px]" style={{ color: "var(--accent-purple)" }}>{i + 1}.</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </>
        )}
        {!features.improvements && data.strategicFixes.length > 0 && (
          <LockedHint count={data.strategicFixes.length} label="strategic fixes" />
        )}
      </AccordionSection>

      {/* ─── Upgrade Card (free users who can't see improvements) ─── */}
      {!features.improvements && <UpgradeCard />}

      {/* ─── Divider ─── */}
      <ReportDivider label="Detailed Audit" />

      {/* ─── Section Accordions (all tiers see findings; recommendations locked for free) ─── */}
      {data.sections.map((sec, idx) => (
        <SectionAccordion key={sec.id} section={sec} delay={idx + 3} showRecommendations={features.improvements} />
      ))}

      {/* ─── Divider ─── */}
      <ReportDivider label="Confusion & Trust Analysis" />

      {/* ─── Confusion Map (all tiers) ─── */}
      <AccordionSection
        icon={<Brain className="h-4 w-4" style={{ color: "var(--brand)" }} />}
        name="Confusion Detection Map"
        subtitle="Cognitive friction breakdown (lower = better)"
        defaultOpen
        className="fu fu-7"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
          {[
            { label: "Jargon", val: data.confusionMap.jargonScore },
            { label: "Density", val: data.confusionMap.densityScore },
            { label: "Friction Words", val: data.confusionMap.frictionWords },
            { label: "Decision Paralysis", val: data.confusionMap.decisionParalysis },
          ].map((c) => (
            <div key={c.label} className="rounded-lg p-3 text-center border" style={{ background: "var(--s2)", borderColor: "var(--border)" }}>
              <div className="text-[20px] font-bold font-mono mb-1" style={{ color: confusionColor(c.val) }}>{c.val}</div>
              <div className="text-[12px] uppercase tracking-[1px] text-foreground/30 leading-snug">{c.label}</div>
            </div>
          ))}
        </div>

        {/* First-screen insights — all tiers */}
        {data.firstScreenAnalysis.immediateUnderstanding && (
          <div className="flex flex-col gap-2.5">
            <InsightCard icon={<Eye className="h-3.5 w-3.5" />} label="First impression" value={data.firstScreenAnalysis.immediateUnderstanding} type="warning" />
            <InsightCard icon={<HelpCircle className="h-3.5 w-3.5" />} label="Unanswered above the fold" value={data.firstScreenAnalysis.unansweredQuestion} type="issue" />
            <InsightCard icon={<Heart className="h-3.5 w-3.5" />} label="Dominant emotion triggered" value={data.firstScreenAnalysis.dominantEmotion} type="warning" />
            <InsightCard icon={<LogOut className="h-3.5 w-3.5" />} label="#1 exit reason" value={data.firstScreenAnalysis.exitReason} type="issue" />
          </div>
        )}
      </AccordionSection>

      {/* ─── Trust Matrix (all tiers) ─── */}
      <AccordionSection
        icon={<Shield className="h-4 w-4" style={{ color: "var(--score-high)" }} />}
        name="Trust Signal Matrix"
        subtitle="Credibility components scored individually"
        defaultOpen
        className="fu fu-8"
      >
        <div className="flex flex-col gap-2">
          {data.trustMatrix.map((t) => (
            <div key={t.label} className="flex items-center gap-3 text-[12px]">
              <span className="w-[160px] text-foreground/40 shrink-0">{t.label}</span>
              <div className="flex-1 h-[5px] rounded-full overflow-hidden" style={{ background: "var(--s3)" }}>
                <div
                  className="h-full rounded-full animate-bar-width"
                  style={{ background: scoreColor(t.score), width: `${t.score}%`, "--bar-width": `${t.score}%` } as React.CSSProperties}
                />
              </div>
              <span className="w-8 text-right text-foreground/50 tabular-nums">{t.score}</span>
            </div>
          ))}
        </div>
      </AccordionSection>

      {/* ─── Divider ─── */}
      <ReportDivider label="Optimized Copy" />

      {/* ─── Before / After Rewrite ─── */}
      <div className="fu fu-9 rounded-xl border overflow-hidden mb-4" style={{ background: "var(--s1)", borderColor: "var(--border2)" }}>
        <div className="flex items-center gap-2.5 px-[18px] py-3.5 border-b" style={{ borderColor: "var(--border)" }}>
          <span className="font-semibold text-[13px]">Hero Rewrite</span>
          <span className="text-[12px] px-2 py-0.5 rounded tracking-wide" style={{ color: "var(--brand)", background: "var(--brand-dim)", border: "1px solid var(--brand-glow)" }}>AI OPTIMIZED</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2">
          {/* Before — always visible */}
          <div className="p-5 sm:border-r" style={{ borderColor: "var(--border)" }}>
            <p className="text-[12px] uppercase tracking-[1.5px] text-foreground/30 mb-3">Before</p>
            <p className="text-[20px] leading-tight mb-2 text-foreground/30 line-through">{data.rewrite.beforeHeadline || "—"}</p>
            <p className="text-[12px] text-foreground/50 leading-relaxed mb-3">{data.rewrite.beforeSubheadline || "—"}</p>
            <span className="inline-block px-4 py-2 rounded-md text-[12px] font-semibold text-foreground/30 border line-through" style={{ background: "var(--s2)", borderColor: "var(--border)" }}>
              {data.rewrite.beforeCTA || "—"}
            </span>
          </div>
          {/* After — Starter+ only */}
          <div className="p-5 relative">
            <p className="text-[12px] uppercase tracking-[1.5px] text-foreground/30 mb-3">After</p>
            {!features.improvements ? (
              <LockedOverlay message="AI-optimized copy is available on paid plans" />
            ) : (
              <>
                <p className="text-[20px] leading-tight mb-2 text-foreground">{data.rewrite.afterHeadline || "—"}</p>
                <p className="text-[12px] text-foreground/50 leading-relaxed mb-3">{data.rewrite.afterSubheadline || "—"}</p>
                <span className="inline-block px-4 py-2 rounded-md text-[12px] font-bold" style={{ background: "var(--brand)", color: "var(--brand-fg)" }}>
                  {data.rewrite.afterCTA || "—"}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {features.improvements && data.rewrite.rewriteRationale && (
        <p className="text-[12px] text-foreground/30 leading-relaxed mb-6 px-1">{data.rewrite.rewriteRationale}</p>
      )}

      {/* ─── Human Audit CTA ─── */}
      <HumanAuditCTA url={url} onRequested={onHumanAuditRequested} />

      {/* ─── Bottom CTA ─── */}
      <div className="flex flex-col items-center pt-6 pb-8 text-center animate-fade-in">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-lg border px-6 py-2.5 text-[13px] font-medium text-foreground transition-all duration-150 hover:border-foreground/20 active:scale-[0.98]"
          style={{ borderColor: "var(--border2)", background: "var(--s1)" }}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Analyze another page
        </button>
      </div>

      <Footer />
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* Accordion Section                                        */
/* ──────────────────────────────────────────────────────── */

function AccordionSection({
  icon,
  name,
  subtitle,
  defaultOpen = false,
  className = "",
  children,
}: {
  icon: React.ReactNode;
  name: string;
  subtitle?: string;
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`rounded-[11px] border overflow-hidden mb-3 ${className}`} style={{ background: "var(--s1)", borderColor: "var(--border)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-[18px] py-4 select-none transition-colors gap-3 cursor-pointer hover:bg-foreground/[0.015]"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[7px] grid place-items-center shrink-0" style={{ background: "var(--s2)" }}>
            {icon}
          </div>
          <div className="text-left">
            <div className="text-[12.5px] font-semibold">{name}</div>
            {subtitle && <div className="text-[12px] text-foreground/35 mt-0.5">{subtitle}</div>}
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <ChevronDown className={`h-3.5 w-3.5 text-foreground/30 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      {open && (
        <div className="border-t px-5 py-5" style={{ borderColor: "var(--border)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* Section Accordion (audit sections with findings)         */
/* ──────────────────────────────────────────────────────── */

function SectionAccordion({ section, delay, showRecommendations = true }: { section: AuditSection; delay: number; showRecommendations?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`rounded-[11px] border overflow-hidden mb-3 fu fu-${Math.min(9, delay)}`} style={{ background: "var(--s1)", borderColor: "var(--border)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-[18px] py-4 select-none transition-colors gap-3 cursor-pointer hover:bg-foreground/[0.015]"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[7px] grid place-items-center shrink-0" style={{ background: "var(--s2)" }}>
            {SECTION_ICONS[section.id] || <Layers className="h-4 w-4" />}
          </div>
          <div className="text-left">
            <div className="text-[12.5px] font-semibold">{section.name}</div>
            {section.subtitle && <div className="text-[12px] text-foreground/35 mt-0.5">{section.subtitle}</div>}
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-[12px] font-bold font-mono px-2.5 py-0.5 rounded-[5px]" style={scoreBadgeStyle(section.score)}>
            {section.score}/100
          </span>
          <ChevronDown className={`h-3.5 w-3.5 text-foreground/30 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      {open && (
        <div className="border-t px-5 py-5" style={{ borderColor: "var(--border)" }}>
          {/* Findings — visible to all tiers */}
          <div className="flex flex-col gap-2.5 mb-5">
            {section.findings.map((f, i) => (
              <FindingCard key={i} finding={f} />
            ))}
          </div>

          {/* Recommendations — Starter+ only */}
          {showRecommendations && section.recommendations.length > 0 && (
            <>
              <p className="text-[12px] uppercase tracking-[2px] text-foreground/30 mb-2.5">Recommendations</p>
              <div className="flex flex-col gap-2">
                {section.recommendations.map((r, i) => (
                  <div key={i} className="flex gap-2.5 text-[12px] leading-relaxed text-foreground/50 p-2.5 px-3.5 rounded-[7px] border-l-2" style={{ background: "var(--s2)", borderColor: "var(--brand)" }}>
                    <span className="font-medium shrink-0 min-w-[18px]" style={{ color: "var(--brand)" }}>{i + 1}.</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {!showRecommendations && section.recommendations.length > 0 && (
            <LockedHint count={section.recommendations.length} label="recommendations" />
          )}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* Finding Card                                             */
/* ──────────────────────────────────────────────────────── */

function FindingCard({ finding }: { finding: Finding }) {
  const styles = {
    issue: { bg: "oklch(0.647 0.176 17 / 5%)", border: "oklch(0.647 0.176 17 / 10%)", titleColor: "var(--score-low)", icon: <X className="h-3 w-3" /> },
    warning: { bg: "oklch(0.725 0.187 91 / 5%)", border: "oklch(0.725 0.187 91 / 10%)", titleColor: "var(--score-mid)", icon: <AlertTriangle className="h-3 w-3" /> },
    positive: { bg: "oklch(0.623 0.178 145 / 5%)", border: "oklch(0.623 0.178 145 / 10%)", titleColor: "var(--score-high)", icon: <Check className="h-3 w-3" /> },
  };

  const impactStyleMap: Record<string, React.CSSProperties> = {
    high: { background: "oklch(0.647 0.176 17 / 15%)", color: "var(--score-low)" },
    medium: { background: "oklch(0.725 0.187 91 / 15%)", color: "var(--score-mid)" },
    low: { background: "oklch(0.623 0.178 145 / 15%)", color: "var(--score-high)" },
  };

  const s = styles[finding.type];

  return (
    <div className="flex gap-3 p-3 px-3.5 rounded-lg text-[12px] leading-relaxed" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
      <span className="shrink-0 mt-0.5" style={{ color: s.titleColor }}>{s.icon}</span>
      <div className="flex-1">
        <div className="font-medium mb-0.5" style={{ color: s.titleColor }}>
          {finding.title}
          {finding.impact && (
            <span className="text-[12px] px-[7px] py-[2px] rounded ml-2 tracking-wide align-middle" style={impactStyleMap[finding.impact]}>
              {finding.impact}
            </span>
          )}
        </div>
        <div className="text-foreground/45">{finding.desc}</div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* Insight Card (for first-screen analysis)                 */
/* ──────────────────────────────────────────────────────── */

function InsightCard({ icon, label, value, type }: { icon: React.ReactNode; label: string; value: string; type: "issue" | "warning" }) {
  const styles = {
    issue: { bg: "oklch(0.647 0.176 17 / 5%)", border: "oklch(0.647 0.176 17 / 10%)", color: "var(--score-low)" },
    warning: { bg: "oklch(0.725 0.187 91 / 5%)", border: "oklch(0.725 0.187 91 / 10%)", color: "var(--score-mid)" },
  };
  const s = styles[type];

  return (
    <div className="flex gap-3 p-3 px-3.5 rounded-lg text-[12px] leading-relaxed" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
      <span className="shrink-0 mt-0.5" style={{ color: s.color }}>{icon}</span>
      <div className="flex-1">
        <div className="font-medium mb-0.5" style={{ color: s.color }}>{label}</div>
        <div className="text-foreground/45">{value}</div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* Divider                                                  */
/* ──────────────────────────────────────────────────────── */

function ReportDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 my-8 text-foreground/15 text-[12px] uppercase tracking-[2px]">
      <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
      {label}
      <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* Human Audit CTA                                          */
/* ──────────────────────────────────────────────────────── */

function HumanAuditCTA({ url, onRequested }: { url: string; onRequested: (url: string, email: string) => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email");
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_LS_CHECKOUT_HUMAN_AUDIT || "#";
    if (baseUrl !== "#") {
      const checkoutUrl = new URL(baseUrl);
      checkoutUrl.searchParams.set("checkout[email]", email);
      checkoutUrl.searchParams.set("checkout[custom][url]", url);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      if (win.LemonSqueezy?.Url?.Open) {
        win.LemonSqueezy.Url.Open(checkoutUrl.toString());
      } else {
        window.open(checkoutUrl.toString(), "_blank");
      }
    }

    onRequested(url, email.trim());
  }

  return (
    <div className="mb-8 rounded-xl border p-6" style={{ background: "linear-gradient(to bottom, var(--s1), transparent)", borderColor: "var(--border2)" }}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-5">
        <div className="flex-1">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "var(--brand)" }}>
              <User className="h-3.5 w-3.5" style={{ color: "var(--brand-fg)" }} />
            </div>
            <h3 className="text-[14px] font-semibold tracking-tight">Want a deeper review?</h3>
          </div>
          <p className="text-[12px] text-foreground/40 leading-relaxed max-w-xs">
            Get a detailed report from a senior UX professional, delivered to your inbox within 2–3 business days.
          </p>
          <p className="mt-2 text-[20px] font-bold tracking-tight">$300 <span className="text-[12px] font-normal text-foreground/30">one-time</span></p>
        </div>

        <form onSubmit={handleSubmit} className="w-full sm:w-64 shrink-0 space-y-2.5">
          <div className="focus-glow rounded-lg border transition-all duration-200" style={{ borderColor: "var(--border2)", background: "white" }}>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
              className="h-10 w-full rounded-lg bg-transparent px-4 text-[13px] text-foreground placeholder:text-foreground/30 focus:outline-none"
            />
          </div>
          {error && <p className="text-[12px] text-destructive animate-fade-in pl-1">{error}</p>}
          <button
            type="submit"
            disabled={!email.trim()}
            className="inline-flex w-full h-10 items-center justify-center gap-2 rounded-lg px-5 text-[13px] font-bold transition-all duration-150 hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
            style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
          >
            Request Human Audit
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
