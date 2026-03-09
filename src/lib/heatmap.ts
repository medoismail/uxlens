import type { ElementPosition } from "./screenshot";

export interface HeatmapZone {
  x: number;
  y: number;
  width: number;
  height: number;
  intensity: number; // 0-1
  label: string;
}

/**
 * Generate algorithmic heatmap zones from DOM element positions.
 * Simulates attention/eye-tracking based on:
 * - F-pattern reading behavior
 * - Element type importance (CTAs > headlines > images)
 * - Below-fold decay
 */
export function generateHeatmapZones(
  elements: ElementPosition[],
  pageHeight: number,
  viewportHeight: number
): HeatmapZone[] {
  const zones: HeatmapZone[] = [];

  // F-pattern base zones (above the fold gets most attention)
  // Top horizontal bar
  zones.push({
    x: 0,
    y: 0,
    width: 1280,
    height: Math.min(200, viewportHeight * 0.25),
    intensity: 0.3,
    label: "F-pattern: top scan",
  });

  // Left side vertical scan
  zones.push({
    x: 0,
    y: 0,
    width: 400,
    height: Math.min(viewportHeight, pageHeight),
    intensity: 0.15,
    label: "F-pattern: left scan",
  });

  // Element-based zones
  for (const el of elements) {
    const foldMultiplier = getFoldDecay(el.y, viewportHeight, pageHeight);
    let baseIntensity = 0;
    let label = "";

    switch (el.tag) {
      case "h1":
        baseIntensity = 0.9;
        label = "Headline (H1)";
        break;
      case "h2":
        baseIntensity = 0.6;
        label = "Subheading (H2)";
        break;
      case "h3":
        baseIntensity = 0.4;
        label = "Subheading (H3)";
        break;
      case "button":
      case "input":
        baseIntensity = 0.95;
        label = "CTA / Button";
        break;
      case "a":
        // Links that look like buttons or nav items
        baseIntensity = el.text.length > 0 ? 0.4 : 0.2;
        label = "Link";
        break;
      case "img":
        baseIntensity = 0.5;
        label = "Image";
        break;
      case "form":
        baseIntensity = 0.6;
        label = "Form";
        break;
      default:
        baseIntensity = 0.3;
        label = el.tag;
    }

    const intensity = Math.min(1, baseIntensity * foldMultiplier);

    if (intensity > 0.05) {
      // Add some padding around the element for the heatmap zone
      const padding = 20;
      zones.push({
        x: Math.max(0, el.x - padding),
        y: Math.max(0, el.y - padding),
        width: el.width + padding * 2,
        height: el.height + padding * 2,
        intensity,
        label,
      });
    }
  }

  // Sort by intensity (highest first) for rendering order
  zones.sort((a, b) => b.intensity - a.intensity);

  return zones;
}

/**
 * Calculate attention decay based on distance from fold.
 * Above fold: full attention
 * 1-2 screens below: gradual decay
 * 3+ screens below: minimal attention
 */
function getFoldDecay(
  elementY: number,
  viewportHeight: number,
  _pageHeight: number
): number {
  if (elementY <= viewportHeight) {
    // Above the fold — full attention
    return 1.0;
  }

  const screensBelow = (elementY - viewportHeight) / viewportHeight;

  if (screensBelow <= 1) return 0.7;
  if (screensBelow <= 2) return 0.4;
  if (screensBelow <= 3) return 0.2;
  return 0.1;
}
