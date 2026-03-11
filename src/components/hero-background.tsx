"use client";

/**
 * Soft animated gradient background for the hero section.
 * Pure CSS — no Three.js overhead. Brand purple gradient
 * that gently breathes and shifts.
 * Respects prefers-reduced-motion.
 */
export function HeroBackground() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {/* Primary brand glow — top center */}
      <div
        className="absolute hero-glow-1"
        style={{
          top: "-10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "80%",
          height: "70%",
          background:
            "radial-gradient(ellipse 60% 55% at 50% 40%, oklch(0.504 0.282 276.1 / 6%) 0%, transparent 70%)",
        }}
      />

      {/* Secondary glow — offset right, slower */}
      <div
        className="absolute hero-glow-2"
        style={{
          top: "5%",
          right: "-5%",
          width: "50%",
          height: "60%",
          background:
            "radial-gradient(ellipse 70% 60% at 60% 45%, oklch(0.504 0.282 276.1 / 4%) 0%, oklch(0.6 0.15 280 / 2%) 40%, transparent 70%)",
        }}
      />

      {/* Tertiary glow — offset left */}
      <div
        className="absolute hero-glow-3"
        style={{
          top: "10%",
          left: "-5%",
          width: "45%",
          height: "55%",
          background:
            "radial-gradient(ellipse 65% 55% at 40% 50%, oklch(0.55 0.2 290 / 3.5%) 0%, transparent 65%)",
        }}
      />

      {/* Bottom fade to white/background */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[40%]"
        style={{
          background:
            "linear-gradient(to top, var(--background) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}
