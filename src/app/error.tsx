"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center max-w-md">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
          style={{ background: "var(--score-low, #ef4444)15" }}
        >
          <span className="text-2xl">!</span>
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Something went wrong</h1>
        <p className="text-[13px] text-foreground/50 mb-6">
          An unexpected error occurred. Please try again or return to the homepage.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="text-[13px] font-medium px-5 py-2.5 rounded-lg transition-all hover:opacity-80"
            style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
          >
            Try Again
          </button>
          <a
            href="/"
            className="text-[13px] font-medium px-5 py-2.5 rounded-lg border transition-all hover:opacity-80"
            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
