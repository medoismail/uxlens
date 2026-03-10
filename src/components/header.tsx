"use client";

import Link from "next/link";
import { Show, UserButton, SignInButton } from "@clerk/nextjs";
import { useSubscription } from "@/hooks/use-subscription";

const PLAN_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  free: { label: "Free", color: "var(--foreground)", bg: "var(--s2)", border: "var(--border)" },
  starter: { label: "Starter", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  pro: { label: "Pro", color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd" },
  agency: { label: "Agency", color: "#db2777", bg: "#fdf2f8", border: "#f9a8d4" },
};

function PlanBadge() {
  const { plan, isVerifying } = useSubscription();

  if (isVerifying) return null;

  const config = PLAN_LABELS[plan] || PLAN_LABELS.free;

  return (
    <Link
      href={plan === "free" ? "/pricing" : "/dashboard"}
      className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border transition-all hover:opacity-80"
      style={{
        color: config.color,
        background: config.bg,
        borderColor: config.border,
      }}
    >
      {config.label}
    </Link>
  );
}

export function Header() {
  return (
    <>
      <header className="w-full border-b sticky top-0 z-50 backdrop-blur-md" style={{ borderColor: "var(--border)", background: "oklch(1 0 0 / 85%)" }}>
        <nav aria-label="Main navigation" className="mx-auto flex h-14 max-w-[960px] items-center justify-between px-7">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2.5 transition-opacity hover:opacity-70"
              aria-label="UXLens — Home"
            >
              <div className="w-[34px] h-[34px] rounded-[7px] grid place-items-center text-[13px] font-extrabold" style={{ background: "var(--brand)", color: "var(--brand-fg)" }}>
                UX
              </div>
              <span className="text-[18px] font-bold tracking-tight">
                UX<span style={{ color: "var(--brand)" }}>Lens</span>
              </span>
            </Link>
            <Link
              href="/pricing"
              className="text-[12px] font-medium text-foreground/40 hover:text-foreground/70 transition-colors duration-150"
            >
              Pricing
            </Link>
            <Show when="signed-in">
              <Link
                href="/dashboard"
                className="text-[12px] font-medium text-foreground/40 hover:text-foreground/70 transition-colors duration-150"
              >
                Dashboard
              </Link>
            </Show>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-[12px] border rounded-full px-3 py-1 tracking-wider" style={{ color: "var(--brand)", background: "var(--brand-dim)", borderColor: "var(--brand-glow)" }}>
              <span className="w-[5px] h-[5px] rounded-full" style={{ background: "var(--brand)", animation: "blink-dot 1.8s ease-in-out infinite" }} />
              DIAGNOSTIC ENGINE v4
            </div>

            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="text-[12px] font-medium px-3.5 py-1.5 rounded-lg border transition-all duration-150 hover:opacity-80" style={{ borderColor: "var(--brand-glow)", color: "var(--brand)", background: "var(--brand-dim)" }}>
                  Sign In
                </button>
              </SignInButton>
            </Show>

            <Show when="signed-in">
              <PlanBadge />
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-[32px] h-[32px]",
                  },
                }}
              />
            </Show>
          </div>
        </nav>

        {/* Beta development banner */}
        <div
          className="w-full border-t text-center py-2 px-4"
          style={{
            borderColor: "var(--border)",
            background: "linear-gradient(90deg, var(--brand-dim), oklch(0.97 0.01 290), var(--brand-dim))",
          }}
        >
          <p className="text-[11px] text-foreground/50 leading-relaxed max-w-[700px] mx-auto">
            <span className="font-semibold" style={{ color: "var(--brand)" }}>Beta</span>
            {" — "}This product is under active development. Plans are not active yet, but you can test it for free with the free plan limitations.
            {" "}Need Pro access?{" "}
            <a
              href="mailto:hi@medoismail.design"
              className="font-medium underline underline-offset-2 transition-colors hover:opacity-70"
              style={{ color: "var(--brand)" }}
            >
              hi@medoismail.design
            </a>
          </p>
        </div>
      </header>
    </>
  );
}
