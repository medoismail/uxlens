"use client";

import { memo } from "react";
import { motion } from "motion/react";
import { User, TrendingUp, Pen, Layers, Activity, Eye } from "lucide-react";
import { CompetitorSection, CompetitorLockedPreview } from "@/components/competitor-section";
import { PLAN_FEATURES } from "@/lib/types";
import type { UXAuditResult, PlanTier, CompetitorAnalysis, PersonaFeedback } from "@/lib/types";

interface BenchmarksProps {
  data: UXAuditResult;
  plan: PlanTier;
  competitorAnalysis?: CompetitorAnalysis;
  competitorStatus?: "loading" | "done" | "failed" | "locked";
  onManualCompetitors?: (urls: string[]) => void;
  isSharedView?: boolean;
}

function getPersonaIcon(persona: string): React.ReactNode {
  const lower = persona.toLowerCase();
  if (lower.includes("ux") || lower.includes("design")) return <Pen className="h-3.5 w-3.5" />;
  if (lower.includes("market")) return <TrendingUp className="h-3.5 w-3.5" />;
  if (lower.includes("product")) return <Layers className="h-3.5 w-3.5" />;
  if (lower.includes("develop") || lower.includes("engineer")) return <Activity className="h-3.5 w-3.5" />;
  if (lower.includes("visitor") || lower.includes("user") || lower.includes("first")) return <Eye className="h-3.5 w-3.5" />;
  return <User className="h-3.5 w-3.5" />;
}

const PRIORITY_COLOR: Record<string, string> = {
  high: "var(--score-low)",
  medium: "var(--score-mid)",
  low: "var(--score-high)",
};

function SectionHeader({ label, meta }: { label: string; meta?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between mb-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/30">{label}</p>
      {meta}
    </div>
  );
}

export const Context = memo(function Context({ data, plan, competitorAnalysis, competitorStatus, onManualCompetitors, isSharedView }: BenchmarksProps) {
  const features = PLAN_FEATURES[plan];

  return (
    <div className="flex flex-col gap-12">
      {/* Persona Feedback */}
      {data.personaFeedback && data.personaFeedback.length > 0 && (
        <section>
          <SectionHeader
            label="Stakeholder Feedback"
            meta={
              <span className="text-[10px] text-foreground/30 font-medium tabular-nums">
                {data.personaFeedback.length} perspective{data.personaFeedback.length !== 1 ? "s" : ""}
              </span>
            }
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {data.personaFeedback.map((persona, i) => (
              <PersonaCard key={i} persona={persona} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Competitor Analysis */}
      <section>
        <SectionHeader label="Competitive Analysis" />
        {competitorStatus && competitorStatus !== "locked" ? (
          <CompetitorSection
            data={competitorAnalysis}
            status={competitorStatus}
            onManualCompetitors={!isSharedView ? onManualCompetitors : undefined}
          />
        ) : features.competitorAnalysis && onManualCompetitors ? (
          <CompetitorSection
            data={undefined}
            status="done"
            onManualCompetitors={onManualCompetitors}
          />
        ) : (
          <CompetitorLockedPreview />
        )}
      </section>
    </div>
  );
});

function PersonaCard({ persona, index }: { persona: PersonaFeedback; index: number }) {
  const priorityColor = PRIORITY_COLOR[persona.priority] || "var(--score-mid)";
  return (
    <motion.div
      className="rounded-2xl p-5 h-full flex flex-col"
      style={{ background: "var(--s2)" }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -2, transition: { type: "spring", stiffness: 400, damping: 28 } }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <span className="flex items-center text-foreground/60 shrink-0">
          {getPersonaIcon(persona.persona)}
        </span>
        <span className="text-[13.5px] font-semibold text-foreground/80 flex-1 truncate">
          {persona.persona}
        </span>
        <span
          className="inline-flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: priorityColor }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: priorityColor }} />
          {persona.priority}
        </span>
      </div>

      {/* Feedback */}
      <p className="text-[13px] text-foreground/60 leading-[1.6] mb-4 flex-1" style={{ textWrap: "pretty" }}>
        {persona.feedback}
      </p>

      {/* Top concern — inline, no accent stroke */}
      <div>
        <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] mb-1" style={{ color: "var(--score-mid)" }}>Top Concern</p>
        <p className="text-[13px] text-foreground/70 leading-[1.55]" style={{ textWrap: "pretty" }}>
          {persona.topConcern}
        </p>
      </div>
    </motion.div>
  );
}
