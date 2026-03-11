"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { urlSchema } from "@/lib/schemas";

interface UrlFormProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export function UrlForm({ onSubmit, isLoading }: UrlFormProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const result = urlSchema.safeParse(url);
    if (!result.success) {
      setError(result.error.issues[0]?.message || "Invalid URL");
      return;
    }
    onSubmit(url.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="focus-glow relative overflow-hidden rounded-[14px] border transition-all duration-300" style={{ background: "var(--s1)", borderColor: "rgba(0,0,0,0.03)" }}>
        {/* Browser dots */}
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b" style={{ borderColor: "rgba(0,0,0,0.03)" }}>
          <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#ff5f57" }} />
          <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#ffbd2e" }} />
          <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#28c840" }} />
          <div className="flex-1 relative ml-2">
            {/* Fake blinking caret — visible only when idle (not focused, no text) */}
            {!url && !focused && (
              <span
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[1.5px] h-[14px] rounded-full pointer-events-none"
                style={{ background: "var(--foreground)", opacity: 0.35, animation: "caretBlink 1s step-end infinite" }}
              />
            )}
            <input
              type="text"
              placeholder="https://your-landing-page.com"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError("");
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              disabled={isLoading}
              className="w-full bg-transparent text-[12px] font-mono text-foreground/40 placeholder:text-foreground/20 focus:outline-none disabled:opacity-50"
            />
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between px-5 py-3 gap-4" style={{ background: "oklch(0 0 0 / 4%)" }}>
          <p className="text-[10px] font-mono text-foreground/25 tracking-wide hidden sm:block">
            Paste your URL and run the full 10-layer audit
          </p>
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-[13px] font-bold transition-all duration-200 hover:translate-y-[-1px] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none disabled:translate-y-0 disabled:shadow-none shrink-0 sm:ml-auto"
            style={{ background: "var(--brand)", color: "var(--brand-fg)", boxShadow: "none" }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 6px 20px var(--brand-glow)"}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Run Full Audit
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-2.5 text-[12px] text-destructive animate-fade-in pl-1 font-mono">{error}</p>
      )}
    </form>
  );
}
