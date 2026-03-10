"use client";

import { useState, useEffect, useCallback } from "react";
import { UrlForm } from "@/components/url-form";

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

      {/* Headline — 2 lines + rotating word on line 3 */}
      <h1 className="animate-slide-up text-[clamp(34px,5.5vw,56px)] font-bold tracking-[-1.5px] leading-[1.15] max-w-[780px] text-foreground">
        Your Page Is Losing Conversions
        <br />
        Find Out Why
        <RotatingText />
      </h1>

      {/* Subheadline */}
      <p
        className="animate-slide-up mt-4 text-[13px] leading-relaxed text-foreground/45 max-w-[520px]"
        style={{ animationDelay: "60ms" }}
      >
        Paste any URL. Get a 9-layer AI audit with attention heatmaps,
        conversion killers, and an AI-rewritten hero — in under 30 seconds.
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
