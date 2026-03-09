"use client";

import { useEffect, useState } from "react";

const STEPS = [
  { label: "Fetching page content", duration: 2000 },
  { label: "Analyzing page structure", duration: 3000 },
  { label: "Generating UX insights", duration: 0 },
];

export function LoadingState() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (activeStep >= STEPS.length - 1) return;
    const timer = setTimeout(() => {
      setActiveStep((s) => s + 1);
    }, STEPS[activeStep].duration);
    return () => clearTimeout(timer);
  }, [activeStep]);

  return (
    <div className="flex flex-col items-center justify-center py-32 px-6 animate-fade-in">
      {/* Pulsing dot indicator */}
      <div className="mb-10 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-foreground/60"
            style={{
              animation: "pulse-soft 1.4s ease-in-out infinite",
              animationDelay: `${i * 200}ms`,
            }}
          />
        ))}
      </div>

      <h2 className="text-lg font-semibold tracking-tight text-foreground">Analyzing your page</h2>
      <p className="mt-1.5 text-[13px] text-muted-foreground">
        This usually takes 10–20 seconds
      </p>

      {/* Steps */}
      <div className="mt-10 w-full max-w-xs space-y-2">
        {STEPS.map((step, i) => {
          const isActive = i === activeStep;
          const isDone = i < activeStep;
          return (
            <div
              key={step.label}
              className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-500"
              style={{
                opacity: isActive ? 1 : isDone ? 0.5 : 0.25,
                transform: isActive ? "translateX(0)" : "translateX(0)",
              }}
            >
              {/* Step indicator */}
              <div className="relative flex h-5 w-5 items-center justify-center shrink-0">
                {isDone ? (
                  <div className="h-5 w-5 rounded-full bg-foreground flex items-center justify-center animate-scale-in">
                    <svg className="h-3 w-3 text-background" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                ) : isActive ? (
                  <div className="h-5 w-5 rounded-full border-2 border-foreground/20">
                    <div className="h-full w-full rounded-full border-t-2 border-foreground animate-spin" />
                  </div>
                ) : (
                  <div className="h-5 w-5 rounded-full border border-border" />
                )}
              </div>

              <span className={`text-[13px] transition-colors duration-300 ${
                isActive ? "text-foreground font-medium" : "text-muted-foreground"
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Shimmer preview skeleton */}
      <div className="mt-14 w-full max-w-sm space-y-3">
        <div className="shimmer h-3 w-3/4 mx-auto rounded-full" />
        <div className="shimmer h-3 w-1/2 mx-auto rounded-full" style={{ animationDelay: "200ms" }} />
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="shimmer h-16 rounded-xl" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
