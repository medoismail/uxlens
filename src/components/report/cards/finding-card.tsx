"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, TrendingUp, Clock, Wrench } from "lucide-react";
import type { Finding } from "@/lib/types";

interface FindingCardProps {
  finding: Finding;
  sectionName?: string;
  index?: number;
}

const SEV_DOT: Record<string, string> = {
  critical: "var(--score-low)",
  high: "var(--score-low)",
  medium: "var(--score-mid)",
  low: "var(--score-high)",
};

export function FindingCard({ finding, sectionName, index = 0 }: FindingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const sev = finding.severity || finding.impact;

  return (
    <motion.div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--s2)",
      }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      layout="position"
      whileHover={{ y: -2 }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-4 p-5 text-left group transition-colors duration-150 hover:bg-foreground/[0.015]"
      >
        {/* Severity dot */}
        <span
          className="w-2 h-2 rounded-full mt-[9px] shrink-0"
          style={{
            background: SEV_DOT[sev] || "var(--score-mid)",
            boxShadow: `0 0 0 3px ${SEV_DOT[sev] || "var(--score-mid)"}14`,
          }}
        />

        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="text-[14px] font-semibold text-foreground/85 leading-snug" style={{ textWrap: "balance" }}>
              {finding.title}
            </span>
            <span
              className="text-[9.5px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded text-foreground/45"
              style={{ background: "var(--s3)" }}
            >
              {sev}
            </span>
            {sectionName && (
              <span className="text-[10px] text-foreground/25">· {sectionName}</span>
            )}
          </div>
          {/* Description */}
          <p className="text-[13px] text-foreground/45 leading-[1.6] line-clamp-2" style={{ textWrap: "pretty" }}>
            {finding.desc}
          </p>
        </div>

        {/* Right: lift + chevron */}
        <div className="flex items-center gap-3 shrink-0 mt-0.5">
          {finding.estimatedConversionLift && (
            <span className="text-[11px] font-semibold tabular-nums" style={{ color: "var(--score-high)" }}>
              +{finding.estimatedConversionLift}
            </span>
          )}
          <motion.span
            className="text-foreground/25 group-hover:text-foreground/55 flex items-center justify-center w-6 h-6 rounded-lg transition-colors duration-150"
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </motion.span>
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0, transition: { opacity: { duration: 0.08 }, height: { duration: 0.15 } } }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1], opacity: { duration: 0.2, delay: 0.05 } }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0">
              <div className="flex flex-col gap-4">
                {finding.whyItMatters && (
                  <div>
                    <p className="text-[10px] font-semibold text-foreground/40 uppercase tracking-[0.14em] mb-1.5">Why it matters</p>
                    <p className="text-[13px] text-foreground/65 leading-[1.6]" style={{ textWrap: "pretty" }}>
                      {finding.whyItMatters}
                    </p>
                  </div>
                )}
                {finding.recommendedFix && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-1.5 flex items-center gap-1.5" style={{ color: "var(--score-high)" }}>
                      <Wrench className="h-3 w-3" /> Recommended fix
                    </p>
                    <p className="text-[13px] text-foreground/70 leading-[1.6]" style={{ textWrap: "pretty" }}>
                      {finding.recommendedFix}
                    </p>
                  </div>
                )}
              </div>

              {(finding.behavioralMechanism || finding.estimatedEffort || finding.frictionCascade) && (
                <div className="flex items-center gap-3 mt-4 flex-wrap">
                  {finding.behavioralMechanism && (
                    <span className="text-[10.5px] font-medium text-foreground/45">
                      {finding.behavioralMechanism}
                    </span>
                  )}
                  {finding.estimatedEffort && (
                    <>
                      <span className="w-[3px] h-[3px] rounded-full bg-foreground/15" />
                      <span className="flex items-center gap-1.5 text-[11px] text-foreground/40 tabular-nums">
                        <Clock className="h-3 w-3" /> {finding.estimatedEffort}
                      </span>
                    </>
                  )}
                  {finding.frictionCascade && (
                    <>
                      <span className="w-[3px] h-[3px] rounded-full bg-foreground/15" />
                      <span className="flex items-center gap-1.5 text-[11px] text-foreground/40">
                        <TrendingUp className="h-3 w-3" /> {finding.frictionCascade}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
