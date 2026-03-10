import type { HeatmapZone } from "./heatmap";

/**
 * Warm heatmap color palette (256 entries).
 * Maps intensity alpha (0-255) → [R, G, B, A].
 * Gradient: transparent → yellow → orange → red.
 */
function createWarmPalette(): [number, number, number, number][] {
  const palette: [number, number, number, number][] = [];

  for (let i = 0; i < 256; i++) {
    const t = i / 255; // 0-1

    if (t < 0.05) {
      // Below threshold: fully transparent
      palette.push([0, 0, 0, 0]);
      continue;
    }

    let r: number, g: number, b: number;

    if (t < 0.25) {
      // Yellow range (255, 255, 0)
      const p = (t - 0.05) / 0.2;
      r = 255;
      g = 255;
      b = Math.round(50 * (1 - p));
    } else if (t < 0.55) {
      // Yellow → Orange transition
      const p = (t - 0.25) / 0.3;
      r = 255;
      g = Math.round(255 - 105 * p); // 255 → 150
      b = 0;
    } else if (t < 0.8) {
      // Orange → Red-orange transition
      const p = (t - 0.55) / 0.25;
      r = 255;
      g = Math.round(150 - 100 * p); // 150 → 50
      b = 0;
    } else {
      // Deep red
      const p = (t - 0.8) / 0.2;
      r = 255;
      g = Math.round(50 - 50 * p); // 50 → 0
      b = 0;
    }

    // Alpha ramps up from 0 to ~200 (not full 255 to keep some transparency)
    const alpha = Math.min(220, Math.round(t * 300));

    palette.push([r, g, b, alpha]);
  }

  return palette;
}

/** Cached palette — created once */
let cachedPalette: [number, number, number, number][] | null = null;
function getPalette() {
  if (!cachedPalette) cachedPalette = createWarmPalette();
  return cachedPalette;
}

/**
 * Deterministic pseudo-random for jitter — avoids re-randomizing on each render.
 */
function seededRandom(seed: number): () => number {
  let s = Math.abs(Math.round(seed * 10000)) || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Add jitter sub-points around each attention center for organic appearance.
 * Returns the original zones plus additional low-intensity scatter points.
 */
function addJitter(zones: HeatmapZone[]): HeatmapZone[] {
  const jittered: HeatmapZone[] = [];

  for (const zone of zones) {
    // Keep the original point
    jittered.push(zone);

    // Create deterministic random from zone coordinates
    const rng = seededRandom(zone.x * 7 + zone.y * 13 + zone.intensity * 31);

    // Number of jitter points scales with intensity
    const jitterCount = zone.intensity > 0.7 ? 4 : zone.intensity > 0.4 ? 3 : 2;
    const jitterRange = zone.radius * 0.5;

    for (let i = 0; i < jitterCount; i++) {
      const angle = rng() * Math.PI * 2;
      const dist = rng() * jitterRange;

      jittered.push({
        x: zone.x + Math.cos(angle) * dist,
        y: zone.y + Math.sin(angle) * dist,
        intensity: zone.intensity * (0.2 + rng() * 0.3),
        radius: zone.radius * (0.3 + rng() * 0.4),
      });
    }
  }

  return jittered;
}

/**
 * Draw a realistic gaussian attention heatmap on a canvas context.
 *
 * Technique:
 * 1. Create a temporary canvas for grayscale intensity blobs
 * 2. Draw radial gradient circles with additive ("lighter") blending
 * 3. Add jitter sub-points for organic appearance
 * 4. Read pixel data and map alpha → warm color palette
 * 5. Composite the colored heatmap onto the main canvas
 *
 * No labels, no bounding boxes, no rectangles — pure gaussian blobs.
 */
export function drawHeatmapOnCanvas(
  ctx: CanvasRenderingContext2D,
  zones: HeatmapZone[],
  viewportWidth: number,
  pageHeight: number,
  canvasW: number,
  canvasH: number
) {
  if (!zones.length) return;

  // Scale zones to canvas dimensions
  const scaleX = canvasW / (viewportWidth || canvasW);
  const scaleY = canvasH / (pageHeight || canvasH);

  const scaledZones: HeatmapZone[] = zones.map((z) => {
    // Handle legacy zones that have width/height but no radius
    const raw = z as unknown as Record<string, unknown>;
    const hasRadius = typeof z.radius === "number" && z.radius > 0;
    let cx = z.x;
    let cy = z.y;
    let radius = z.radius || 80;

    if (!hasRadius && typeof raw.width === "number" && typeof raw.height === "number") {
      // Legacy format: x,y are top-left, convert to center
      cx = z.x + (raw.width as number) / 2;
      cy = z.y + (raw.height as number) / 2;
      radius = Math.max(raw.width as number, raw.height as number, 60) / 2;
    }

    return {
      x: cx * scaleX,
      y: cy * scaleY,
      intensity: z.intensity,
      radius: radius * Math.min(scaleX, scaleY),
    };
  });

  // Add jitter for organic appearance
  const allPoints = addJitter(scaledZones);

  // Step 1: Create temp canvas for grayscale intensity map
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = canvasW;
  tempCanvas.height = canvasH;
  const tempCtx = tempCanvas.getContext("2d");
  if (!tempCtx) return;

  // Step 2: Draw grayscale intensity blobs with additive blending
  tempCtx.globalCompositeOperation = "lighter";

  for (const point of allPoints) {
    const r = Math.max(20, point.radius);

    const gradient = tempCtx.createRadialGradient(
      point.x, point.y, 0,
      point.x, point.y, r
    );

    // Gaussian falloff: center = full intensity, edge = 0
    const centerAlpha = Math.min(1, point.intensity);
    gradient.addColorStop(0, `rgba(0, 0, 0, ${centerAlpha})`);
    gradient.addColorStop(0.4, `rgba(0, 0, 0, ${centerAlpha * 0.5})`);
    gradient.addColorStop(0.7, `rgba(0, 0, 0, ${centerAlpha * 0.15})`);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    tempCtx.fillStyle = gradient;
    tempCtx.beginPath();
    tempCtx.arc(point.x, point.y, r, 0, Math.PI * 2);
    tempCtx.fill();
  }

  // Step 3: Read pixel data and colorize using warm palette
  const imageData = tempCtx.getImageData(0, 0, canvasW, canvasH);
  const data = imageData.data;
  const palette = getPalette();

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3]; // Alpha channel = accumulated intensity

    if (alpha < 8) {
      // Below visibility threshold → fully transparent
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 0;
      continue;
    }

    const idx = Math.min(255, alpha);
    const [r, g, b, a] = palette[idx];
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = a;
  }

  tempCtx.putImageData(imageData, 0, 0);

  // Step 4: Composite heatmap onto main canvas
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.drawImage(tempCanvas, 0, 0);
  ctx.globalAlpha = 1.0;
  ctx.restore();
}

/**
 * Generate a composite image of screenshot + gaussian heatmap overlay.
 * Used for PDF export. Returns a base64 data URL.
 */
export async function generateHeatmapComposite(
  screenshotUrl: string,
  zones: HeatmapZone[],
  pageHeight: number,
  viewportWidth: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Draw screenshot
      ctx.drawImage(img, 0, 0);

      // Draw gaussian heatmap overlay
      drawHeatmapOnCanvas(
        ctx,
        zones,
        viewportWidth,
        pageHeight,
        canvas.width,
        canvas.height
      );

      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };

    img.onerror = () => reject(new Error("Failed to load screenshot image"));
    img.src = screenshotUrl;
  });
}
