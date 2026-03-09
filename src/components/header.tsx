"use client";

import Link from "next/link";

export function Header() {
  return (
    <header className="w-full border-b sticky top-0 z-50 backdrop-blur-md" style={{ borderColor: "var(--border)", background: "oklch(0.924 0.063 295 / 85%)" }}>
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
        </div>
        <div className="flex items-center gap-1.5 text-[10px] border rounded-full px-3 py-1 tracking-wider" style={{ color: "var(--brand)", background: "var(--brand-dim)", borderColor: "var(--brand-glow)" }}>
          <span className="w-[5px] h-[5px] rounded-full" style={{ background: "var(--brand)", animation: "blink-dot 1.8s ease-in-out infinite" }} />
          DIAGNOSTIC ENGINE v3
        </div>
      </nav>
    </header>
  );
}
