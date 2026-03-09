"use client";

import { Header } from "@/components/header";
import { ResultsReport } from "@/components/results-report";
import type { UXAuditResult, PlanTier, HeatmapZone } from "@/lib/types";

interface AuditViewClientProps {
  audit: {
    id: string;
    url: string;
    result: UXAuditResult;
    screenshotPath: string | null;
    heatmapZones: unknown[] | null;
    createdAt: string;
  };
  plan: PlanTier;
}

export function AuditViewClient({ audit, plan }: AuditViewClientProps) {
  function handleReset() {
    window.location.href = "/dashboard";
  }

  function handleHumanAuditRequested() {
    // Not applicable for saved audits
  }

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
          heatmapZones={(audit.heatmapZones as HeatmapZone[]) || undefined}
          pageHeight={3000}
          viewportWidth={1280}
        />
      </main>
    </div>
  );
}
