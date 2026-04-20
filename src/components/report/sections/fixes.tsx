"use client";

import { memo } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { Zap, Target, Check, Lock, ArrowRight, Sparkles } from "lucide-react";
import { getActionText, getActionDetail, deriveScope } from "../utils";
import type { UXAuditResult, PlanTier } from "@/lib/types";
import { PLAN_FEATURES } from "@/lib/types";

const ENTER = (i: number, base = 0) => ({
  initial: { opacity: 0, y: 8 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { delay: base + i * 0.04, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const },
});

interface FixesProps {
  data: UXAuditResult;
  plan: PlanTier;
}

/* ── Section header — sits on page bg, no outer card ── */
function SectionHeader({
  icon, iconColor, title, count,
}: {
  icon: React.ReactNode; iconColor: string; title: string; count?: number;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span
        className="w-7 h-7 rounded-lg grid place-items-center shrink-0"
        style={{ background: "var(--s2)", color: iconColor }}
      >
        {icon}
      </span>
      <span className="text-[14px] font-semibold text-foreground/80">{title}</span>
      {count != null && (
        <span className="text-[11px] text-foreground/35 ml-auto tabular-nums font-medium">
          {count}
        </span>
      )}
    </div>
  );
}

export const Fixes = memo(function Fixes({ data, plan }: FixesProps) {
  const features = PLAN_FEATURES[plan];

  return (
    <div className="flex flex-col gap-10">
      {/* ─── Quick Wins ─── */}
      <section>
        <SectionHeader
          icon={<Zap className="h-3.5 w-3.5" />}
          iconColor="var(--score-high)"
          title="Quick Wins"
          count={data.quickWins.length}
        />
        <div className="flex flex-col gap-1.5">
          {data.quickWins.map((item, i) => {
            const text = getActionText(item);
            const detail = getActionDetail(item);
            return (
              <motion.div
                key={i}
                className="flex items-start gap-3 py-3.5 px-4 rounded-xl cursor-default"
                style={{ background: "var(--s2)" }}
                {...ENTER(i)}
                whileHover={{ y: -2, transition: { type: "spring", stiffness: 400, damping: 28 } }}
              >
                <span className="text-[10px] font-bold tabular-nums mt-1 shrink-0 w-4" style={{ color: "var(--score-high)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-foreground/75 leading-[1.6]" style={{ textWrap: "pretty" }}>{text}</p>
                  {detail?.expectedImpact && (
                    <p className="text-[11px] mt-1.5 font-semibold tabular-nums" style={{ color: "var(--score-high)" }}>
                      {detail.expectedImpact}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ─── Strategic Fixes ─── */}
      {features.improvements ? (
        <section>
          <SectionHeader
            icon={<Target className="h-3.5 w-3.5" />}
            iconColor="var(--accent-purple)"
            title="Strategic Fixes"
            count={data.strategicFixes.length}
          />
          <div className="flex flex-col gap-1.5">
            {data.strategicFixes.map((item, i) => {
              const text = getActionText(item);
              const detail = getActionDetail(item);
              const scope = deriveScope(text);
              return (
                <motion.div
                  key={i}
                  className="flex items-start gap-3 py-3.5 px-4 rounded-xl cursor-default"
                  style={{ background: "var(--s2)" }}
                  {...ENTER(i, 0.05)}
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                >
                  <span className="text-[10px] font-bold tabular-nums mt-1 shrink-0 w-4" style={{ color: "var(--accent-purple)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-foreground/75 leading-[1.6]" style={{ textWrap: "pretty" }}>{text}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-foreground/45">
                        {scope}
                      </span>
                      {detail?.expectedImpact && (
                        <>
                          <span className="w-[3px] h-[3px] rounded-full bg-foreground/15" />
                          <span className="text-[11px] font-semibold tabular-nums" style={{ color: "var(--score-high)" }}>
                            {detail.expectedImpact}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      ) : (
        <UpgradeCard />
      )}

      {/* ─── Hero Rewrite ─── */}
      {features.improvements && data.rewrite && (
        <section>
          <SectionHeader
            icon={<Sparkles className="h-3.5 w-3.5" />}
            iconColor="var(--brand)"
            title="Hero Copy Rewrite"
          />
          <RewriteComparison rewrite={data.rewrite} />
        </section>
      )}

      {/* ─── Strengths ─── */}
      {data.uxStrengths && data.uxStrengths.length > 0 && (
        <section>
          <SectionHeader
            icon={<Check className="h-3.5 w-3.5" />}
            iconColor="var(--score-high)"
            title="Strengths"
            count={data.uxStrengths.length}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {data.uxStrengths.map((s, i) => (
              <motion.div
                key={i}
                className="flex items-start gap-2.5 py-3 px-3.5 rounded-xl"
                style={{ background: "var(--s2)" }}
                {...ENTER(i, 0.05)}
                whileHover={{ y: -2, transition: { type: "spring", stiffness: 400, damping: 28 } }}
              >
                <Check className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "var(--score-high)" }} />
                <span className="text-[12.5px] text-foreground/70 leading-[1.55]" style={{ textWrap: "pretty" }}>{s}</span>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
});

/* ── Rewrite Comparison — flat cells, single surface ── */
function RewriteComparison({ rewrite }: { rewrite: NonNullable<UXAuditResult["rewrite"]> }) {
  const pairs = [
    { label: "Headline", before: rewrite.beforeHeadline, after: rewrite.afterHeadline },
    { label: "Subheadline", before: rewrite.beforeSubheadline, after: rewrite.afterSubheadline },
    { label: "CTA", before: rewrite.beforeCTA, after: rewrite.afterCTA },
  ];
  return (
    <div className="flex flex-col gap-1.5">
      {pairs.map((p, i) => (
        <motion.div
          key={p.label}
          className="grid grid-cols-1 md:grid-cols-2 gap-1.5"
          {...ENTER(i, 0.05)}
        >
          <motion.div
            className="rounded-xl p-4"
            style={{ background: "var(--s2)" }}
            whileHover={{ y: -2, transition: { type: "spring", stiffness: 400, damping: 28 } }}
          >
            <p className="text-[9.5px] font-semibold text-foreground/40 uppercase tracking-[0.16em] mb-2">
              Before · {p.label}
            </p>
            <p className="text-[13px] text-foreground/50 leading-[1.6]" style={{ textWrap: "pretty" }}>
              {p.before || "\u2014"}
            </p>
          </motion.div>
          <motion.div
            className="rounded-xl p-4"
            style={{ background: "var(--s2)" }}
            whileHover={{ y: -2, transition: { type: "spring", stiffness: 400, damping: 28 } }}
          >
            <p
              className="text-[9.5px] font-semibold uppercase tracking-[0.16em] mb-2"
              style={{ color: "var(--score-high)" }}
            >
              After · {p.label}
            </p>
            <p className="text-[13px] text-foreground/85 leading-[1.6] font-medium" style={{ textWrap: "pretty" }}>
              {p.after || "\u2014"}
            </p>
          </motion.div>
        </motion.div>
      ))}
      {rewrite.rewriteRationale && (
        <p className="text-[11.5px] text-foreground/40 leading-[1.6] mt-2 px-1" style={{ textWrap: "pretty" }}>
          {rewrite.rewriteRationale}
        </p>
      )}
    </div>
  );
}

/* ── Upgrade Card ── */
function UpgradeCard() {
  return (
    <div
      className="rounded-2xl p-10 text-center"
      style={{ background: "var(--s2)" }}
    >
      <div
        className="w-10 h-10 rounded-2xl grid place-items-center mx-auto mb-4"
        style={{ background: "var(--s3)" }}
      >
        <Lock className="h-4 w-4 text-foreground/40" />
      </div>
      <h3 className="text-[14px] font-semibold text-foreground/80 mb-2" style={{ textWrap: "balance" }}>
        Unlock strategic fixes & optimized copy
      </h3>
      <p className="text-[12px] text-foreground/45 leading-relaxed max-w-xs mx-auto mb-5" style={{ textWrap: "pretty" }}>
        Upgrade for strategic improvements, AI-optimized hero copy, and PDF export.
      </p>
      <Link
        href="/pricing"
        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12.5px] font-semibold transition-opacity hover:opacity-90"
        style={{ background: "var(--brand)", color: "white" }}
      >
        View Plans <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
