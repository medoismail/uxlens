"use client";

import { useState, useEffect, useCallback } from "react";
import { UrlForm } from "@/components/url-form";

const ROTATING_WORDS = [
  "conversion killer",
  "trust gap",
  "UX friction point",
  "missed opportunity",
  "broken promise",
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
      className="inline-flex overflow-hidden align-bottom"
      style={{ height: "1.15em" }}
    >
      <span
        key={index}
        className={animState === "enter" ? "word-enter" : "word-exit"}
        style={{
          display: "inline-block",
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
    <section className="flex flex-col items-center text-center px-6 pt-16 pb-16 relative z-[1]">
      {/* Badge */}
      <div className="animate-fade-in mb-6">
        <span
          className="inline-flex items-center rounded-full border px-3.5 py-1.5 text-[12px] font-medium tracking-wide uppercase"
          style={{
            borderColor: "var(--border2)",
            background: "var(--brand-dim)",
            color: "var(--brand)",
          }}
        >
          AI-Powered UX Audit Platform
        </span>
      </div>

      {/* Headline with rotating word */}
      <h1 className="animate-slide-up text-[clamp(34px,5.5vw,56px)] font-bold tracking-[-1.5px] leading-[1.08] max-w-[720px] text-foreground">
        Instant website analysis
        <br />
        to find every <RotatingText />
      </h1>

      {/* Subheadline */}
      <p
        className="animate-slide-up mt-4 text-[12px] leading-relaxed text-foreground/45 max-w-[520px] font-mono"
        style={{ animationDelay: "60ms" }}
      >
        9-layer AI diagnostic with attention heatmaps, trust analysis, and
        actionable fixes. Save every audit and export as PDF.
      </p>

      {/* Form */}
      <div
        className="animate-slide-up mt-10 w-full max-w-lg"
        style={{ animationDelay: "120ms" }}
      >
        <UrlForm onSubmit={onSubmit} isLoading={isLoading} />
      </div>

      {/* Algo badges */}
      <div
        className="animate-fade-in mt-6 flex flex-wrap justify-center gap-1.5"
        style={{ animationDelay: "250ms" }}
      >
        {[
          "9 LAYERS",
          "ATTENTION HEATMAP",
          "CONTRADICTION SCAN",
          "AI CHAT",
          "PDF EXPORT",
        ].map((badge) => (
          <span
            key={badge}
            className="text-[12px] font-mono px-2 py-0.5 rounded border text-foreground/30 tracking-wide"
            style={{ borderColor: "var(--border)" }}
          >
            {badge}
          </span>
        ))}
      </div>
    </section>
  );
}
