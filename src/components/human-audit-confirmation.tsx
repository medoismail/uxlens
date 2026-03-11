"use client";

import { CheckCircle2, RotateCcw, Mail } from "lucide-react";

interface HumanAuditConfirmationProps {
  url: string;
  email: string;
  onReset: () => void;
}

export function HumanAuditConfirmation({ url, email, onReset }: HumanAuditConfirmationProps) {
  let domain = url;
  try { domain = new URL(url).hostname.replace("www.", ""); } catch {}

  return (
    <div className="flex flex-col items-center justify-center py-32 px-6 text-center animate-fade-in relative z-[1]">
      <div className="flex h-12 w-12 items-center justify-center rounded-full mb-6" style={{ background: "oklch(0.52 0.14 155 / 10%)" }}>
        <CheckCircle2 className="h-6 w-6" style={{ color: "var(--score-high)" }} />
      </div>

      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        Your human audit has been requested
      </h2>

      <p className="mt-3 text-[14px] text-foreground/40 max-w-sm leading-relaxed">
        A senior UX professional will review <span className="font-medium text-foreground">{domain}</span> and
        send a detailed report to your email.
      </p>

      <div className="mt-6 flex items-center gap-2.5 rounded-xl border px-5 py-3" style={{ borderColor: "var(--border2)", background: "var(--s1)" }}>
        <Mail className="h-4 w-4 text-foreground/30" />
        <span className="text-[13px] text-foreground font-medium">{email}</span>
      </div>

      <p className="mt-4 text-[12px] text-foreground/30 font-mono">
        Expect your report within 2–3 business days
      </p>

      <button
        onClick={onReset}
        className="mt-10 inline-flex items-center gap-2 rounded-lg border px-6 py-2.5 text-[13px] font-medium text-foreground transition-all duration-150 hover:border-foreground/20 active:scale-[0.98]"
        style={{ borderColor: "var(--border2)", background: "var(--s1)" }}
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Back to home
      </button>
    </div>
  );
}
