"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown, Swords, Trophy, TrendingUp, TrendingDown,
  Minus, Lock, ArrowRight, ArrowUpRight, Target, ExternalLink,
  Plus, Link2, Loader2,
} from "lucide-react";
import type { CompetitorAnalysis, CompetitorProfile, CategoryComparison } from "@/lib/types";

/* ── Helpers ── */

function scoreColor(s: number) {
  if (s >= 75) return "var(--score-high)";
  if (s >= 50) return "var(--score-mid)";
  return "var(--score-low)";
}

function gapIndicator(gap: number) {
  if (gap > 0) return { icon: <TrendingUp className="h-3.5 w-3.5" />, label: `+${gap} ahead`, color: "var(--score-high)" };
  if (gap < 0) return { icon: <TrendingDown className="h-3.5 w-3.5" />, label: `${gap} behind`, color: "var(--score-low)" };
  return { icon: <Minus className="h-3.5 w-3.5" />, label: "Even", color: "var(--score-mid)" };
}

const CATEGORY_LABELS: Record<string, string> = {
  "Message Clarity": "Message Clarity",
  "Cognitive Load": "Cognitive Load",
  "Conversion Arch.": "Conversion Arch.",
  "Conversion Architecture": "Conversion Arch.",
  "Trust Signals": "Trust Signals",
  "Contradictions": "Contradictions",
  "First Screen": "First Screen",
  "First-Screen": "First Screen",
};

function normalizeCategory(cat: string): string {
  return CATEGORY_LABELS[cat] || cat;
}

/* ── Score Bar ── */

function ScoreBar({ label, score, maxWidth = "100%" }: { label: string; score: number; maxWidth?: string }) {
  return (
    <div className="flex items-center gap-3" style={{ maxWidth }}>
      <span className="text-[12px] text-foreground/40 w-28 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--s3)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, background: scoreColor(score) }}
        />
      </div>
      <span className="text-[12px] font-bold tabular-nums w-8 text-right" style={{ color: scoreColor(score) }}>
        {score}
      </span>
    </div>
  );
}

/* ── Competitor Profile Card ── */

function CompetitorCard({ profile, index }: { profile: CompetitorProfile; index: number }) {
  const [open, setOpen] = useState(false);
  let domain = profile.url;
  try { domain = new URL(profile.url).hostname.replace("www.", ""); } catch {}

  return (
    <div className="rounded-[11px] border overflow-hidden" style={{ background: "var(--s1)", borderColor: "var(--border)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-[18px] py-4 select-none transition-colors gap-3 cursor-pointer hover:bg-foreground/[0.015]"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[7px] grid place-items-center shrink-0" style={{ background: "var(--s2)" }}>
            <Target className="h-4 w-4 text-foreground/40" />
          </div>
          <div className="text-left">
            <div className="text-[12px] font-semibold flex items-center gap-2">
              {profile.name}
              <span className="text-[10px] font-mono text-foreground/50">Competitor {index + 1}</span>
            </div>
            <div className="text-[12px] text-foreground/50 mt-0.5 flex items-center gap-1">
              {domain}
              <ExternalLink className="h-2.5 w-2.5" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-[16px] font-bold tabular-nums" style={{ color: scoreColor(profile.estimatedScore) }}>
            {profile.estimatedScore}
          </span>
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded"
            style={{ background: `${scoreColor(profile.estimatedScore)}15`, color: scoreColor(profile.estimatedScore) }}
          >
            {profile.estimatedGrade}
          </span>
          <ChevronDown className={`h-3.5 w-3.5 text-foreground/50 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="border-t px-5 py-5 space-y-5" style={{ borderColor: "var(--border)" }}>
          {/* Category scores */}
          <div className="space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-[1.5px] text-foreground/45 mb-3">Category Scores</p>
            <ScoreBar label="Message Clarity" score={profile.categories.messageClarity.score} />
            <ScoreBar label="Cognitive Load" score={profile.categories.cognitiveLoad.score} />
            <ScoreBar label="Conversion Arch." score={profile.categories.conversionArch.score} />
            <ScoreBar label="Trust Signals" score={profile.categories.trustSignals.score} />
            <ScoreBar label="Contradictions" score={profile.categories.contradictions.score} />
            <ScoreBar label="First Screen" score={profile.categories.firstScreen.score} />
          </div>

          {/* Strengths & weaknesses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[1.5px] text-foreground/45 mb-2.5">Their Strengths</p>
              <ul className="space-y-2">
                {profile.strengths.map((s, i) => (
                  <li key={i} className="text-[12px] text-foreground/60 leading-relaxed flex items-start gap-2">
                    <TrendingUp className="h-3 w-3 mt-0.5 shrink-0" style={{ color: "var(--score-low)" }} />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[1.5px] text-foreground/45 mb-2.5">Your Advantages</p>
              <ul className="space-y-2">
                {profile.weaknesses.map((w, i) => (
                  <li key={i} className="text-[12px] text-foreground/60 leading-relaxed flex items-start gap-2">
                    <Trophy className="h-3 w-3 mt-0.5 shrink-0" style={{ color: "var(--score-high)" }} />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Category Comparison Row ── */

function ComparisonRow({ comp, comp1Name, comp2Name }: { comp: CategoryComparison; comp1Name: string; comp2Name: string }) {
  const winner =
    comp.winner === "user" ? "You" :
    comp.winner === "competitor1" ? comp1Name :
    comp2Name;

  return (
    <div className="py-3 border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-medium text-foreground">{normalizeCategory(comp.category)}</span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{
          background: comp.winner === "user" ? "oklch(0.52 0.14 155 / 8%)" : "oklch(0.55 0.17 20 / 8%)",
          color: comp.winner === "user" ? "var(--score-high)" : "var(--score-low)",
        }}>
          {winner} wins
        </span>
      </div>
      <div className="space-y-1.5 mb-1.5">
        <ScoreBar label="You" score={comp.userScore} />
        <ScoreBar label={comp1Name} score={comp.competitor1Score} />
        <ScoreBar label={comp2Name} score={comp.competitor2Score} />
      </div>
      <p className="text-[12px] text-foreground/55 leading-relaxed">{comp.insight}</p>
    </div>
  );
}

/* ── Loading Skeleton ── */

function CompetitorSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="rounded-xl border p-5" style={{ borderColor: "var(--border)", background: "var(--s1)" }}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-lg" style={{ background: "var(--s3)" }} />
          <div className="flex-1">
            <div className="h-3.5 w-48 rounded" style={{ background: "var(--s3)" }} />
            <div className="h-2.5 w-32 rounded mt-2" style={{ background: "var(--s3)" }} />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-2 w-24 rounded" style={{ background: "var(--s3)" }} />
              <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--s3)" }} />
              <div className="h-3 w-8 rounded" style={{ background: "var(--s3)" }} />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border p-5" style={{ borderColor: "var(--border)", background: "var(--s1)" }}>
        <div className="h-3 w-36 rounded mb-3" style={{ background: "var(--s3)" }} />
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 rounded-lg" style={{ background: "var(--s3)" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Locked Preview ── */

export function CompetitorLockedPreview() {
  return (
    <div className="rounded-xl border p-6 text-center" style={{ background: "linear-gradient(135deg, var(--brand-dim), var(--s1))", borderColor: "var(--brand-glow)" }}>
      <div className="w-10 h-10 rounded-lg grid place-items-center mx-auto mb-3" style={{ background: "var(--brand-dim)" }}>
        <Swords className="h-5 w-5" style={{ color: "var(--brand)" }} />
      </div>
      <h3 className="text-[14px] font-semibold tracking-tight mb-1">Competitor Benchmarking</h3>
      <p className="text-[12px] text-foreground/40 leading-relaxed max-w-md mx-auto mb-4">
        See how your page stacks up against the 2 biggest competitors in your market. Get category-by-category scoring, competitive advantages, and actionable recommendations.
      </p>
      <Link
        href="/pricing"
        className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[14px] font-bold transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
        style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
      >
        <Lock className="h-3.5 w-3.5" />
        Upgrade to Pro
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

/* ── Manual Competitor URL Input ── */

function ManualCompetitorInput({
  onSubmit,
  isLoading,
}: {
  onSubmit: (urls: string[]) => void;
  isLoading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [urls, setUrls] = useState<string[]>([""]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const valid = urls.map(u => u.trim()).filter(Boolean);
    if (valid.length > 0) onSubmit(valid);
  }

  function addField() {
    if (urls.length < 3) setUrls([...urls, ""]);
  }

  function removeField(index: number) {
    setUrls(urls.filter((_, i) => i !== index));
  }

  function updateField(index: number, value: string) {
    setUrls(urls.map((u, i) => (i === index ? value : u)));
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-[12px] font-bold transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
        style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
      >
        <Plus className="h-3.5 w-3.5" />
        Compare with specific competitors
      </button>
    );
  }

  const hasAnyUrl = urls.some(u => u.trim());

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border p-4 space-y-3 mt-1"
      style={{ borderColor: "var(--brand-glow)", background: "var(--s2)" }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Link2 className="h-3.5 w-3.5" style={{ color: "var(--brand)" }} />
        <span className="text-[12px] font-semibold">Compare with your competitors</span>
      </div>
      <div className="space-y-2">
        {urls.map((url, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => updateField(i, e.target.value)}
              placeholder={`https://competitor${i + 1}.com`}
              className="flex-1 rounded-lg border px-3 py-2 text-[12px] outline-none transition-colors focus:border-foreground/20"
              style={{ borderColor: "var(--border)", background: "var(--s2)", color: "var(--foreground)" }}
              disabled={isLoading}
            />
            {urls.length > 1 && !isLoading && (
              <button
                type="button"
                onClick={() => removeField(i)}
                className="text-foreground/45 hover:text-foreground/50 transition-colors p-1 shrink-0"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
        {urls.length < 3 && !isLoading && (
          <button
            type="button"
            onClick={addField}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium transition-colors hover:text-foreground/50 px-1 py-1"
            style={{ color: "var(--brand)" }}
          >
            <Plus className="h-3 w-3" /> Add competitor
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={isLoading || !hasAnyUrl}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-bold transition-all duration-150 hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
          style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              <Swords className="h-3.5 w-3.5" />
              Run Comparison
            </>
          )}
        </button>
        {!isLoading && (
          <button
            type="button"
            onClick={() => { setOpen(false); setUrls([""]); }}
            className="text-[12px] text-foreground/50 hover:text-foreground/50 transition-colors px-2 py-2"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

/* ── Main Component ── */

export function CompetitorSection({
  data,
  status,
  onManualCompetitors,
}: {
  data?: CompetitorAnalysis;
  status: "loading" | "done" | "failed" | "locked";
  onManualCompetitors?: (urls: string[]) => void;
}) {
  if (status === "locked") return <CompetitorLockedPreview />;
  if (status === "loading") return <CompetitorSkeleton />;
  if (status === "failed" || !data) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border p-5 text-center" style={{ borderColor: "var(--border)", background: "var(--s1)" }}>
          <Swords className="h-5 w-5 mx-auto mb-2 text-foreground/40" />
          <p className="text-[12px] text-foreground/55">
            Competitor analysis couldn&apos;t be completed for this page.
          </p>
        </div>
        {onManualCompetitors && (
          <ManualCompetitorInput onSubmit={onManualCompetitors} isLoading={false} />
        )}
      </div>
    );
  }

  const gap = gapIndicator(data.scoreGap);
  const comp1Name = data.competitors[0]?.name || "Competitor 1";
  const comp2Name = data.competitors[1]?.name || "Competitor 2";

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Competitive Position Summary */}
      <div className="rounded-xl border p-5" style={{ borderColor: "var(--border)", background: "var(--s1)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg grid place-items-center" style={{ background: "var(--brand-dim)" }}>
            <Swords className="h-4 w-4" style={{ color: "var(--brand)" }} />
          </div>
          <div className="flex-1">
            <h3 className="text-[14px] font-semibold">Competitive Position</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span style={{ color: gap.color }}>{gap.icon}</span>
              <span className="text-[12px] font-medium" style={{ color: gap.color }}>{gap.label}</span>
              <span className="text-[12px] text-foreground/45">vs. competitors</span>
            </div>
          </div>
        </div>
        <p className="text-[12px] text-foreground/50 leading-relaxed mb-4">{data.competitivePosition}</p>

        {/* Manual Competitor Input (Pro+ only) */}
        {onManualCompetitors && (
          <ManualCompetitorInput onSubmit={onManualCompetitors} isLoading={false} />
        )}
      </div>

      {/* Score Comparison */}
      <div className="rounded-xl border p-5" style={{ borderColor: "var(--border)", background: "var(--s1)" }}>
        <p className="text-[10px] font-mono uppercase tracking-[1.5px] text-foreground/45 mb-4">Overall Score Comparison</p>
        <div className="space-y-3">
          <ScoreBar label="Your site" score={data.userOverallScore} />
          {data.competitors.map((c, i) => (
            <ScoreBar key={i} label={c.name} score={c.estimatedScore} />
          ))}
        </div>
        <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
          <span className="text-[12px] text-foreground/50">Average competitor score</span>
          <span className="text-[14px] font-bold tabular-nums" style={{ color: scoreColor(data.averageCompetitorScore) }}>
            {data.averageCompetitorScore}
          </span>
        </div>
      </div>

      {/* Category-by-Category Comparison */}
      {data.categoryComparisons.length > 0 && (
        <div className="rounded-[11px] border overflow-hidden" style={{ background: "var(--s1)", borderColor: "var(--border)" }}>
          <ComparisonAccordion
            comparisons={data.categoryComparisons}
            comp1Name={comp1Name}
            comp2Name={comp2Name}
          />
        </div>
      )}

      {/* Competitor Profiles */}
      {data.competitors.map((comp, i) => (
        <CompetitorCard key={i} profile={comp} index={i} />
      ))}

      {/* Competitive Advantages */}
      {data.competitiveAdvantages.length > 0 && (
        <div className="rounded-xl border p-5" style={{ borderColor: "var(--border)", background: "var(--s1)" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg grid place-items-center" style={{ background: "oklch(0.52 0.14 155 / 8%)" }}>
              <ArrowUpRight className="h-4 w-4" style={{ color: "var(--score-high)" }} />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold">Competitive Advantages</h3>
              <p className="text-[12px] text-foreground/50 mt-0.5">Actionable recommendations based on competitor gaps</p>
            </div>
          </div>
          <ol className="space-y-3">
            {data.competitiveAdvantages.map((adv, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="w-5 h-5 rounded-full grid place-items-center shrink-0 text-[10px] font-bold mt-0.5"
                  style={{ background: "var(--brand-dim)", color: "var(--brand)" }}
                >
                  {i + 1}
                </span>
                <p className="text-[12px] text-foreground/60 leading-relaxed">{adv}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

/* ── Category Comparison Accordion ── */

function ComparisonAccordion({
  comparisons,
  comp1Name,
  comp2Name,
}: {
  comparisons: CategoryComparison[];
  comp1Name: string;
  comp2Name: string;
}) {
  const [open, setOpen] = useState(false);

  const userWins = comparisons.filter((c) => c.winner === "user").length;

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-[18px] py-4 select-none transition-colors gap-3 cursor-pointer hover:bg-foreground/[0.015]"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[7px] grid place-items-center shrink-0" style={{ background: "var(--s2)" }}>
            <Trophy className="h-4 w-4 text-foreground/40" />
          </div>
          <div className="text-left">
            <div className="text-[12px] font-semibold">Category-by-Category</div>
            <div className="text-[12px] text-foreground/50 mt-0.5">
              You win {userWins} of {comparisons.length} categories
            </div>
          </div>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-foreground/50 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t px-5 py-3" style={{ borderColor: "var(--border)" }}>
          {comparisons.map((comp, i) => (
            <ComparisonRow key={i} comp={comp} comp1Name={comp1Name} comp2Name={comp2Name} />
          ))}
        </div>
      )}
    </>
  );
}
