/**
 * Offscreen document for stitching multiple viewport captures into one full-page screenshot.
 * Uses canvas API which is only available in document contexts, not service workers.
 */

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "STITCH_SCREENSHOTS") return false;

  const { captures, width, totalHeight, viewportHeight } = message as {
    captures: string[];
    width: number;
    totalHeight: number;
    viewportHeight: number;
  };

  stitchImages(captures, width, totalHeight, viewportHeight)
    .then((dataUrl) => sendResponse(dataUrl))
    .catch(() => sendResponse(captures[0])); // Fallback to first capture

  return true; // async response
});

async function stitchImages(
  captures: string[],
  width: number,
  totalHeight: number,
  viewportHeight: number
): Promise<string> {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas context");

  canvas.width = width;
  canvas.height = totalHeight;

  // Load all images
  const images = await Promise.all(
    captures.map(
      (dataUrl) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = dataUrl;
        })
    )
  );

  // Draw each image at the correct vertical offset
  for (let i = 0; i < images.length; i++) {
    const y = i * viewportHeight;
    const isLast = i === images.length - 1;

    if (isLast) {
      // Last segment might be a partial viewport — align to bottom
      const remainingHeight = totalHeight - y;
      const srcY = images[i].height - remainingHeight;
      ctx.drawImage(
        images[i],
        0,
        Math.max(0, srcY),
        images[i].width,
        remainingHeight,
        0,
        y,
        width,
        remainingHeight
      );
    } else {
      ctx.drawImage(images[i], 0, y);
    }
  }

  return canvas.toDataURL("image/jpeg", 0.85);
}
