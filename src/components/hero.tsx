"use client";

import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { UrlForm } from "@/components/url-form";

const HeroBackground = lazy(() =>
  import("@/components/hero-background").then((m) => ({ default: m.HeroBackground }))
);

const ROTATING_WORDS = [
  "in 30 seconds",
  "with AI precision",
  "before users leave",
  "at every layer",
];

const ROTATE_INTERVAL = 2800;

function RotatingText() {
  const [index, setIndex] = useState(0);
  const [animState, setAnimState] = useState<"enter" | "exit">("enter");

  const advance = useCallback(() => {
    setAnimState("exit");
    setTimeout(() => {
      setIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
      setAnimState("enter");
    }, 400);
  }, []);

  useEffect(() => {
    const timer = setInterval(advance, ROTATE_INTERVAL);
    return () => clearInterval(timer);
  }, [advance]);

  return (
    <span
      className="block overflow-hidden"
      style={{ height: "1.2em" }}
    >
      <span
        key={index}
        className={animState === "enter" ? "word-enter" : "word-exit"}
        style={{
          display: "block",
          color: "var(--brand)",
        }}
      >
        {ROTATING_WORDS[index]}
      </span>
    </span>
  );
}

interface HeroProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export function Hero({ onSubmit, isLoading }: HeroProps) {
  return (
    <section className="relative flex flex-col items-center text-center px-6 pt-20 pb-20">
      {/* Three.js animated background */}
      <Suspense fallback={null}>
        <HeroBackground />
      </Suspense>

      {/* Badge */}
      <div className="animate-fade-in mb-7 relative z-[1]">
        <span
          className="inline-flex items-center rounded-full border px-3.5 py-1.5 text-[12px] font-medium tracking-wide uppercase"
          style={{
            borderColor: "rgba(0,0,0,0.06)",
            background: "var(--brand-dim)",
            color: "var(--brand)",
          }}
        >
          AI-Powered UX Audit Platform
        </span>
      </div>

      {/* Headline — 2 lines + rotating word on line 3 */}
      <h1 className="animate-slide-up text-[clamp(34px,5.5vw,56px)] font-bold tracking-[-1.5px] leading-[1.15] max-w-[780px] text-foreground relative z-[1]">
        Find What&apos;s Killing
        <br />
        Your Conversions
        <RotatingText />
      </h1>

      {/* Subheadline */}
      <p
        className="animate-slide-up mt-5 text-[13.5px] leading-relaxed text-foreground/40 max-w-[540px] relative z-[1]"
        style={{ animationDelay: "60ms" }}
      >
        Paste any URL. Get a 10-layer AI audit with heuristic evaluation, attention heatmaps,
        conversion killers, and an AI-rewritten hero — in under 30 seconds.
      </p>

      {/* Form */}
      <div
        className="animate-slide-up mt-12 w-full max-w-lg relative z-[1]"
        style={{ animationDelay: "120ms" }}
      >
        <UrlForm onSubmit={onSubmit} isLoading={isLoading} />
      </div>

      {/* Algo badges */}
      <div
        className="animate-fade-in mt-7 flex flex-wrap justify-center gap-2 relative z-[1]"
        style={{ animationDelay: "250ms" }}
      >
        {[
          "10 LAYERS",
          "HEURISTIC EVAL",
          "ATTENTION HEATMAP",
          "AI CHAT",
          "PDF EXPORT",
        ].map((badge) => (
          <span
            key={badge}
            className="text-[11px] font-mono px-2.5 py-1 rounded-md text-foreground/25 tracking-wide"
            style={{
              border: "1px solid rgba(0,0,0,0.05)",
              background: "rgba(0,0,0,0.015)",
            }}
          >
            {badge}
          </span>
        ))}
      </div>
    </section>
  );
}
