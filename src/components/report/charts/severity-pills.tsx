"use client";

import { motion } from "motion/react";
import { SEVERITY_STYLES } from "../utils";

interface SeverityPillsProps {
  counts: Record<string, number>;
  totalIssues: number;
}

export function SeverityPills({ counts, totalIssues }: SeverityPillsProps) {
  const entries = (Object.entries(counts) as [string, number][]).filter(([, c]) => c > 0);

  return (
    <motion.div
      className="flex items-center gap-2 flex-wrap"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      {entries.map(([sev, count], i) => (
        <motion.span
          key={sev}
          className="flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-md"
          style={SEVERITY_STYLES[sev]}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 + i * 0.06, type: "spring", stiffness: 300, damping: 26 }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "currentColor" }} />
          {count} {sev}
        </motion.span>
      ))}
      <span className="text-[11px] text-foreground/30 ml-auto">{totalIssues} total</span>
    </motion.div>
  );
}
