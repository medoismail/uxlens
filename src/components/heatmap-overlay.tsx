"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { HeatmapZone } from "@/lib/heatmap";

interface HeatmapOverlayProps {
  screenshotUrl: string;
  heatmapZones: HeatmapZone[];
  pageHeight: number;
  viewportWidth: number;
}

export function HeatmapOverlay({
  screenshotUrl,
  heatmapZones,
  pageHeight,
  viewportWidth,
}: HeatmapOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });

  const drawHeatmap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded || imgSize.w === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas matches actual rendered image size
    const displayW = imgSize.w;
    const displayH = imgSize.h;
    canvas.width = displayW;
    canvas.height = displayH;

    ctx.clearRect(0, 0, displayW, displayH);
    if (!showHeatmap || !heatmapZones.length) return;

    // Scale: map original viewport coords → displayed image coords
    const scaleX = displayW / viewportWidth;
    const scaleY = displayH / pageHeight;

    // Use "lighter" blend mode so overlapping zones blend nicely
    ctx.globalCompositeOperation = "lighter";

    for (const zone of heatmapZones) {
      const cx = (zone.x + zone.width / 2) * scaleX;
      const cy = (zone.y + zone.height / 2) * scaleY;
      const radius = Math.max(zone.width * scaleX, zone.height * scaleY) * 0.9;

      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      const intensity = zone.intensity;
      const alpha = intensity * 0.45;

      if (intensity > 0.7) {
        // Hot — red/orange
        gradient.addColorStop(0, `rgba(255, 30, 0, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(255, 100, 0, ${alpha * 0.5})`);
        gradient.addColorStop(1, "rgba(255, 100, 0, 0)");
      } else if (intensity > 0.4) {
        // Warm — orange/yellow
        gradient.addColorStop(0, `rgba(255, 170, 0, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(255, 220, 50, ${alpha * 0.4})`);
        gradient.addColorStop(1, "rgba(255, 220, 50, 0)");
      } else {
        // Cool — green/teal
        gradient.addColorStop(0, `rgba(50, 200, 80, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(50, 180, 100, ${alpha * 0.3})`);
        gradient.addColorStop(1, "rgba(50, 180, 100, 0)");
      }

      // KEY FIX: Only fill the zone's bounding area, not the entire canvas
      ctx.fillStyle = gradient;
      const x0 = Math.max(0, cx - radius);
      const y0 = Math.max(0, cy - radius);
      const x1 = Math.min(displayW, cx + radius);
      const y1 = Math.min(displayH, cy + radius);
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    }

    ctx.globalCompositeOperation = "source-over";
  }, [showHeatmap, heatmapZones, viewportWidth, pageHeight, imageLoaded, imgSize]);

  useEffect(() => {
    drawHeatmap();
  }, [drawHeatmap]);

  return (
    <div className="space-y-3">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-foreground">
          Page Screenshot & Attention Heatmap
        </h3>
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className="text-[12px] font-medium px-3 py-1.5 rounded-lg border transition-all duration-150"
          style={{
            borderColor: showHeatmap ? "var(--brand-glow)" : "var(--border)",
            color: showHeatmap ? "var(--brand)" : "var(--foreground)",
            background: showHeatmap ? "var(--brand-dim)" : "transparent",
          }}
        >
          {showHeatmap ? "Hide Heatmap" : "Show Heatmap"}
        </button>
      </div>

      {/* Screenshot + overlay */}
      <div
        ref={containerRef}
        className="relative rounded-xl border overflow-hidden"
        style={{ borderColor: "var(--border)", maxHeight: "700px", overflowY: "auto" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={screenshotUrl}
          alt="Page screenshot"
          className="w-full block"
          onLoad={(e) => {
            const img = e.target as HTMLImageElement;
            setImgSize({ w: img.clientWidth, h: img.clientHeight });
            setImageLoaded(true);
          }}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{
            opacity: showHeatmap ? 0.7 : 0,
            transition: "opacity 0.3s ease",
            mixBlendMode: "multiply",
          }}
        />
      </div>

      {/* Legend */}
      {showHeatmap && (
        <div className="flex items-center justify-center gap-4 text-[12px] text-foreground/40">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <span>High attention</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-orange-400/70" />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
            <span>Low</span>
          </div>
        </div>
      )}
    </div>
  );
}
