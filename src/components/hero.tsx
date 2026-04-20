"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UrlForm } from "@/components/url-form";
import { HeroIcons } from "@/components/hero-icons";
import { Sparkles, Layers, Eye, MessageSquare, FileText, BarChart3 } from "lucide-react";

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD
 *
 *    0ms   page mounts, gradient mesh fades in
 *  200ms   eyebrow badge slides up + fades in
 *  350ms   headline word-by-word reveal, spring physics
 *  600ms   subheadline fades up
 *  800ms   form scales in with spring bounce
 * 1000ms   feature pills stagger in (6 items, 60ms apart)
 * 2800ms   rotating text begins cycling (every 2.8s)
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  mesh:        0,       // gradient mesh background
  eyebrow:     200,     // "AI-Powered UX Audit" badge
  headline:    350,     // main heading
  subheadline: 600,     // description text
  form:        800,     // URL input + CTA
  pills:       1000,    // feature pills stagger start
};

const HEADLINE_SPRING = {
  type: "spring" as const,
  stiffness: 180,
  damping: 22,
};

const FORM_SPRING = {
  type: "spring" as const,
  stiffness: 200,
  damping: 24,
  mass: 0.8,
};

const PILL_SPRING = {
  type: "spring" as const,
  stiffness: 300,
  damping: 26,
};

/* ── Rotating text ── */

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
    <span className="inline-block overflow-hidden align-bottom" style={{ height: "1.15em" }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ y: "100%", opacity: 0, filter: "blur(6px)" }}
          animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
          exit={{ y: "-100%", opacity: 0, filter: "blur(6px)" }}
          transition={{
            y: { type: "spring", stiffness: 260, damping: 28 },
            opacity: { duration: 0.25 },
            filter: { duration: 0.25 },
          }}
          className="block text-glow"
          style={{ color: "var(--brand)" }}
        >
          {ROTATING_WORDS[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* ── Feature pills ── */

const FEATURES = [
  { icon: Layers,         label: "10 Layers" },
  { icon: BarChart3,      label: "Heuristic Eval" },
  { icon: Eye,            label: "AI Heatmap" },
  { icon: Sparkles,       label: "Persona Feedback" },
  { icon: MessageSquare,  label: "AI Chat" },
  { icon: FileText,       label: "PDF Export" },
];

/* ── Hero ── */

interface HeroProps {
  onSubmit: (url: string) => void;
  onScreenshotSubmit?: (file: File) => void;
  isLoading: boolean;
}

export function Hero({ onSubmit, onScreenshotSubmit, isLoading }: HeroProps) {
  /* Interactive dot grid — dots near mouse glow sharp white */
  useEffect(() => {
    const canvas = document.getElementById("heroDotCanvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const GRID = 24;
    const RADIUS = 80; /* subtle glow radius */
    let mx = -999, my = -999;
    let raf = 0;

    function resize() {
      const section = canvas!.parentElement;
      if (!section) return;
      canvas!.width = section.offsetWidth;
      canvas!.height = section.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const section = canvas!.parentElement;
    section?.addEventListener("mousemove", (e) => {
      const rect = section.getBoundingClientRect();
      mx = e.clientX - rect.left;
      my = e.clientY - rect.top;
    });
    section?.addEventListener("mouseleave", () => { mx = -999; my = -999; });

    function draw() {
      const w = canvas!.width, h = canvas!.height;
      ctx!.clearRect(0, 0, w, h);

      if (mx < -900) { raf = requestAnimationFrame(draw); return; }

      /* Draw glowing dots near mouse */
      const cols = Math.ceil(w / GRID);
      const rows = Math.ceil(h / GRID);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * GRID;
          const y = r * GRID;
          const dist = Math.hypot(x - mx, y - my);
          if (dist > RADIUS) continue;

          const intensity = 1 - dist / RADIUS;
          const alpha = intensity * intensity * 0.15;
          const size = 0.8;

          ctx!.beginPath();
          ctx!.arc(x, y, size, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx!.fill();
        }
      }

      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <section className="relative flex flex-col items-center text-center px-6 pb-24 -mt-14" style={{ paddingTop: "calc(56px + 48px)" }}>
      {/* Gradient mesh background */}
      <div className="hero-mesh" aria-hidden="true" />

      {/* Bottom fade — blends hero into page */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-[1]"
        style={{ background: "linear-gradient(to bottom, transparent, var(--background))" }}
        aria-hidden="true"
      />

      {/* Dot grid overlay — fades out at bottom */}
      <div
        className="absolute inset-0 dot-grid opacity-50 pointer-events-none"
        aria-hidden="true"
        style={{ maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 100%)" }}
      />
      <canvas
        id="heroDotCanvas"
        className="absolute inset-0 pointer-events-none z-[1]"
        aria-hidden="true"
        style={{ maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 100%)" }}
      />

      {/* Icons illustration — fade + scale in */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: 0.6,
          scale: { type: "spring", visualDuration: 0.5, bounce: 0.3 },
        }}
        className="mb-5 relative z-[1]"
      >
        <HeroIcons />
      </motion.div>

      {/* Headline — spring slide up */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          delay: TIMING.headline / 1000,
          y: HEADLINE_SPRING,
        }}
        className="text-[clamp(32px,5vw,54px)] font-bold tracking-[-2px] leading-[1.1] max-w-[720px] text-foreground relative z-[1]"
      >
        Find What&apos;s Killing
        <br />
        Your Conversions
        <br />
        <RotatingText />
      </motion.h1>

      {/* Subheadline */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: TIMING.subheadline / 1000, ease: "easeOut" }}
        className="mt-5 text-[16px] leading-relaxed text-foreground/55 max-w-[540px] relative z-[1]"
      >
        Paste any URL or drop a screenshot. Get a 10-layer AI audit with heuristic evaluation,
        attention heatmaps, and conversion killers — in under 30 seconds.
      </motion.p>

      {/* Form — smooth entrance with spring */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.5,
          delay: TIMING.form / 1000,
          scale: FORM_SPRING,
        }}
        className="mt-12 w-full max-w-lg relative z-[1]"
      >
        <UrlForm onSubmit={onSubmit} onScreenshotSubmit={onScreenshotSubmit} isLoading={isLoading} />
      </motion.div>

      {/* Feature pills — staggered entrance */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.06, delayChildren: TIMING.pills / 1000 },
          },
        }}
        className="mt-8 flex flex-wrap justify-center items-center gap-2 relative z-[1]"
      >
        {FEATURES.map((feat) => (
          <motion.span
            key={feat.label}
            variants={{
              hidden: { opacity: 0, y: 8, scale: 0.9 },
              visible: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: {
                  y: PILL_SPRING,
                  scale: PILL_SPRING,
                },
              },
            }}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-foreground/45 tracking-wide px-3 py-1.5 rounded-full border cursor-default select-none transition-all hover:text-foreground/65 hover:border-foreground/12 hover:bg-foreground/[0.03] hover:backdrop-blur-sm"
            style={{ borderColor: "var(--border)" }}
          >
            <feat.icon className="h-3 w-3" style={{ color: "var(--brand)", opacity: 0.7 }} />
            {feat.label}
          </motion.span>
        ))}
      </motion.div>
    </section>
  );
}
