"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
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
  shareToken?: string | null;
  isSharedView?: boolean;
}

export function AuditViewClient({ audit, plan, shareToken: initialShareToken, isSharedView }: AuditViewClientProps) {
  const router = useRouter();
  const [competitorAnalysis, setCompetitorAnalysis] = useState<CompetitorAnalysis | undefined>(audit.competitorAnalysis);
  const [competitorStatus, setCompetitorStatus] = useState<"loading" | "done" | "failed" | "locked" | undefined>(
    audit.competitorAnalysis ? "done" :
    PLAN_FEATURES[plan].competitorAnalysis ? undefined :
    "locked"
  );

  const [shareToken, setShareToken] = useState<string | null>(initialShareToken ?? null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  function handleReset() {
    router.push("/dashboard");
  }

  function handleHumanAuditRequested() {
    // Not applicable for saved audits
  }

  const handleManualCompetitors = useCallback(async (competitorUrls: string[]) => {
    setCompetitorStatus("loading");
    setCompetitorAnalysis(undefined);
    try {
      const res = await fetch("/api/competitor-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: audit.url,
          auditId: audit.id,
          overallScore: audit.result.overallScore,
          categories: audit.result.categories,
          headline: audit.result.rewrite?.beforeHeadline || "",
          executiveSummary: audit.result.executiveSummary,
          competitorUrls,
        }),
      });
      if (!res.ok) { setCompetitorStatus("failed"); return; }
      const result = await res.json();
      if (result.success && result.data) {
        setCompetitorAnalysis(result.data);
        setCompetitorStatus("done");
      } else {
        setCompetitorStatus("failed");
      }
    } catch {
      setCompetitorStatus("failed");
    }
  }, [audit.url, audit.id, audit.result]);

  async function handleToggleShare() {
    setShareLoading(true);
    try {
      const res = await fetch("/api/audits/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId: audit.id }),
      });
      if (!res.ok) { setShareLoading(false); return; }
      const { shareToken: newToken } = await res.json();
      setShareToken(newToken);

      if (newToken) {
        const url = `${window.location.origin}/share/${newToken}`;
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch {
      // silently fail
    }
    setShareLoading(false);
  }

  async function handleCopyShareLink() {
    if (!shareToken) return;
    const url = `${window.location.origin}/share/${shareToken}`;
    await navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
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
          competitorAnalysis={competitorAnalysis}
          competitorStatus={competitorStatus}
          onManualCompetitors={!isSharedView && PLAN_FEATURES[plan].competitorAnalysis ? handleManualCompetitors : undefined}
          isSharedView={isSharedView}
          shareToken={shareToken}
          onToggleShare={!isSharedView ? handleToggleShare : undefined}
          shareLoading={shareLoading}
          shareCopied={shareCopied}
          onCopyShareLink={handleCopyShareLink}
        />
      </main>
    </div>
  );
}
