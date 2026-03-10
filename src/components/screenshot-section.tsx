"use client";

import { HeatmapOverlay } from "@/components/heatmap-overlay";
import type { HeatmapZone } from "@/lib/heatmap";

interface ScreenshotSectionProps {
  screenshotUrl: string;
  heatmapZones?: HeatmapZone[];
  pageHeight?: number;
  viewportWidth?: number;
  heatmapLoading?: boolean;
}

export function ScreenshotSection({
  screenshotUrl,
  heatmapZones,
  pageHeight = 3000,
  viewportWidth = 1280,
  heatmapLoading,
}: ScreenshotSectionProps) {
  if (!screenshotUrl) return null;

  return (
    <section
      className="rounded-xl border p-5 mb-4"
      style={{ borderColor: "var(--border)", background: "var(--s1)" }}
    >
      <HeatmapOverlay
        screenshotUrl={screenshotUrl}
        heatmapZones={heatmapZones || []}
        pageHeight={pageHeight}
        viewportWidth={viewportWidth}
        heatmapLoading={heatmapLoading}
      />
    </section>
  );
}
