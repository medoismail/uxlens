"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";

export function Footer() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/views", { method: "POST", signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.count === "number") setCount(d.count);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return (
    <footer
      className="border-t py-6 relative z-[1]"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="max-w-[960px] mx-auto px-7 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand */}
        <span className="text-[11px] text-foreground/20 font-mono">
          UXLens &mdash; 9-Layer Diagnostic Engine
        </span>

        {/* Counter — always show once loaded */}
        {count !== null && (
          <div className="flex items-center gap-1.5 text-[11px] text-foreground/25 font-mono animate-fade-in">
            <Users className="h-3 w-3" />
            <span>
              <AnimatedNumber value={count} /> users
            </span>
          </div>
        )}

        {/* Links */}
        <div className="flex items-center gap-4 text-[11px] text-foreground/25 font-mono">
          <Link href="/" className="hover:text-foreground/40 transition-colors">
            Home
          </Link>
          <Link href="/pricing" className="hover:text-foreground/40 transition-colors">
            Pricing
          </Link>
        </div>
      </div>
    </footer>
  );
}

/* Animated count-up */
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value <= 0) { setDisplay(value); return; }
    const duration = 1200;
    const start = Math.max(0, value - 50);
    const range = value - start;
    const startTime = performance.now();

    let raf: number;
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + range * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{display.toLocaleString()}</>;
}
