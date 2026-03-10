export interface HeatmapZone {
  x: number;
  y: number;
  width: number;
  height: number;
  intensity: number; // 0-1
  label: string;
}

/**
 * Convert AI vision hotspots (normalized 0-1 coordinates) to pixel-based HeatmapZones.
 */
export function hotspotsToZones(
  hotspots: { x: number; y: number; width: number; height: number; intensity: string; label: string }[],
  viewportWidth: number,
  pageHeight: number
): HeatmapZone[] {
  return hotspots.map((h) => ({
    x: h.x * viewportWidth,
    y: h.y * pageHeight,
    width: h.width * viewportWidth,
    height: h.height * pageHeight,
    intensity: h.intensity === "high" ? 0.9 : h.intensity === "medium" ? 0.6 : 0.3,
    label: h.label,
  }));
}

/**
 * Fallback: Generate rule-based heatmap zones when AI vision is unavailable.
 * Uses F-pattern reading behavior + element type importance.
 */
export function generateFallbackHeatmapZones(
  pageHeight: number,
  viewportHeight: number
): HeatmapZone[] {
  const zones: HeatmapZone[] = [];

  // F-pattern base zones
  zones.push({
    x: 0,
    y: 0,
    width: 1280,
    height: Math.min(200, viewportHeight * 0.25),
    intensity: 0.3,
    label: "F-pattern: top scan",
  });

  zones.push({
    x: 0,
    y: 0,
    width: 400,
    height: Math.min(viewportHeight, pageHeight),
    intensity: 0.15,
    label: "F-pattern: left scan",
  });

  // Hero area — typically high attention
  zones.push({
    x: 200,
    y: 40,
    width: 880,
    height: 120,
    intensity: 0.85,
    label: "Hero headline area",
  });

  // CTA area
  zones.push({
    x: 460,
    y: 300,
    width: 360,
    height: 60,
    intensity: 0.9,
    label: "Primary CTA area",
  });

  // Navigation
  zones.push({
    x: 0,
    y: 0,
    width: 1280,
    height: 60,
    intensity: 0.4,
    label: "Navigation bar",
  });

  zones.sort((a, b) => b.intensity - a.intensity);
  return zones;
}
