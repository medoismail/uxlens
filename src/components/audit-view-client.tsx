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
  const isSubscribed = plan !== "free";

  function handleReset() {
    window.location.href = "/dashboard";
  }

  function handleHumanAuditRequested() {
    // Not applicable for saved audits
  }

  function handleSubscriptionVerified() {
    // Refresh the page to update the view
    window.location.reload();
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
          isSubscribed={isSubscribed}
          plan={plan}
          onSubscriptionVerified={handleSubscriptionVerified}
          auditId={audit.id}
          screenshotUrl={audit.screenshotPath || undefined}
          heatmapZones={(audit.heatmapZones as HeatmapZone[]) || undefined}
          pageHeight={3000} // Default since saved audits may not have this
          viewportWidth={1280}
        />
      </main>
    </div>
  );
}
