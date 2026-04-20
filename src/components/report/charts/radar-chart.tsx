"use client";

import { motion } from "motion/react";
import { heuristicColor } from "../utils";
import type { HeuristicScore } from "@/lib/types";

interface RadarChartProps {
  heuristics: HeuristicScore[];
  size?: number;
}

export function RadarChart({ heuristics, size = 240 }: RadarChartProps) {
  const center = size / 2;
  const maxRadius = size / 2 - 30;
  const count = heuristics.length;

  function getPoint(index: number, value: number): [number, number] {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    const r = (value / 10) * maxRadius;
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  }

  const polygonPoints = heuristics.map((h, i) => getPoint(i, h.score).join(",")).join(" ");

  return (
    <div className="flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Subtle grid rings */}
        {[2, 4, 6, 8, 10].map((level) => (
          <polygon
            key={level}
            points={Array.from({ length: count }, (_, i) => getPoint(i, level).join(",")).join(" ")}
            fill="none"
            stroke="var(--border)"
            strokeWidth={level === 10 ? 0.75 : 0.5}
            opacity={0.4}
          />
        ))}

        {/* Axis lines — very subtle */}
        {heuristics.map((_, i) => {
          const [x, y] = getPoint(i, 10);
          return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="var(--border)" strokeWidth={0.5} opacity={0.2} />;
        })}

        {/* Data polygon — soft fill, thin stroke */}
        <motion.polygon
          points={polygonPoints}
          fill="oklch(0.504 0.282 276.1 / 8%)"
          stroke="var(--brand)"
          strokeWidth={1.5}
          strokeLinejoin="round"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 }}
          style={{ transformOrigin: "center" }}
        />

        {/* Data points — small, clean */}
        {heuristics.map((h, i) => {
          const [x, y] = getPoint(i, h.score);
          return (
            <motion.circle
              key={h.id}
              cx={x}
              cy={y}
              r={2.5}
              fill={heuristicColor(h.score)}
              stroke="var(--s1)"
              strokeWidth={1.5}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.03, duration: 0.2 }}
            />
          );
        })}

        {/* Labels — clean, readable */}
        {heuristics.map((h, i) => {
          const [x, y] = getPoint(i, 11.8);
          const shortName = h.name.length > 14 ? h.name.slice(0, 12) + ".." : h.name;
          return (
            <text
              key={`label-${h.id}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[8px] fill-foreground/25"
            >
              {shortName}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
