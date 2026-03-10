import type { HeatmapZone } from "./heatmap";

/**
 * Color scheme for heatmap zones.
 */
function getZoneColors(intensity: number) {
  if (intensity > 0.7) {
    return {
      fill: "rgba(255, 59, 48, 0.28)",
      border: "rgba(255, 59, 48, 0.75)",
      text: "#fff",
      bg: "rgba(255, 59, 48, 0.85)",
      badge: "HIGH",
    };
  } else if (intensity > 0.4) {
    return {
      fill: "rgba(255, 179, 0, 0.22)",
      border: "rgba(255, 179, 0, 0.65)",
      text: "#fff",
      bg: "rgba(255, 149, 0, 0.85)",
      badge: "MED",
    };
  } else {
    return {
      fill: "rgba(50, 173, 230, 0.18)",
      border: "rgba(50, 173, 230, 0.55)",
      text: "#fff",
      bg: "rgba(50, 140, 220, 0.85)",
      badge: "LOW",
    };
  }
}

/**
 * Draw a rounded rectangle on canvas.
 */
function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Draw heatmap zones on a canvas context.
 * Shared logic used by both the display component and PDF export.
 *
 * Steps:
 * 1. Dark overlay on entire canvas to dim the screenshot
 * 2. Cut out zone areas (reveal the screenshot underneath)
 * 3. Paint semi-transparent colored fills with borders
 * 4. Add text labels to each zone
 */
export function drawHeatmapOnCanvas(
  ctx: CanvasRenderingContext2D,
  zones: HeatmapZone[],
  viewportWidth: number,
  pageHeight: number,
  canvasW: number,
  canvasH: number
) {
  const scaleX = canvasW / viewportWidth;
  const scaleY = canvasH / pageHeight;

  // Step 1: Dark overlay
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.40)";
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Step 2: Cut out zone areas to reveal screenshot
  ctx.globalCompositeOperation = "destination-out";
  for (const zone of zones) {
    const zx = zone.x * scaleX;
    const zy = zone.y * scaleY;
    const zw = zone.width * scaleX;
    const zh = zone.height * scaleY;

    ctx.fillStyle = "rgba(0, 0, 0, 1)";
    roundedRect(ctx, zx, zy, zw, zh, 6);
    ctx.fill();
  }

  // Step 3: Paint colored fills + borders
  ctx.globalCompositeOperation = "source-over";
  for (const zone of zones) {
    const zx = zone.x * scaleX;
    const zy = zone.y * scaleY;
    const zw = zone.width * scaleX;
    const zh = zone.height * scaleY;
    const colors = getZoneColors(zone.intensity);

    // Fill
    ctx.fillStyle = colors.fill;
    roundedRect(ctx, zx, zy, zw, zh, 6);
    ctx.fill();

    // Border
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 2;
    roundedRect(ctx, zx, zy, zw, zh, 6);
    ctx.stroke();
  }

  // Step 4: Labels (small pills in top-left of each zone)
  const fontSize = Math.max(9, Math.min(12, canvasW / 120));
  ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
  ctx.textBaseline = "top";

  for (const zone of zones) {
    const zx = zone.x * scaleX;
    const zy = zone.y * scaleY;
    const zw = zone.width * scaleX;
    const colors = getZoneColors(zone.intensity);

    // Label text: "Label (BADGE)"
    const labelText = `${zone.label}`;
    const metrics = ctx.measureText(labelText);
    const labelW = metrics.width + 10;
    const labelH = fontSize + 6;

    // Position: top-left of zone, clamped inside canvas
    const lx = Math.max(2, Math.min(zx + 4, canvasW - labelW - 2));
    const ly = Math.max(2, Math.min(zy + 4, canvasH - labelH - 2));

    // Only draw label if zone is big enough
    if (zw > 40) {
      // Background pill
      ctx.fillStyle = colors.bg;
      roundedRect(ctx, lx, ly, labelW, labelH, 3);
      ctx.fill();

      // Text
      ctx.fillStyle = colors.text;
      ctx.fillText(labelText, lx + 5, ly + 3);
    }
  }

  ctx.restore();
}

/**
 * Generate a composite image of screenshot + heatmap overlay.
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

      // Draw heatmap overlay
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
