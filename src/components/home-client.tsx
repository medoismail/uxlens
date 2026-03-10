"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { LimitReached } from "@/components/limit-reached";
import { ResultsReport } from "@/components/results-report";
import { HumanAuditConfirmation } from "@/components/human-audit-confirmation";
import { Footer } from "@/components/footer";
import { HomeSEOContent } from "@/components/home-seo-content";
import { normalizeUrl } from "@/lib/validate-url";
import { useSubscription } from "@/hooks/use-subscription";
import { PLAN_FEATURES } from "@/lib/types";
import type { AnalysisResult, UXAuditResult, UsageCheck, HeatmapZone, CompetitorAnalysis, VisualAnalysis } from "@/lib/types";

type AppState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "limit_reached"; usage: UsageCheck }
  | {
      status: "success";
      data: UXAuditResult;
      url: string;
      auditId?: string;
      screenshotUrl?: string;
      heatmapZones?: HeatmapZone[];
      pageHeight?: number;
      viewportWidth?: number;
      screenshotStatus?: "loading" | "done" | "failed";
      heatmapStatus?: "loading" | "done" | "failed";
      visualAnalysis?: VisualAnalysis;
      visualAnalysisStatus?: "loading" | "done" | "failed";
      competitorAnalysis?: CompetitorAnalysis;
      competitorStatus?: "loading" | "done" | "failed" | "locked";
    }
  | { status: "human_audit_requested"; url: string; email: string };

export function HomeClient() {
  const [state, setState] = useState<AppState>({ status: "idle" });
  const { isSubscribed, email: subscriberEmail, plan, verifySubscription } = useSubscription();

  async function handleAnalyze(rawUrl: string) {
    setState({ status: "loading" });

    const normalizedUrl = normalizeUrl(rawUrl);

    try {
      // Step 1: Run the AI audit (fast — no screenshot)
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: normalizedUrl,
          ...(subscriberEmail && { email: subscriberEmail }),
        }),
      });

      const result: AnalysisResult = await res.json();

      if (result.success) {
        // Determine competitor analysis status based on plan
        const features = PLAN_FEATURES[plan];
        const compStatus = features.competitorAnalysis ? "loading" as const : "locked" as const;

        // Show the report immediately (without screenshot)
        setState({
          status: "success",
          data: result.data,
          url: result.url,
          auditId: result.auditId,
          screenshotStatus: "loading",
          competitorStatus: compStatus,
        });

        // Step 2: Capture screenshot in the background
        fetchScreenshot(result.url, result.auditId);

        // Step 3: Run competitor analysis in background (Pro+ only)
        if (features.competitorAnalysis) {
          fetchCompetitorAnalysis(result.url, result.data, result.auditId);
        }
      } else if (result.code === "USAGE_LIMIT" && result.usage) {
        if (result.usage.audits_remaining === 0 && result.usage.upgrade_suggestion) {
          setState({ status: "limit_reached", usage: result.usage });
        } else {
          setState({ status: "error", message: result.error });
        }
      } else {
        setState({ status: "error", message: result.error });
      }
    } catch {
      setState({
        status: "error",
        message: "Something went wrong. Please check your connection and try again.",
      });
    }
  }

  /**
   * Step 2: Capture screenshot via Puppeteer, then chain to vision analysis.
   * Screenshot → show image immediately → fire vision analysis in background.
   */
  async function fetchScreenshot(url: string, auditId?: string) {
    try {
      const res = await fetch("/api/screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, auditId }),
      });

      if (!res.ok) {
        setState((prev) => {
          if (prev.status !== "success") return prev;
          return { ...prev, screenshotStatus: "failed", heatmapStatus: "failed" };
        });
        return;
      }

      const data = await res.json();

      if (data.screenshotUrl) {
        // Show screenshot immediately — heatmap still loading
        setState((prev) => {
          if (prev.status !== "success") return prev;
          return {
            ...prev,
            screenshotUrl: data.screenshotUrl,
            pageHeight: data.pageHeight,
            viewportWidth: data.viewportWidth,
            screenshotStatus: "done",
            heatmapStatus: "loading",
            visualAnalysisStatus: "loading",
          };
        });

        // Chain: fire vision analysis now that we have the screenshot
        fetchVisionAnalysis(data.screenshotUrl, auditId, data.pageHeight, data.viewportWidth);
      } else {
        setState((prev) => {
          if (prev.status !== "success") return prev;
          return { ...prev, screenshotStatus: "failed", heatmapStatus: "failed" };
        });
      }
    } catch {
      setState((prev) => {
        if (prev.status !== "success") return prev;
        return { ...prev, screenshotStatus: "failed", heatmapStatus: "failed" };
      });
    }
  }

  /**
   * Step 2b: AI vision analysis — generates heatmap hotspots + visual design scores.
   * Runs after screenshot is available.
   */
  async function fetchVisionAnalysis(
    screenshotUrl: string,
    auditId?: string,
    pageHeight?: number,
    viewportWidth?: number
  ) {
    try {
      const res = await fetch("/api/vision-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screenshotUrl, auditId, pageHeight, viewportWidth }),
      });

      if (!res.ok) {
        setState((prev) => {
          if (prev.status !== "success") return prev;
          return { ...prev, heatmapStatus: "failed", visualAnalysisStatus: "failed" };
        });
        return;
      }

      const data = await res.json();

      setState((prev) => {
        if (prev.status !== "success") return prev;
        return {
          ...prev,
          heatmapZones: data.heatmapZones,
          visualAnalysis: data.visualAnalysis || undefined,
          heatmapStatus: "done",
          visualAnalysisStatus: data.visualAnalysis ? "done" : "failed",
        };
      });
    } catch {
      setState((prev) => {
        if (prev.status !== "success") return prev;
        return { ...prev, heatmapStatus: "failed", visualAnalysisStatus: "failed" };
      });
    }
  }

  /** Fire-and-forget: run competitor analysis and update state when it arrives */
  async function fetchCompetitorAnalysis(url: string, auditData: UXAuditResult, auditId?: string) {
    try {
      const res = await fetch("/api/competitor-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          auditId,
          overallScore: auditData.overallScore,
          categories: auditData.categories,
          headline: auditData.rewrite?.beforeHeadline || "",
          executiveSummary: auditData.executiveSummary,
        }),
      });

      if (!res.ok) {
        setState((prev) => {
          if (prev.status !== "success") return prev;
          return { ...prev, competitorStatus: "failed" };
        });
        return;
      }

      const result = await res.json();

      if (result.success && result.data) {
        setState((prev) => {
          if (prev.status !== "success") return prev;
          return { ...prev, competitorAnalysis: result.data, competitorStatus: "done" };
        });
      } else {
        setState((prev) => {
          if (prev.status !== "success") return prev;
          return { ...prev, competitorStatus: "failed" };
        });
      }
    } catch {
      setState((prev) => {
        if (prev.status !== "success") return prev;
        return { ...prev, competitorStatus: "failed" };
      });
    }
  }

  /** Re-run competitor analysis with user-provided competitor URLs */
  async function handleManualCompetitors(competitorUrls: string[]) {
    if (state.status !== "success") return;

    // Set loading state for competitor section
    setState((prev) => {
      if (prev.status !== "success") return prev;
      return { ...prev, competitorStatus: "loading", competitorAnalysis: undefined };
    });

    try {
      const res = await fetch("/api/competitor-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: state.url,
          auditId: state.auditId,
          overallScore: state.data.overallScore,
          categories: state.data.categories,
          headline: state.data.rewrite?.beforeHeadline || "",
          executiveSummary: state.data.executiveSummary,
          competitorUrls,
        }),
      });

      if (!res.ok) {
        setState((prev) => {
          if (prev.status !== "success") return prev;
          return { ...prev, competitorStatus: "failed" };
        });
        return;
      }

      const result = await res.json();

      if (result.success && result.data) {
        setState((prev) => {
          if (prev.status !== "success") return prev;
          return { ...prev, competitorAnalysis: result.data, competitorStatus: "done" };
        });
      } else {
        setState((prev) => {
          if (prev.status !== "success") return prev;
          return { ...prev, competitorStatus: "failed" };
        });
      }
    } catch {
      setState((prev) => {
        if (prev.status !== "success") return prev;
        return { ...prev, competitorStatus: "failed" };
      });
    }
  }

  function handleHumanAuditRequested(url: string, email: string) {
    setState({ status: "human_audit_requested", url: normalizeUrl(url), email });
  }

  function handleReset() {
    setState({ status: "idle" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSubscriptionVerified(email: string) {
    verifySubscription(email);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main id="main-content" className="flex-1 mx-auto w-full max-w-[960px]">
        {state.status === "idle" && (
          <Hero onSubmit={handleAnalyze} isLoading={false} />
        )}
        {state.status === "loading" && <LoadingState />}
        {state.status === "error" && (
          <ErrorState message={state.message} onRetry={handleReset} />
        )}
        {state.status === "limit_reached" && (
          <LimitReached
            usage={state.usage}
            onReset={handleReset}
            onHumanAuditRequested={handleHumanAuditRequested}
            onSubscriptionVerified={handleSubscriptionVerified}
          />
        )}
        {state.status === "success" && (
          <ResultsReport
            data={state.data}
            url={state.url}
            onReset={handleReset}
            onHumanAuditRequested={handleHumanAuditRequested}
            plan={plan}
            auditId={state.auditId}
            screenshotUrl={state.screenshotUrl}
            heatmapZones={state.heatmapZones}
            pageHeight={state.pageHeight}
            viewportWidth={state.viewportWidth}
            screenshotStatus={state.screenshotStatus}
            heatmapStatus={state.heatmapStatus}
            visualAnalysis={state.visualAnalysis}
            visualAnalysisStatus={state.visualAnalysisStatus}
            competitorAnalysis={state.competitorAnalysis}
            competitorStatus={state.competitorStatus}
            onManualCompetitors={handleManualCompetitors}
          />
        )}
        {state.status === "human_audit_requested" && (
          <HumanAuditConfirmation
            url={state.url}
            email={state.email}
            onReset={handleReset}
          />
        )}
      </main>
      {state.status === "idle" && (
        <>
          <HomeSEOContent />
          <Footer />
        </>
      )}
    </div>
  );
}
