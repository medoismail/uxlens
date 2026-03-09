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
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });

  const drawHeatmap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const displayWidth = canvas.width;
    const scaleX = displayWidth / viewportWidth;
    const displayHeight = pageHeight * scaleX;

    canvas.height = displayHeight;

    // Clear
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    if (!showHeatmap) return;

    // Draw heatmap zones as radial gradients
    for (const zone of heatmapZones) {
      const cx = (zone.x + zone.width / 2) * scaleX;
      const cy = (zone.y + zone.height / 2) * scaleX;
      const radius = Math.max(zone.width, zone.height) * scaleX * 0.8;

      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);

      // Color based on intensity
      const alpha = zone.intensity * 0.6;
      if (zone.intensity > 0.7) {
        gradient.addColorStop(0, `rgba(255, 0, 0, ${alpha})`);
        gradient.addColorStop(0.4, `rgba(255, 80, 0, ${alpha * 0.7})`);
        gradient.addColorStop(1, `rgba(255, 165, 0, 0)`);
      } else if (zone.intensity > 0.4) {
        gradient.addColorStop(0, `rgba(255, 165, 0, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(255, 255, 0, ${alpha * 0.5})`);
        gradient.addColorStop(1, `rgba(255, 255, 0, 0)`);
      } else {
        gradient.addColorStop(0, `rgba(0, 255, 0, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(0, 200, 100, ${alpha * 0.4})`);
        gradient.addColorStop(1, `rgba(0, 150, 100, 0)`);
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, displayWidth, displayHeight);
    }
  }, [showHeatmap, heatmapZones, viewportWidth, pageHeight, imageLoaded]);

  useEffect(() => {
    drawHeatmap();
  }, [drawHeatmap]);

  return (
    <div className="space-y-3">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-[14px] font-semibold text-foreground">
            Page Screenshot & Attention Heatmap
          </h3>
        </div>
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
        style={{ borderColor: "var(--border)", maxHeight: "600px", overflowY: "auto" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={screenshotUrl}
          alt="Page screenshot"
          className="w-full block"
          onLoad={(e) => {
            const img = e.target as HTMLImageElement;
            setImgDimensions({ width: img.naturalWidth, height: img.naturalHeight });
            setImageLoaded(true);
            if (canvasRef.current) {
              canvasRef.current.width = img.clientWidth;
              canvasRef.current.height = img.clientHeight;
            }
          }}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full pointer-events-none"
          style={{ mixBlendMode: "multiply", opacity: showHeatmap ? 1 : 0 }}
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
