export interface HeatmapZone {
  x: number;      // pixel center x
  y: number;      // pixel center y
  intensity: number; // 0-1
  radius: number;    // pixel radius for gaussian blob
}

/** Base radius for gaussian blobs at different intensity levels (pixels) */
const BASE_RADIUS_HIGH = 140;
const BASE_RADIUS_MID = 100;
const BASE_RADIUS_LOW = 70;

/**
 * Convert AI vision hotspots (normalized 0-1 center points with continuous intensity)
 * to pixel-based HeatmapZones with gaussian blob radius.
 */
export function hotspotsToZones(
  hotspots: { x: number; y: number; intensity: number; spread?: number }[],
  viewportWidth: number,
  pageHeight: number
): HeatmapZone[] {
  return hotspots.map((h) => {
    // Map intensity to base radius
    let baseRadius: number;
    if (h.intensity > 0.7) {
      baseRadius = BASE_RADIUS_HIGH;
    } else if (h.intensity > 0.35) {
      baseRadius = BASE_RADIUS_MID;
    } else {
      baseRadius = BASE_RADIUS_LOW;
    }

    // Apply spread multiplier if provided
    const spread = h.spread ?? 1.0;
    const radius = baseRadius * spread;

    return {
      x: h.x * viewportWidth,
      y: h.y * pageHeight,
      intensity: h.intensity,
      radius,
    };
  });
}

/**
 * Normalize heatmap zones from any format (legacy bounding-box or new point-based).
 * Legacy zones from old audits have: x (top-left), y (top-left), width, height, label.
 * New zones have: x (center), y (center), intensity, radius.
 */
export function normalizeHeatmapZones(zones: Record<string, unknown>[]): HeatmapZone[] {
  return zones.map((z) => {
    // New format: has radius property
    if (typeof z.radius === "number") {
      return {
        x: z.x as number,
        y: z.y as number,
        intensity: z.intensity as number,
        radius: z.radius as number,
      };
    }

    // Legacy format: x,y are top-left corner, has width/height/label
    const width = (z.width as number) || 0;
    const height = (z.height as number) || 0;
    const intensity = (z.intensity as number) || 0.5;

    return {
      x: (z.x as number) + width / 2,
      y: (z.y as number) + height / 2,
      intensity,
      radius: Math.max(width, height, 60) / 2,
    };
  });
}

/**
 * Fallback: Generate rule-based heatmap zones when AI vision is unavailable.
 * Uses F-pattern reading behavior + typical page element importance.
 */
export function generateFallbackHeatmapZones(
  pageHeight: number,
  viewportHeight: number
): HeatmapZone[] {
  const zones: HeatmapZone[] = [];

  // Hero headline area — strongest attention
  zones.push({
    x: 640,
    y: 180,
    intensity: 0.92,
    radius: 160,
  });

  // Primary CTA — strong fixation
  zones.push({
    x: 640,
    y: 360,
    intensity: 0.85,
    radius: 100,
  });

  // Subheadline area
  zones.push({
    x: 640,
    y: 260,
    intensity: 0.65,
    radius: 130,
  });

  // F-pattern: top-left logo area
  zones.push({
    x: 120,
    y: 30,
    intensity: 0.45,
    radius: 80,
  });

  // F-pattern: top horizontal scan
  zones.push({
    x: 640,
    y: 30,
    intensity: 0.35,
    radius: 120,
  });

  // F-pattern: left vertical scan
  zones.push({
    x: 120,
    y: Math.min(500, pageHeight * 0.2),
    intensity: 0.3,
    radius: 90,
  });

  // Below-fold content — reduced attention
  if (pageHeight > viewportHeight) {
    zones.push({
      x: 640,
      y: viewportHeight + 200,
      intensity: 0.25,
      radius: 140,
    });

    zones.push({
      x: 640,
      y: viewportHeight + 500,
      intensity: 0.15,
      radius: 120,
    });
  }

  return zones;
}
