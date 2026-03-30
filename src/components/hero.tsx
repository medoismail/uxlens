"use client";

import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UrlForm } from "@/components/url-form";
import { HeroIcons } from "@/components/hero-icons";

const HeroBackground = lazy(() =>
  import("@/components/hero-background").then((m) => ({ default: m.HeroBackground }))
);

const ROTATING_WORDS = [
  "in 30 seconds",
  "with AI precision",
  "before users leave",
  "at every layer",
];

const ROTATE_INTERVAL = 2800;

function RotatingText() {
  const [index, setIndex] = useState(0);

  const advance = useCallback(() => {
    setIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(advance, ROTATE_INTERVAL);
    return () => clearInterval(timer);
  }, [advance]);

  return (
    <span className="block overflow-hidden" style={{ height: "1.2em" }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ y: 30, opacity: 0, filter: "blur(4px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: -30, opacity: 0, filter: "blur(4px)" }}
          transition={{
            y: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
            filter: { duration: 0.2 },
          }}
          style={{ display: "block", color: "var(--brand)" }}
        >
          {ROTATING_WORDS[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

const BADGES = [
  "10 LAYERS",
  "HEURISTIC EVAL",
  "ATTENTION HEATMAP",
  "PERSONA FEEDBACK",
  "AI CHAT",
  "PDF EXPORT",
];

interface HeroProps {
  onSubmit: (url: string) => void;
  onScreenshotSubmit?: (file: File) => void;
  isLoading: boolean;
}

export function Hero({ onSubmit, onScreenshotSubmit, isLoading }: HeroProps) {
  return (
    <section className="relative flex flex-col items-center text-center px-6 pt-10 pb-20">
      {/* Three.js animated background */}
      <Suspense fallback={null}>
        <HeroBackground />
      </Suspense>

      {/* Icons illustration — fade + scale in */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: 0.6,
          scale: { type: "spring", visualDuration: 0.5, bounce: 0.3 },
        }}
        className="mb-7 relative z-[1]"
      >
        <HeroIcons />
      </motion.div>

      {/* Headline — spring slide up */}
      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          delay: 0.1,
          y: { type: "spring", stiffness: 200, damping: 24 },
        }}
        className="text-[clamp(28px,4.5vw,46px)] font-bold tracking-[-1.5px] leading-[1.15] max-w-[780px] text-foreground relative z-[1]"
      >
        Find What&apos;s Killing
        <br />
        Your Conversions
        <RotatingText />
      </motion.h1>

      {/* Subheadline — staggered after headline */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        className="mt-5 text-[14px] leading-relaxed text-foreground/50 max-w-[540px] relative z-[1]"
      >
        Paste any URL or drop a screenshot. Get a 10-layer AI audit with heuristic evaluation,
        attention heatmaps, persona feedback, and conversion killers — in under 30 seconds.
      </motion.p>

      {/* Form — smooth entrance with spring */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.5,
          delay: 0.35,
          scale: { type: "spring", stiffness: 200, damping: 20 },
        }}
        className="mt-12 w-full max-w-lg relative z-[1]"
      >
        <UrlForm onSubmit={onSubmit} onScreenshotSubmit={onScreenshotSubmit} isLoading={isLoading} />
      </motion.div>

      {/* Algo badges — staggered entrance */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.06, delayChildren: 0.55 },
          },
        }}
        className="mt-7 flex flex-wrap justify-center items-center gap-x-1.5 gap-y-1 relative z-[1]"
      >
        {BADGES.map((badge, i) => (
          <motion.span
            key={badge}
            variants={{
              hidden: { opacity: 0, y: 6 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  y: { type: "spring", stiffness: 300, damping: 24 },
                },
              },
            }}
            className="flex items-center gap-1.5 text-[11px] font-mono text-foreground/25 tracking-wide cursor-default select-none"
          >
            {i > 0 && <span className="text-foreground/15">·</span>}
            {badge}
          </motion.span>
        ))}
      </motion.div>
    </section>
  );
}
