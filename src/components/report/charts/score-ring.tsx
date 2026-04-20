"use client";

import { motion, useSpring, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";
import { scoreColor } from "../utils";

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  delay?: number;
}

export function ScoreRing({ score, size = 64, strokeWidth = 7, label, sublabel, delay = 0.2 }: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = scoreColor(score);

  const motionScore = useMotionValue(0);
  const spring = useSpring(motionScore, { stiffness: 100, damping: 30, restDelta: 0.5 });
  const displayScore = useTransform(spring, (v) => Math.round(v));

  useEffect(() => {
    const timer = setTimeout(() => motionScore.set(score), delay * 1000);
    return () => clearTimeout(timer);
  }, [score, delay, motionScore]);

  const dashOffset = useTransform(spring, (v) => circumference - (v / 100) * circumference);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="-rotate-90 w-full h-full" viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            style={{ stroke: "var(--s3)" }}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ stroke: color, strokeDashoffset: dashOffset }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="font-bold tabular-nums leading-none"
            style={{ color, fontSize: size * 0.28 }}
          >
            {displayScore}
          </motion.span>
        </div>
      </div>
      {label && <span className="text-[12px] text-foreground/50 font-medium mt-1.5">{label}</span>}
      {sublabel && <span className="text-[11px] text-foreground/35 mt-0.5">{sublabel}</span>}
    </div>
  );
}
