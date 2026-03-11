"use client";

import { useState } from "react";
import { ArrowRight, Loader2, User } from "lucide-react";
import { urlSchema } from "@/lib/schemas";

interface HumanAuditFormProps {
  onRequested: (url: string, email: string) => void;
}

export function HumanAuditForm({ onRequested }: HumanAuditFormProps) {
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const urlResult = urlSchema.safeParse(url);
    if (!urlResult.success) {
      setError(urlResult.error.issues[0]?.message || "Invalid URL");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setSending(true);
    try {
      await fetch("/api/human-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), email: email.trim() }),
      });
      onRequested(url.trim(), email.trim());
    } catch {
      setError("Failed to send request. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="focus-glow rounded-xl border border-border/50 bg-background shadow-elevation-1 transition-all duration-200">
        <input
          type="text"
          placeholder="https://your-landing-page.com"
          value={url}
          onChange={(e) => { setUrl(e.target.value); if (error) setError(""); }}
          className="h-11 w-full rounded-t-xl bg-transparent px-4 text-[14px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none border-b border-border/30"
        />
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
          className="h-11 w-full rounded-b-xl bg-transparent px-4 text-[14px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
        />
      </div>

      {error && (
        <p className="text-[12px] text-destructive animate-fade-in pl-1">{error}</p>
      )}

      <button
        type="submit"
        disabled={!url.trim() || !email.trim() || sending}
        className="inline-flex w-full h-11 items-center justify-center gap-2 rounded-xl bg-foreground px-5 text-[14px] font-medium text-background transition-all duration-150 hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
      >
        {sending ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending...</>
        ) : (
          <><User className="h-3.5 w-3.5" /> Request Human Audit <ArrowRight className="h-3.5 w-3.5" /></>
        )}
      </button>
    </form>
  );
}
