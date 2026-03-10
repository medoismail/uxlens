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

export function LoadingState() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((s) => {
        if (s < PIPELINE_STEPS.length - 1) return s + 1;
        return s;
      });
    }, 1100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 animate-fade-in relative z-[1]">
      {/* Title */}
      <div className="flex items-center gap-2.5 mb-2">
        <div className="h-2 w-2 rounded-full" style={{ background: "var(--brand)", animation: "blink-dot 1.8s ease-in-out infinite" }} />
        <p className="text-[12px] font-mono uppercase tracking-[2.5px] text-foreground/30">
          Diagnostic pipeline running
        </p>
      </div>

      <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Analyzing your page</h2>
      <p className="text-[12px] text-foreground/40 font-mono mb-8">
        10-layer structured audit — usually takes 15-25 seconds
      </p>

      {/* Pipeline steps */}
      <div className="w-full max-w-lg">
        {PIPELINE_STEPS.map((step, i) => {
          const isActive = i === activeStep;
          const isDone = i < activeStep;

          return (
            <div
              key={step.num}
              className="grid grid-cols-[44px_1fr_auto] items-center gap-3.5 py-3 border-b transition-opacity duration-300"
              style={{
                borderColor: "var(--border)",
                opacity: isActive ? 1 : isDone ? 0.55 : 0.3,
              }}
            >
              {/* Number circle */}
              <div
                className="w-9 h-9 rounded-full border grid place-items-center text-[12px] font-mono font-medium transition-all duration-300"
                style={{
                  borderColor: isActive
                    ? "var(--brand)"
                    : isDone
                    ? "var(--score-high)"
                    : "var(--border)",
                  color: isActive
                    ? "var(--brand)"
                    : isDone
                    ? "var(--score-high)"
                    : "var(--muted-foreground)",
                  background: isActive
                    ? "var(--brand-dim)"
                    : isDone
                    ? "oklch(0.623 0.178 145 / 8%)"
                    : "transparent",
                  boxShadow: isActive ? "0 0 12px var(--brand-glow)" : "none",
                }}
              >
                {step.num}
              </div>

              {/* Info */}
              <div>
                <div className="text-[12px] font-medium text-foreground">{step.name}</div>
                <div className="text-[12px] text-foreground/35 leading-snug">{step.desc}</div>
              </div>

              {/* Status */}
              <div className="text-[12px]">
                {isDone && <Check className="h-3.5 w-3.5" style={{ color: "var(--score-high)" }} />}
                {isActive && (
                  <span className="inline-flex gap-[3px] items-center">
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
            </div>
          );
        })}
      </div>

    </div>
  );
}
