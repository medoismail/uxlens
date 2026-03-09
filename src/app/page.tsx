"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { ResultsReport } from "@/components/results-report";
import { normalizeUrl } from "@/lib/validate-url";
import { checkUsage, incrementUsage } from "@/lib/usage";
import { useSubscription } from "@/hooks/use-subscription";
import type { AnalysisResult, UXAuditResult } from "@/lib/types";

type AppState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: UXAuditResult; url: string };

export default function Home() {
  const [state, setState] = useState<AppState>({ status: "idle" });
  const { isSubscribed, plan, verifySubscription } = useSubscription();

  async function handleAnalyze(rawUrl: string) {
    const usage = checkUsage(plan);
    if (!usage.audit_allowed) {
      const msg = usage.upgrade_suggestion
        ? `${usage.reason} ${usage.upgrade_suggestion}`
        : usage.reason;
      setState({ status: "error", message: msg });
      return;
    }

    setState({ status: "loading" });

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizeUrl(rawUrl) }),
      });

      const result: AnalysisResult = await res.json();

      if (result.success) {
        incrementUsage();
        setState({ status: "success", data: result.data, url: result.url });
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
      <main className="flex-1 mx-auto w-full max-w-4xl">
        {state.status === "idle" && (
          <Hero onSubmit={handleAnalyze} isLoading={false} />
        )}
        {state.status === "loading" && <LoadingState />}
        {state.status === "error" && (
          <ErrorState message={state.message} onRetry={handleReset} />
        )}
        {state.status === "success" && (
          <ResultsReport
            data={state.data}
            url={state.url}
            onReset={handleReset}
            isSubscribed={isSubscribed}
            plan={plan}
            onSubscriptionVerified={handleSubscriptionVerified}
          />
        )}
      </main>
      {state.status === "idle" && (
        <footer className="border-t border-border/30 py-8 text-center text-[11px] text-muted-foreground/50">
          UXLens &mdash; Instant UX audits powered by AI
        </footer>
      )}
    </div>
  );
}
