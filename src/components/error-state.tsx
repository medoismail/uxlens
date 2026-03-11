"use client";

import { RotateCcw } from "lucide-react";

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-32 px-6 text-center animate-fade-in relative z-[1]">
      <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "oklch(0.513 0.168 17 / 8%)" }}>
        <div className="h-2 w-2 rounded-full" style={{ background: "var(--score-low)" }} />
      </div>
      <h2 className="text-base font-semibold text-foreground">Something went wrong</h2>
      <p className="mt-2 text-[14px] text-foreground/40 max-w-sm leading-relaxed">
        {message}
      </p>
      <button
        onClick={onRetry}
        className="mt-8 inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-[14px] font-medium text-foreground transition-all duration-150 hover:border-foreground/20 active:scale-[0.98]"
        style={{ borderColor: "var(--border2)", background: "var(--s1)" }}
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Try another URL
      </button>
    </div>
  );
}
