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
import type { AnalysisResult, UXAuditResult, UsageCheck } from "@/lib/types";

type AppState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "limit_reached"; usage: UsageCheck }
  | { status: "success"; data: UXAuditResult; url: string }
  | { status: "human_audit_requested"; url: string; email: string };

export function HomeClient() {
  const [state, setState] = useState<AppState>({ status: "idle" });
  const { isSubscribed, email: subscriberEmail, plan, verifySubscription } = useSubscription();

  async function handleAnalyze(rawUrl: string) {
    setState({ status: "loading" });

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: normalizeUrl(rawUrl),
          ...(subscriberEmail && { email: subscriberEmail }),
        }),
      });

      const result: AnalysisResult = await res.json();

      if (result.success) {
        setState({ status: "success", data: result.data, url: result.url });
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
            isSubscribed={isSubscribed}
            plan={plan}
            onSubscriptionVerified={handleSubscriptionVerified}
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
