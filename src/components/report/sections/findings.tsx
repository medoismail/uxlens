"use client";

import { useState, useMemo, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { FindingCard } from "../cards/finding-card";
import type { UXAuditResult, Finding } from "@/lib/types";

type SeverityFilter = "all" | "critical" | "high" | "medium" | "low";

interface TaggedFinding extends Finding {
  sectionName: string;
}

const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const FILTERS: SeverityFilter[] = ["all", "critical", "high", "medium", "low"];

const SEV_ACCENT: Record<string, string> = {
  critical: "var(--score-low)",
  high: "var(--score-low)",
  medium: "var(--score-mid)",
  low: "var(--score-high)",
};

export const Findings = memo(function Findings({ data }: { data: UXAuditResult }) {
  const [filter, setFilter] = useState<SeverityFilter>("all");
  const [sectionFilter, setSectionFilter] = useState<string | null>(null);

  const allFindings = useMemo<TaggedFinding[]>(() => {
    const items: TaggedFinding[] = [];
    for (const sec of data.sections) {
      for (const f of sec.findings) {
        if (f.type === "issue" || f.type === "warning") {
          items.push({ ...f, sectionName: sec.name });
        }
      }
    }
    items.sort((a, b) => (SEV_ORDER[a.severity || a.impact] ?? 2) - (SEV_ORDER[b.severity || b.impact] ?? 2));
    return items;
  }, [data.sections]);

  const sectionNames = useMemo(() => [...new Set(data.sections.map(s => s.name))], [data.sections]);

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allFindings.length };
    for (const f of allFindings) {
      const sev = f.severity || f.impact;
      counts[sev] = (counts[sev] || 0) + 1;
    }
    return counts;
  }, [allFindings]);

  const filtered = useMemo(() => {
    let items = allFindings;
    if (filter !== "all") items = items.filter(f => (f.severity || f.impact) === filter);
    if (sectionFilter) items = items.filter(f => f.sectionName === sectionFilter);
    return items;
  }, [allFindings, filter, sectionFilter]);

  return (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/25 mb-2">Findings</p>
        <div className="flex items-baseline gap-3 flex-wrap">
          <h2 className="text-[32px] font-bold text-foreground/85 tabular-nums leading-none tracking-tight">
            {allFindings.length}
          </h2>
          <span className="text-[13px] text-foreground/35">
            issue{allFindings.length !== 1 ? "s" : ""} detected
          </span>
        </div>
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          {(["critical", "high", "medium", "low"] as const).map((k) => {
            const count = filterCounts[k] || 0;
            if (count === 0) return null;
            return (
              <span key={k} className="inline-flex items-center gap-1.5 text-[11px] text-foreground/45 tabular-nums">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: SEV_ACCENT[k] }} />
                <span className="font-medium text-foreground/70">{count}</span>
                <span className="capitalize">{k}</span>
              </span>
            );
          })}
        </div>
      </motion.div>

      {/* Filter bar — segmented pills */}
      <motion.div
        className="flex flex-col gap-3"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div
          className="inline-flex items-center gap-0.5 p-1 rounded-xl self-start"
          style={{ background: "var(--s2)" }}
        >
          {FILTERS.map((f) => {
            const count = filterCounts[f] || 0;
            if (f !== "all" && count === 0) return null;
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="relative text-[12px] font-medium px-3 py-1.5 rounded-lg tabular-nums transition-colors duration-150 flex items-center gap-1.5"
                style={{
                  color: "var(--foreground)",
                  opacity: isActive ? 0.9 : 0.4,
                  background: isActive ? "var(--s1)" : "transparent",
                }}
              >
                {f !== "all" && (
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: SEV_ACCENT[f] }} />
                )}
                <span>{f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}</span>
                <span className="opacity-60 text-[11px]">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Section chips */}
        {sectionNames.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {sectionNames.map((name) => {
              const isActive = sectionFilter === name;
              return (
                <button
                  key={name}
                  onClick={() => setSectionFilter(isActive ? null : name)}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors duration-150"
                  style={{
                    background: isActive ? "var(--s2)" : "transparent",
                    color: "var(--foreground)",
                    opacity: isActive ? 0.8 : 0.35,
                  }}
                >
                  {name}
                </button>
              );
            })}
            {sectionFilter && (
              <button
                onClick={() => setSectionFilter(null)}
                className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-1 rounded-lg text-foreground/30 hover:text-foreground/60 transition-colors duration-150"
                aria-label="Clear section filter"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        <AnimatePresence>
          {(filter !== "all" || sectionFilter) && (
            <motion.p
              className="text-[11px] text-foreground/30 tabular-nums"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4, transition: { duration: 0.1 } }}
              transition={{ duration: 0.15 }}
            >
              Showing <span className="text-foreground/55 font-medium">{filtered.length}</span> of {allFindings.length}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Findings list */}
      <div className="flex flex-col gap-2.5">
        {filtered.map((finding, i) => (
          <FindingCard key={`${finding.title}-${i}`} finding={finding} sectionName={finding.sectionName} index={i} />
        ))}
        {filtered.length === 0 && (
          <motion.div
            className="flex flex-col items-center justify-center py-16 rounded-2xl"
            style={{ background: "var(--s2)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-[13px] text-foreground/35">No findings match this filter</p>
            <button
              onClick={() => { setFilter("all"); setSectionFilter(null); }}
              className="text-[12px] font-medium mt-3 px-3 py-1.5 rounded-lg text-foreground/55 hover:text-foreground/80 hover:bg-foreground/[0.04] transition-colors duration-150"
            >
              Clear filters
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
});
