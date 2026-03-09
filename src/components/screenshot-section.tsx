"use client";

import { HeatmapOverlay } from "@/components/heatmap-overlay";
import type { HeatmapZone } from "@/lib/heatmap";

interface ScreenshotSectionProps {
  screenshotUrl: string;
  heatmapZones: HeatmapZone[];
  pageHeight: number;
  viewportWidth: number;
}

export function ScreenshotSection({
  screenshotUrl,
  heatmapZones,
  pageHeight,
  viewportWidth,
}: ScreenshotSectionProps) {
  if (!screenshotUrl) return null;

  return (
    <section
      className="rounded-xl border p-5 mb-4"
      style={{ borderColor: "var(--border)", background: "var(--s1)" }}
    >
      <HeatmapOverlay
        screenshotUrl={screenshotUrl}
        heatmapZones={heatmapZones}
        pageHeight={pageHeight}
        viewportWidth={viewportWidth}
      />
    </section>
  );
}
