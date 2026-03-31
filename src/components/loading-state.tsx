"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

const PIPELINE_STEPS = [
  { num: "01", name: "Structural Decomposition", desc: "Extracting page sections, hierarchy & element inventory" },
  { num: "02", name: "Message Clarity Analysis", desc: "Evaluating headline power, value proposition & semantic precision" },
  { num: "03", name: "Cognitive Load Scan", desc: "Measuring information density, friction points & mental effort" },
  { num: "04", name: "Conversion Architecture", desc: "Auditing CTA placement, urgency, specificity & action pathway" },
  { num: "05", name: "Trust Signal Inventory", desc: "Cataloguing social proof, authority markers & risk reducers" },
  { num: "06", name: "Contradiction Detection", desc: "Cross-checking claims for inconsistencies & broken promises" },
  { num: "07", name: "First-Screen Hypothesis", desc: "Simulating above-the-fold clarity for cold-traffic visitors" },
  { num: "08", name: "Self-Critique Refinement", desc: "Challenging initial findings & eliminating false positives" },
  { num: "09", name: "Synthesis & Rewrite Engine", desc: "Generating actionable priorities & optimized copy rewrites" },
  { num: "10", name: "Heuristic Evaluation", desc: "Scoring 10 Nielsen usability heuristics with issues & passes" },
];

const TOTAL_STEPS = PIPELINE_STEPS.length;
const STEP_DURATION = 2000;

// Map SSE stage names → step index
const STAGE_TO_INDEX: Record<string, number> = {
  structural_decomposition: 0,
  message_clarity: 1,
  cognitive_load: 2,
  conversion_architecture: 3,
  trust_signals: 4,
  contradiction_detection: 5,
  first_screen: 6,
  self_critique: 7,
  synthesis_rewrite: 8,
  heuristic_evaluation: 9,
  retrying: 0,
  complete: 9,
};

interface LoadingStateProps {
  progress?: { stage: string; percent: number };
  metadata?: { title: string; description: string; headingsCount: number; language?: string };
}

export function LoadingState({ progress, metadata }: LoadingStateProps) {
  const [activeStep, setActiveStep] = useState(0);
  const isStreaming = !!progress;

  // ═══ REAL PROGRESS MODE (SSE-driven) ═══
  useEffect(() => {
    if (!progress) return;
    const targetStep = STAGE_TO_INDEX[progress.stage] ?? Math.min(9, Math.floor(progress.percent / 10));
    if (targetStep > activeStep) {
      setActiveStep(targetStep);
    }
  }, [progress, activeStep]);

  // ═══ TIMER MODE (fallback for screenshot-analyze flow) ═══
  useEffect(() => {
    if (isStreaming) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < TOTAL_STEPS - 1 ? prev + 1 : prev));
    }, STEP_DURATION);
    return () => clearInterval(interval);
  }, [isStreaming]);

  const step = PIPELINE_STEPS[activeStep];
  const percent = isStreaming && progress ? progress.percent : Math.round(((activeStep + 0.5) / TOTAL_STEPS) * 100);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 animate-fade-in relative z-[1]">
      {/* Title */}
      <p className="text-[12px] font-mono uppercase tracking-[2.5px] text-foreground/50 mb-2">
        Diagnostic pipeline running
      </p>

      <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">
        {metadata?.title
          ? `Analyzing: ${metadata.title.slice(0, 50)}${metadata.title.length > 50 ? "…" : ""}`
          : "Analyzing your page"}
      </h2>
      <p className="text-[12px] text-foreground/40 font-mono mb-8">
        10-layer structured audit — {percent}% complete
      </p>

      {/* Single progress bar */}
      <div className="w-full max-w-sm mb-6">
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${percent}%`,
              background: "var(--brand)",
              transition: "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        </div>
      </div>

      {/* Active step card */}
      <div className="w-full max-w-sm">
        <div
          key={activeStep}
          className="rounded-xl border p-4 animate-fade-in"
          style={{
            background: "var(--s1)",
            borderColor: "var(--brand-glow)",
            boxShadow: "0 0 20px var(--brand-glow)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full border grid place-items-center text-[11px] font-mono font-bold shrink-0"
              style={{
                borderColor: "var(--brand)",
                color: "var(--brand)",
                background: "var(--brand-dim)",
              }}
            >
              {step.num}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-foreground">{step.name}</div>
              <div className="text-[11px] text-foreground/45 leading-snug mt-0.5 truncate">
                {step.desc}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step dots — compact indicator of which step we're on */}
      <div className="flex items-center gap-1.5 mt-5">
        {PIPELINE_STEPS.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === activeStep ? 8 : 5,
              height: 5,
              borderRadius: i === activeStep ? 3 : "50%",
              background: i <= activeStep ? "var(--brand)" : "var(--border)",
              opacity: i < activeStep ? 0.5 : i === activeStep ? 1 : 0.3,
            }}
          />
        ))}
      </div>
    </div>
  );
}
