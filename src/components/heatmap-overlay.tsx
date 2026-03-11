"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { drawHeatmapOnCanvas } from "@/lib/heatmap-composite";
import { normalizeHeatmapZones } from "@/lib/heatmap";
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
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });

  // Normalize zones to handle both legacy (bounding-box) and new (point-based) formats
  const normalizedZones = useCallback(() => {
    if (!heatmapZones.length) return [];
    return normalizeHeatmapZones(heatmapZones as unknown as Record<string, unknown>[]);
  }, [heatmapZones]);

  const drawHeatmap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded || imgNatural.w === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use the image's natural (pixel) dimensions for the canvas buffer.
    // CSS w-full/h-full will scale the canvas to match the displayed image size.
    canvas.width = imgNatural.w;
    canvas.height = imgNatural.h;

    ctx.clearRect(0, 0, imgNatural.w, imgNatural.h);

    const zones = normalizedZones();
    if (!showHeatmap || !zones.length) return;

    drawHeatmapOnCanvas(ctx, zones, viewportWidth, pageHeight, imgNatural.w, imgNatural.h);
  }, [showHeatmap, normalizedZones, viewportWidth, pageHeight, imageLoaded, imgNatural]);

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

      {/* Screenshot + overlay — outer div scrolls, inner div holds image + canvas */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: "var(--border)", maxHeight: "80vh", overflowY: "auto" }}
      >
        {/* Inner wrapper: relative so canvas covers the full image, not just visible area */}
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={screenshotUrl}
            alt="Page screenshot"
            className="w-full block"
            onLoad={(e) => {
              const img = e.target as HTMLImageElement;
              setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
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
        </div>

        {/* Heatmap loading overlay */}
        {heatmapLoading && !hasZones && (
          <div className="sticky bottom-4 left-1/2 -translate-x-1/2 w-fit mx-auto flex items-center gap-2 px-4 py-2 rounded-full border z-10"
            style={{
              background: "rgba(0,0,0,0.7)",
              borderColor: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(8px)",
            }}
          >
            <div className="h-3.5 w-3.5 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
            <span className="text-[12px] text-white/80 font-medium">
              AI analyzing visual attention...
            </span>
          </div>
        )}
      </div>

      {/* Gradient legend bar */}
      {showHeatmap && hasZones && (
        <div className="flex items-center justify-center gap-3">
          <span className="text-[12px] text-foreground/55 font-medium">Low</span>
          <div
            className="h-2.5 rounded-full"
            style={{
              width: 160,
              background: "linear-gradient(to right, rgba(255,255,0,0.7), rgba(255,165,0,0.8), rgba(255,50,0,0.9))",
            }}
          />
          <span className="text-[12px] text-foreground/55 font-medium">High</span>
        </div>
      )}
    </div>
  );
}
