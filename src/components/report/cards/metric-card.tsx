"use client";

import { motion, useSpring, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";

interface MetricCardProps {
  label: string;
  value: number;
  suffix?: string;
  color: string;
  delay?: number;
}

export function MetricCard({ label, value, suffix = "", color, delay = 0.1 }: MetricCardProps) {
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 100, damping: 30, restDelta: 0.5 });
  const display = useTransform(spring, (v) => Math.round(v));

  useEffect(() => {
    const timer = setTimeout(() => motionVal.set(value), delay * 1000);
    return () => clearTimeout(timer);
  }, [value, delay, motionVal]);

  return (
    <motion.div
      className="rounded-xl shadow-elevation-1 p-4 flex flex-col items-center justify-center text-center"
      style={{ background: "var(--s1)" }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 180, damping: 22 }}
      whileHover={{ y: -1 }}
    >
      <div className="flex items-baseline gap-0.5">
        <motion.span className="text-[20px] font-bold tabular-nums" style={{ color }}>
          {display}
        </motion.span>
        {suffix && <span className="text-[11px] font-medium text-foreground/35">{suffix}</span>}
      </div>
      <span className="text-[11px] text-foreground/50 font-medium mt-1">{label}</span>
    </motion.div>
  );
}

/* Simple text metric variant */
export function MetricCardText({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <motion.div
      className="rounded-xl shadow-elevation-1 p-4 flex flex-col items-center justify-center text-center"
      style={{ background: "var(--s1)" }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 180, damping: 22 }}
      whileHover={{ y: -1 }}
    >
      <span className="text-[18px] font-bold mb-0.5" style={{ color }}>{value}</span>
      <span className="text-[11px] text-foreground/50 font-medium">{label}</span>
    </motion.div>
  );
}
