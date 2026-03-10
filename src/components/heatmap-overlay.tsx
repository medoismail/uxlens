"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { drawHeatmapOnCanvas } from "@/lib/heatmap-composite";
import type { HeatmapZone } from "@/lib/heatmap";

interface HeatmapOverlayProps {
  screenshotUrl: string;
  heatmapZones: HeatmapZone[];
  pageHeight: number;
  viewportWidth: number;
  heatmapLoading?: boolean;
}

export function HeatmapOverlay({
  screenshotUrl,
  heatmapZones,
  pageHeight,
  viewportWidth,
  heatmapLoading,
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

    const displayW = imgSize.w;
    const displayH = imgSize.h;
    canvas.width = displayW;
    canvas.height = displayH;

    ctx.clearRect(0, 0, displayW, displayH);
    if (!showHeatmap || !heatmapZones.length) return;

    drawHeatmapOnCanvas(ctx, heatmapZones, viewportWidth, pageHeight, displayW, displayH);
  }, [showHeatmap, heatmapZones, viewportWidth, pageHeight, imageLoaded, imgSize]);

  useEffect(() => {
    drawHeatmap();
  }, [drawHeatmap]);

  const hasZones = heatmapZones.length > 0;

  return (
    <div className="space-y-3">
      {/* Header + Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-foreground">
          Page Screenshot & AI Attention Heatmap
        </h3>
        {hasZones && (
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
        )}
      </div>

      {/* Screenshot + overlay */}
      <div
        ref={containerRef}
        className="relative rounded-xl border overflow-hidden"
        style={{ borderColor: "var(--border)", maxHeight: "80vh", overflowY: "auto" }}
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
            opacity: showHeatmap && hasZones ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
        />

        {/* Heatmap loading overlay */}
        {heatmapLoading && !hasZones && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full border"
            style={{
              background: "rgba(0,0,0,0.7)",
              borderColor: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(8px)",
            }}
          >
            <div className="h-3.5 w-3.5 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
            <span className="text-[11px] text-white/80 font-medium">
              AI analyzing visual attention...
            </span>
          </div>
        )}
      </div>

      {/* Legend */}
      {showHeatmap && hasZones && (
        <div className="flex items-center justify-center gap-5 text-[12px] text-foreground/40">
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-[3px]"
              style={{ background: "rgba(255, 59, 48, 0.75)", border: "1px solid rgba(255, 59, 48, 0.9)" }}
            />
            <span>High attention</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-[3px]"
              style={{ background: "rgba(255, 179, 0, 0.65)", border: "1px solid rgba(255, 179, 0, 0.8)" }}
            />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-[3px]"
              style={{ background: "rgba(50, 173, 230, 0.55)", border: "1px solid rgba(50, 173, 230, 0.7)" }}
            />
            <span>Low</span>
          </div>
        </div>
      )}
    </div>
  );
}
