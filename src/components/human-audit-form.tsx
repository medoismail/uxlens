"use client";

import { useState } from "react";
import { ArrowRight, User } from "lucide-react";
import { urlSchema } from "@/lib/schemas";

interface HumanAuditFormProps {
  onRequested: (url: string, email: string) => void;
}

export function HumanAuditForm({ onRequested }: HumanAuditFormProps) {
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
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

    // Open LemonSqueezy checkout
    const baseUrl = process.env.NEXT_PUBLIC_LS_CHECKOUT_HUMAN_AUDIT || "#";
    if (baseUrl !== "#") {
      const checkoutUrl = new URL(baseUrl);
      checkoutUrl.searchParams.set("checkout[email]", email);
      checkoutUrl.searchParams.set("checkout[custom][url]", url.trim());

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      if (win.LemonSqueezy?.Url?.Open) {
        win.LemonSqueezy.Url.Open(checkoutUrl.toString());
      } else {
        window.open(checkoutUrl.toString(), "_blank");
      }
    }

    // Trigger confirmation regardless (user completes payment externally)
    onRequested(url.trim(), email.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="focus-glow rounded-xl border border-border/50 bg-background shadow-elevation-1 transition-all duration-200">
        <input
          type="text"
          placeholder="https://your-landing-page.com"
          value={url}
          onChange={(e) => { setUrl(e.target.value); if (error) setError(""); }}
          className="h-11 w-full rounded-t-xl bg-transparent px-4 text-[16px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none border-b border-border/30"
        />
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
          className="h-11 w-full rounded-b-xl bg-transparent px-4 text-[16px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
        />
      </div>

      {error && (
        <p className="text-[16px] text-destructive animate-fade-in pl-1">{error}</p>
      )}

      <button
        type="submit"
        disabled={!url.trim() || !email.trim()}
        className="inline-flex w-full h-11 items-center justify-center gap-2 rounded-xl bg-foreground px-5 text-[16px] font-medium text-background transition-all duration-150 hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
      >
        <User className="h-3.5 w-3.5" />
        Request Human Audit
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}
