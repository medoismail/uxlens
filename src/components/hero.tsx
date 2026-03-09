"use client";

import { UrlForm } from "@/components/url-form";

interface HeroProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export function Hero({ onSubmit, isLoading }: HeroProps) {
  return (
    <section className="flex flex-col items-center text-center px-6 pt-24 pb-20">
      {/* Badge */}
      <div className="animate-fade-in mb-6">
        <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-[11px] font-medium text-muted-foreground tracking-wide uppercase">
          AI-Powered UX Analysis
        </span>
      </div>

      {/* Headline */}
      <h1 className="animate-slide-up text-[2.5rem] sm:text-[3.25rem] font-bold tracking-[-0.03em] leading-[1.1] max-w-[640px] text-foreground">
        Instant UX feedback for your landing page
      </h1>

      {/* Subheadline */}
      <p className="animate-slide-up mt-5 text-[17px] leading-relaxed text-muted-foreground max-w-[440px]" style={{ animationDelay: "60ms" }}>
        Spot weak messaging, unclear CTAs, and conversion blockers — in seconds.
      </p>

      {/* Form */}
      <div className="animate-slide-up mt-10 w-full max-w-lg" style={{ animationDelay: "120ms" }}>
        <UrlForm onSubmit={onSubmit} isLoading={isLoading} />
      </div>

      {/* How it works */}
      <div className="animate-fade-in mt-24 w-full max-w-md" style={{ animationDelay: "300ms" }}>
        <div className="flex items-center justify-center gap-8 sm:gap-12">
          {["Paste URL", "AI analyzes", "Get insights"].map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground/[0.06] text-[10px] font-semibold text-muted-foreground">
                {i + 1}
              </span>
              <span className="text-[13px] text-muted-foreground">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
