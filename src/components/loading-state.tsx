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

const STEP_DURATION = 2200; // ms per step total
const PROGRESS_DURATION = 1600; // ms for the progress bar fill

export function LoadingState() {
  const [activeStep, setActiveStep] = useState(0);
  const [phase, setPhase] = useState<"enter" | "loading" | "done" | "exit">("enter");

  useEffect(() => {
    // Phase timeline per step:
    // 0ms: enter (slide in)
    // 300ms: loading (progress bar fills)
    // 1900ms: done (checkmark)
    // 2000ms: exit (slide out)
    // 2200ms: next step

    const timers: ReturnType<typeof setTimeout>[] = [];

    function runStep(step: number) {
      if (step >= PIPELINE_STEPS.length) return;

      setActiveStep(step);
      setPhase("enter");

      timers.push(setTimeout(() => setPhase("loading"), 300));
      timers.push(setTimeout(() => setPhase("done"), 300 + PROGRESS_DURATION));
      timers.push(setTimeout(() => setPhase("exit"), STEP_DURATION - 200));
      timers.push(
        setTimeout(() => {
          if (step < PIPELINE_STEPS.length - 1) {
            runStep(step + 1);
          } else {
            // Stay on last step in "done" state
            setPhase("done");
          }
        }, STEP_DURATION)
      );
    }

    runStep(0);
    return () => timers.forEach(clearTimeout);
  }, []);

  const step = PIPELINE_STEPS[activeStep];
  const progress = ((activeStep + (phase === "done" || phase === "exit" ? 1 : 0.5)) / PIPELINE_STEPS.length) * 100;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 animate-fade-in relative z-[1]">
      {/* Title */}
      <div className="flex items-center gap-2.5 mb-2">
        <div
          className="h-2 w-2 rounded-full"
          style={{ background: "var(--brand)", animation: "blink-dot 1.8s ease-in-out infinite" }}
        />
        <p className="text-[12px] font-mono uppercase tracking-[2.5px] text-foreground/50">
          Diagnostic pipeline running
        </p>
      </div>

      <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Analyzing your page</h2>
      <p className="text-[12px] text-foreground/40 font-mono mb-8">
        10-layer structured audit — usually takes 15-25 seconds
      </p>

      {/* Overall progress bar */}
      <div className="w-full max-w-sm mb-6">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-mono text-foreground/40">
            Step {activeStep + 1} of {PIPELINE_STEPS.length}
          </span>
          <span className="text-[11px] font-mono text-foreground/40 tabular-nums">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              background: "var(--brand)",
              transition: "width 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        </div>
      </div>

      {/* Step card — single card that animates in/out */}
      <div className="w-full max-w-sm relative" style={{ height: 120 }}>
        <div
          key={activeStep}
          className={`absolute inset-0 step-card step-card--${phase}`}
        >
          <div
            className="rounded-xl border p-4 h-full flex flex-col justify-between"
            style={{
              background: "var(--s1)",
              borderColor: phase === "done" ? "oklch(0.52 0.14 155 / 25%)" : "var(--brand-glow)",
              boxShadow:
                phase === "done"
                  ? "0 0 20px oklch(0.52 0.14 155 / 8%)"
                  : "0 0 20px var(--brand-glow)",
              transition: "border-color 0.3s, box-shadow 0.3s",
            }}
          >
            {/* Top row: number + name + status */}
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full border grid place-items-center text-[11px] font-mono font-bold shrink-0 transition-all duration-300"
                style={{
                  borderColor: phase === "done" ? "var(--score-high)" : "var(--brand)",
                  color: phase === "done" ? "var(--score-high)" : "var(--brand)",
                  background: phase === "done" ? "oklch(0.52 0.14 155 / 10%)" : "var(--brand-dim)",
                }}
              >
                {phase === "done" ? (
                  <Check className="h-3.5 w-3.5" style={{ color: "var(--score-high)" }} />
                ) : (
                  step.num
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-foreground">{step.name}</div>
                <div className="text-[11px] text-foreground/45 leading-snug mt-0.5 truncate">
                  {step.desc}
                </div>
              </div>
            </div>

            {/* Progress bar inside card */}
            <div className="mt-3">
              <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: phase === "enter" ? "0%" : phase === "loading" ? "100%" : "100%",
                    background:
                      phase === "done" ? "var(--score-high)" : "var(--brand)",
                    transition:
                      phase === "loading"
                        ? `width ${PROGRESS_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`
                        : "width 0.2s ease, background 0.3s ease",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Completed steps dots */}
      <div className="flex items-center gap-1.5 mt-6">
        {PIPELINE_STEPS.map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full transition-all duration-300"
            style={{
              background:
                i < activeStep
                  ? "var(--score-high)"
                  : i === activeStep
                  ? "var(--brand)"
                  : "var(--border)",
              transform: i === activeStep ? "scale(1.4)" : "scale(1)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
