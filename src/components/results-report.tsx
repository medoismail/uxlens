"use client";

import { useState } from "react";
import {
  Eye, Target, Shield, Zap, Brain, MessageSquare,
  AlertTriangle, CheckCircle2, XCircle, Sparkles,
  Lock, RotateCcw, Wand2, ChevronDown, Layers,
} from "lucide-react";
import { ScoreCard } from "@/components/score-card";
import { PaywallOverlay } from "@/components/paywall-overlay";
import type { UXAuditResult, PlanTier } from "@/lib/types";

interface ResultsReportProps {
  data: UXAuditResult;
  url: string;
  onReset: () => void;
  isSubscribed: boolean;
  plan: PlanTier;
  onSubscriptionVerified: (email: string) => void;
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function getRingStroke(score: number) {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
}

function getScoreLabel(score: number) {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Needs work";
  return "Critical";
}

const SCORE_META: Record<string, { label: string; icon: React.ReactNode }> = {
  first_screen_clarity: { label: "First Screen", icon: <Eye className="h-4 w-4" /> },
  cta_strength: { label: "CTA Strength", icon: <Target className="h-4 w-4" /> },
  trust_first_screen: { label: "Trust", icon: <Shield className="h-4 w-4" /> },
  message_clarity_score: { label: "Messaging", icon: <MessageSquare className="h-4 w-4" /> },
  conversion_structure_score: { label: "Conversion", icon: <Zap className="h-4 w-4" /> },
  confusion_score: { label: "Clarity", icon: <Brain className="h-4 w-4" /> },
};

const FREE_ISSUE_LIMIT = 3;

export function ResultsReport({
  data, url, onReset, isSubscribed, plan, onSubscriptionVerified,
}: ResultsReportProps) {
  const [heroExpanded, setHeroExpanded] = useState(true);

  const isPaidUser = isSubscribed && plan !== "free";
  const isProUser = isSubscribed && (plan === "pro" || plan === "agency");

  let domain = url;
  try { domain = new URL(url).hostname.replace("www.", ""); } catch {}

  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (data.scores.ux_score / 100) * circumference;

  const visibleIssues = isPaidUser ? data.major_issues : data.major_issues.slice(0, FREE_ISSUE_LIMIT);
  const hiddenIssueCount = isPaidUser ? 0 : Math.max(0, data.major_issues.length - FREE_ISSUE_LIMIT);

  return (
    <div className="w-full max-w-2xl mx-auto py-10 px-6">
      {/* Report header */}
      <div className="text-center animate-fade-in mb-10">
        <p className="text-[12px] font-medium text-muted-foreground/70 uppercase tracking-widest mb-2">
          UX Audit Report
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{domain}</h1>
      </div>

      {/* ─── Overall Score ─── */}
      <div className="flex flex-col items-center mb-12 animate-scale-in">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
            {/* Track */}
            <circle
              cx="60" cy="60" r="52" fill="none"
              strokeWidth="6"
              className="stroke-foreground/[0.04]"
            />
            {/* Fill */}
            <circle
              cx="60" cy="60" r="52" fill="none"
              strokeWidth="6" strokeLinecap="round"
              stroke={getRingStroke(data.scores.ux_score)}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="animate-ring-fill"
              style={{
                "--ring-circumference": circumference,
                "--ring-offset": offset,
              } as React.CSSProperties}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-[28px] font-bold tabular-nums tracking-tight animate-count-up ${getScoreColor(data.scores.ux_score)}`}>
              {data.scores.ux_score}
            </span>
            <span className="text-[11px] text-muted-foreground/60 font-medium">out of 100</span>
          </div>
        </div>
        <p className={`mt-3 text-[13px] font-medium ${getScoreColor(data.scores.ux_score)}`}>
          {getScoreLabel(data.scores.ux_score)}
        </p>
      </div>

      {/* ─── Score Breakdown ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-10 stagger-children">
        {Object.entries(data.scores).map(([key, value]) => {
          if (key === "ux_score") return null;
          const meta = SCORE_META[key];
          if (!meta) return null;
          return (
            <ScoreCard key={key} label={meta.label} score={value} icon={meta.icon} />
          );
        })}
      </div>

      {/* ─── Offer Detection (Pro+) ─── */}
      {isProUser && data.offer_detection.confidence > 0 && (
        <Section
          icon={<Layers className="h-4 w-4" />}
          title="Offer Detection"
          badge={`${data.offer_detection.confidence}% confidence`}
        >
          <div className="space-y-2.5">
            {[
              { label: "Product", value: data.offer_detection.offer_detected },
              { label: "Target user", value: data.offer_detection.target_user_guess },
              { label: "Promised outcome", value: data.offer_detection.outcome_guess },
            ].map((item) => (
              <div key={item.label} className="flex gap-3 text-[13px]">
                <span className="font-medium text-foreground/70 w-28 shrink-0">{item.label}</span>
                <span className="text-muted-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ─── Major Issues ─── */}
      {data.major_issues.length > 0 && (
        <Section
          icon={<AlertTriangle className="h-4 w-4" />}
          title="Major Issues"
          count={data.major_issues.length}
        >
          <div className="space-y-2">
            {visibleIssues.map((issue, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-border/30 p-3.5 transition-colors hover:border-border/50">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/8">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                </div>
                <p className="text-[13px] leading-relaxed text-muted-foreground">{issue}</p>
              </div>
            ))}
            {hiddenIssueCount > 0 && (
              <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-border/40 p-3.5 text-muted-foreground/60">
                <Lock className="h-3.5 w-3.5" />
                <span className="text-[13px]">+{hiddenIssueCount} more &mdash; upgrade to see all</span>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ─── Hero Rewrite ─── */}
      <Section
        icon={<Wand2 className="h-4 w-4" />}
        title="Suggested Hero Copy"
        collapsible
        expanded={heroExpanded}
        onToggle={() => setHeroExpanded(!heroExpanded)}
      >
        {heroExpanded && (
          <div className="space-y-4 animate-fade-in">
            <CopyBlock label="Headline" value={data.hero_rewrite.headline} bold />
            <CopyBlock label="Subheadline" value={data.hero_rewrite.subheadline} />
            <div>
              <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-2">Call to Action</p>
              <span className="inline-flex items-center rounded-lg bg-foreground px-4 py-2 text-[13px] font-medium text-background">
                {data.hero_rewrite.cta}
              </span>
            </div>
          </div>
        )}
      </Section>

      {/* ─── Paywall ─── */}
      {!isPaidUser && (
        <div className="my-10">
          <PaywallOverlay onSubscriptionVerified={onSubscriptionVerified} />
        </div>
      )}

      {/* ─── Missing Conversion Elements (Starter+) ─── */}
      {isPaidUser && data.missing_conversion_elements.length > 0 && (
        <Section
          icon={<XCircle className="h-4 w-4" />}
          title="Missing Conversion Elements"
        >
          <ul className="space-y-2">
            {data.missing_conversion_elements.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-[13px]">
                <XCircle className="h-3.5 w-3.5 text-red-400/80 mt-0.5 shrink-0" />
                <span className="text-muted-foreground leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ─── Confusing Phrases (Pro+) ─── */}
      {isProUser && data.confusing_phrases.length > 0 && (
        <Section
          icon={<MessageSquare className="h-4 w-4" />}
          title="Confusing Phrases"
        >
          <div className="space-y-2">
            {data.confusing_phrases.map((phrase, i) => (
              <div key={i} className="rounded-lg bg-foreground/[0.02] border border-border/30 px-4 py-3">
                <p className="text-[13px] text-muted-foreground italic leading-relaxed">
                  &ldquo;{phrase}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ─── Quick Fixes (Pro+) ─── */}
      {isProUser && data.quick_fixes.length > 0 && (
        <Section
          icon={<Sparkles className="h-4 w-4" />}
          title="Quick Fixes"
        >
          <ul className="space-y-2">
            {data.quick_fixes.map((fix, i) => (
              <li key={i} className="flex items-start gap-3 text-[13px]">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/80 mt-0.5 shrink-0" />
                <span className="text-muted-foreground leading-relaxed">{fix}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ─── Bottom CTA ─── */}
      <div className="flex flex-col items-center pt-10 pb-8 text-center animate-fade-in">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background px-6 py-2.5 text-[13px] font-medium text-foreground shadow-elevation-1 transition-all duration-150 hover:shadow-elevation-2 hover:border-border active:scale-[0.98]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Analyze another page
        </button>
      </div>

      <footer className="text-center pb-8 text-[11px] text-muted-foreground/50">
        Built with UXLens
      </footer>
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* Section wrapper — consistent spacing and visual rhythm  */
/* ──────────────────────────────────────────────────────── */

function Section({
  icon,
  title,
  badge,
  count,
  collapsible,
  expanded,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  count?: number;
  collapsible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
}) {
  const header = (
    <div className={`flex items-center gap-2.5 mb-4 ${collapsible ? "cursor-pointer select-none" : ""}`} onClick={collapsible ? onToggle : undefined}>
      <span className="text-muted-foreground/50">{icon}</span>
      <h3 className="text-[14px] font-semibold text-foreground tracking-tight">{title}</h3>
      {count !== undefined && (
        <span className="ml-auto text-[11px] font-medium text-muted-foreground/50 tabular-nums">{count}</span>
      )}
      {badge && (
        <span className="ml-auto inline-flex items-center rounded-full bg-foreground/[0.04] px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          {badge}
        </span>
      )}
      {collapsible && (
        <ChevronDown className={`ml-auto h-4 w-4 text-muted-foreground/40 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
      )}
    </div>
  );

  return (
    <div className="mb-8 animate-slide-up">
      {header}
      {children}
    </div>
  );
}

function CopyBlock({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-1.5">{label}</p>
      <p className={`text-[14px] leading-relaxed ${bold ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
        {value}
      </p>
    </div>
  );
}
