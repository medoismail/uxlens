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
const STEP_DURATION = 2000; // 2s per step → ~20s total for 10 steps
const PROGRESS_FILL_TIME = 1400; // time for progress bar to fill within each step

export function LoadingState() {
  const [activeStep, setActiveStep] = useState(0);
  const [phase, setPhase] = useState<"enter" | "loading" | "done" | "exit">("enter");
  const isLastStep = activeStep === TOTAL_STEPS - 1;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    function runStep(step: number) {
      if (step >= TOTAL_STEPS) return;
      const last = step === TOTAL_STEPS - 1;

      setActiveStep(step);
      setPhase("enter");

      // Enter → Loading (progress bar starts filling)
      timers.push(setTimeout(() => setPhase("loading"), 250));

      if (last) {
        // Last step: never complete, stays in "loading" forever
        // The component will be unmounted when the audit is ready
        return;
      }

      // Steps 1-9: complete and transition to next
      timers.push(setTimeout(() => setPhase("done"), 250 + PROGRESS_FILL_TIME));
      timers.push(setTimeout(() => setPhase("exit"), STEP_DURATION - 250));
      timers.push(setTimeout(() => runStep(step + 1), STEP_DURATION));
    }

    runStep(0);
    return () => timers.forEach(clearTimeout);
  }, []);

  const step = PIPELINE_STEPS[activeStep];

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

      {/* Step card — single card that animates in/out */}
      <div className="w-full max-w-sm relative" style={{ height: 110 }}>
        <div
          key={activeStep}
          className={`absolute inset-0 step-card step-card--${phase}`}
        >
          <div
            className="rounded-xl border p-4 h-full flex flex-col justify-between"
            style={{
              background: "var(--s1)",
              borderColor: phase === "done"
                ? "var(--brand-glow)"
                : "var(--brand-glow)",
              boxShadow: "0 0 20px var(--brand-glow)",
              transition: "border-color 0.3s, box-shadow 0.3s",
            }}
          >
            {/* Top row: number + name + status */}
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full border grid place-items-center text-[11px] font-mono font-bold shrink-0 transition-all duration-300"
                style={{
                  borderColor: phase === "done" ? "var(--brand)" : "var(--brand)",
                  color: "var(--brand)",
                  background: "var(--brand-dim)",
                }}
              >
                {phase === "done" && !isLastStep ? (
                  <Check className="h-3.5 w-3.5" style={{ color: "var(--brand)" }} />
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
              {/* Loading dots for active step */}
              {(phase === "loading" || (isLastStep && phase !== "enter")) && (
                <span className="inline-flex gap-[3px] items-center shrink-0">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="w-1 h-1 rounded-full"
                      style={{
                        background: "var(--brand)",
                        animation: "pdot 1.2s ease-in-out infinite",
                        animationDelay: `${d * 150}ms`,
                      }}
                    />
                  ))}
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width:
                      phase === "enter"
                        ? "0%"
                        : isLastStep && phase === "loading"
                        ? "85%"
                        : phase === "loading"
                        ? "100%"
                        : "100%",
                    background: "var(--brand)",
                    transition:
                      isLastStep && phase === "loading"
                        ? `width 12s cubic-bezier(0.1, 0.5, 0.2, 1)`
                        : phase === "loading"
                        ? `width ${PROGRESS_FILL_TIME}ms cubic-bezier(0.22, 1, 0.36, 1)`
                        : "width 0.2s ease",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step dots indicator */}
      <div className="flex items-center gap-1.5 mt-5">
        {PIPELINE_STEPS.map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full transition-all duration-300"
            style={{
              background:
                i < activeStep
                  ? "var(--brand)"
                  : i === activeStep
                  ? "var(--brand)"
                  : "var(--border)",
              opacity: i < activeStep ? 0.5 : i === activeStep ? 1 : 0.4,
              transform: i === activeStep ? "scale(1.4)" : "scale(1)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
