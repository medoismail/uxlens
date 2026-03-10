"use client";

import { useRef, useEffect, useState } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number; // 0-4 for stagger
  threshold?: number; // 0-1 for IntersectionObserver
}

/**
 * Lightweight scroll-reveal wrapper using IntersectionObserver.
 * Adds the `revealed` class when the element enters the viewport.
 * One-shot — once revealed, stays visible.
 */
export function ScrollReveal({
  children,
  className = "",
  delay,
  threshold = 0.15,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect prefers-reduced-motion
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const delayClass = typeof delay === "number" ? `delay-${delay}` : "";

  return (
    <div
      ref={ref}
      className={`scroll-reveal ${revealed ? "revealed" : ""} ${delayClass} ${className}`}
    >
      {children}
    </div>
  );
}
