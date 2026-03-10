"use client";

import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { ResultsReport } from "@/components/results-report";
import { PLAN_FEATURES } from "@/lib/types";
import type { UXAuditResult, PlanTier, HeatmapZone, CompetitorAnalysis, VisualAnalysis } from "@/lib/types";

interface AuditViewClientProps {
  audit: {
    id: string;
    url: string;
    result: UXAuditResult;
    screenshotPath: string | null;
    heatmapZones: unknown[] | null;
    pageHeight: number | null;
    visualAnalysis?: VisualAnalysis;
    competitorAnalysis?: CompetitorAnalysis;
    createdAt: string;
  };
  plan: PlanTier;
}

export function AuditViewClient({ audit, plan }: AuditViewClientProps) {
  const router = useRouter();

  function handleReset() {
    router.push("/dashboard");
  }

  function handleHumanAuditRequested() {
    // Not applicable for saved audits
  }

  const hasHeatmapZones = Array.isArray(audit.heatmapZones) && audit.heatmapZones.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-[960px]">
        <ResultsReport
          data={audit.result}
          url={audit.url}
          onReset={handleReset}
          onHumanAuditRequested={handleHumanAuditRequested}
          plan={plan}
          auditId={audit.id}
          screenshotUrl={audit.screenshotPath || undefined}
          screenshotStatus={audit.screenshotPath ? "done" : undefined}
          heatmapZones={(audit.heatmapZones as HeatmapZone[]) || undefined}
          heatmapStatus={hasHeatmapZones ? "done" : undefined}
          pageHeight={audit.pageHeight || 3000}
          viewportWidth={1280}
          visualAnalysis={audit.visualAnalysis}
          visualAnalysisStatus={audit.visualAnalysis ? "done" : undefined}
          competitorAnalysis={audit.competitorAnalysis}
          competitorStatus={
            audit.competitorAnalysis ? "done" :
            PLAN_FEATURES[plan].competitorAnalysis ? undefined :
            "locked"
          }
        />
      </main>
    </div>
  );
}
