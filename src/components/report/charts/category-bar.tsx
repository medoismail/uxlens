"use client";

import { motion } from "motion/react";
import { scoreColor } from "../utils";

interface CategoryBarProps {
  label: string;
  score: number;
  benchmark?: number;
  index?: number;
}

export function CategoryBar({ label, score, benchmark, index = 0 }: CategoryBarProps) {
  const color = scoreColor(score);
  const delta = benchmark != null ? score - benchmark : null;

  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[11px] text-foreground/35 w-[90px] shrink-0 truncate">{label}</span>
      <div className="flex-1 h-[4px] rounded-full overflow-hidden relative" style={{ background: "var(--s3)" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: "0%" }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: index * 0.06 + 0.1 }}
        />
        {benchmark != null && (
          <div
            className="absolute top-[-2px] w-px h-[8px] rounded-full"
            style={{ left: `${benchmark}%`, background: "var(--foreground)", opacity: 0.15 }}
            title={`Industry avg: ${benchmark}`}
          />
        )}
      </div>
      <span className="text-[11px] font-semibold font-mono tabular-nums w-7 text-right" style={{ color }}>{score}</span>
      {delta != null && (
        <span
          className="text-[10px] font-mono tabular-nums w-7 text-right"
          style={{ color: delta >= 0 ? "var(--score-high)" : "var(--score-low)", opacity: 0.6 }}
        >
          {delta >= 0 ? "+" : ""}{delta}
        </span>
      )}
    </div>
  );
}
