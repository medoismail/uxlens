"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

interface InsightCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  color?: string;
  index?: number;
}

export function InsightCard({ icon, label, value, color = "var(--foreground)", index = 0 }: InsightCardProps) {
  return (
    <motion.div
      className="rounded-2xl p-5"
      style={{ background: "var(--s2)" }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 + 0.1, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-foreground/20">{icon}</span>
        <span className="text-[10px] font-semibold text-foreground/15 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-[13px] text-foreground/45 leading-[1.6] line-clamp-3" style={{ textWrap: "pretty" }}>{value}</p>
    </motion.div>
  );
}
