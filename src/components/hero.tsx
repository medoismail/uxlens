"use client";

import { UrlForm } from "@/components/url-form";

interface HeroProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export function Hero({ onSubmit, isLoading }: HeroProps) {
  return (
    <section className="flex flex-col items-center text-center px-6 pt-16 pb-16 relative z-[1]">
      {/* Badge — pill frame like old design */}
      <div className="animate-fade-in mb-6">
        <span className="inline-flex items-center rounded-full border px-3.5 py-1.5 text-[11px] font-medium tracking-wide uppercase" style={{ borderColor: "var(--border2)", background: "var(--brand-dim)", color: "var(--brand)" }}>
          9-Layer Structured UX Audit
        </span>
      </div>

      {/* Headline */}
      <h1 className="animate-slide-up text-[clamp(34px,5.5vw,56px)] font-bold tracking-[-1.5px] leading-[1.08] max-w-[640px] text-foreground">
        Find every reason<br />your page <span style={{ color: "var(--brand)" }}>fails to convert</span>
      </h1>

      {/* Subheadline */}
      <p className="animate-slide-up mt-4 text-[12px] leading-relaxed text-foreground/45 max-w-[520px] font-mono" style={{ animationDelay: "60ms" }}>
        The most advanced UX diagnostic algorithm: multi-stage analysis, self-critique loop, contradiction detection, and rewrite synthesis.
      </p>

      {/* Form */}
      <div className="animate-slide-up mt-10 w-full max-w-lg" style={{ animationDelay: "120ms" }}>
        <UrlForm onSubmit={onSubmit} isLoading={isLoading} />
      </div>

      {/* Algo badges */}
      <div className="animate-fade-in mt-6 flex flex-wrap justify-center gap-1.5" style={{ animationDelay: "250ms" }}>
        {["9 LAYERS", "SELF-CRITIQUE", "CONTRADICTION SCAN", "REWRITE ENGINE"].map((badge) => (
          <span key={badge} className="text-[9px] font-mono px-2 py-0.5 rounded border text-foreground/30 tracking-wide" style={{ borderColor: "var(--border)" }}>
            {badge}
          </span>
        ))}
      </div>
    </section>
  );
}
