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
      <div className="focus-glow relative flex items-center rounded-2xl border border-border/60 bg-background shadow-elevation-1 transition-all duration-200">
        <input
          type="text"
          placeholder="https://your-landing-page.com"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) setError("");
          }}
          disabled={isLoading}
          className="h-[52px] flex-1 rounded-2xl bg-transparent px-5 text-[15px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-50"
        />
        <div className="pr-1.5">
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-foreground px-5 text-[13px] font-medium text-background transition-all duration-150 hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Analyze
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-2.5 text-[13px] text-destructive animate-fade-in pl-1">{error}</p>
      )}

      <p className="mt-4 text-[12px] text-muted-foreground/70 text-center">
        Free &middot; No signup &middot; Takes 15 seconds
      </p>
    </form>
  );
}
