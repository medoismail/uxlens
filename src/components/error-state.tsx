"use client";

import { RotateCcw } from "lucide-react";

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-32 px-6 text-center animate-fade-in">
      <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/8">
        <div className="h-2 w-2 rounded-full bg-destructive" />
      </div>
      <h2 className="text-base font-semibold text-foreground">Something went wrong</h2>
      <p className="mt-2 text-[13px] text-muted-foreground max-w-sm leading-relaxed">
        {message}
      </p>
      <button
        onClick={onRetry}
        className="mt-8 inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background px-5 py-2.5 text-[13px] font-medium text-foreground shadow-elevation-1 transition-all duration-150 hover:shadow-elevation-2 hover:border-border active:scale-[0.98]"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Try another URL
      </button>
    </div>
  );
}
