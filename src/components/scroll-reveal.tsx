"use client";

import { motion, type Variants } from "motion/react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
  /** Direction the element slides from. Default: "up" */
  direction?: "up" | "down" | "left" | "right";
}

const directionOffsets = {
  up: { x: 0, y: 20 },
  down: { x: 0, y: -20 },
  left: { x: 20, y: 0 },
  right: { x: -20, y: 0 },
};

/**
 * Scroll-reveal wrapper using motion's whileInView.
 * - Spring-based with subtle blur for polish
 * - Respects prefers-reduced-motion via motion's built-in support
 * - One-shot — once revealed, stays visible (viewport.once)
 */
export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  threshold = 0.15,
  direction = "up",
}: ScrollRevealProps) {
  const offset = directionOffsets[direction];
  const delaySeconds = delay * 0.08;

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: offset.x,
        y: offset.y,
        filter: "blur(4px)",
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
        filter: "blur(0px)",
      }}
      viewport={{ once: true, amount: threshold }}
      transition={{
        duration: 0.5,
        delay: delaySeconds,
        x: { type: "spring", stiffness: 200, damping: 24, delay: delaySeconds },
        y: { type: "spring", stiffness: 200, damping: 24, delay: delaySeconds },
        filter: { duration: 0.3, delay: delaySeconds },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
