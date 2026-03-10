import chromium from "@sparticuz/chromium-min";
import puppeteer from "puppeteer-core";

export interface ScreenshotResult {
  buffer: Buffer;
  pageHeight: number;
  viewportWidth: number;
  viewportHeight: number;
}

const VIEWPORT_WIDTH = 1280;
const VIEWPORT_HEIGHT = 800;

/**
 * Chromium binary URL for runtime download.
 * @sparticuz/chromium-min does NOT bundle the binary — it downloads it
 * on cold start from this URL. This keeps the serverless function small.
 *
 * The URL must match the @sparticuz/chromium-min version.
 * See: https://github.com/nicholasgasior/chromium-binaries
 */
const CHROMIUM_BINARY_URL =
  "https://github.com/nicholasgasior/chromium-binaries/releases/download/v143.0.0/chromium-v143.0.0-pack.tar";

/**
 * Capture a full-page screenshot using Puppeteer + @sparticuz/chromium-min.
 * Works on Vercel serverless (binary is downloaded on cold start).
 *
 * - Waits for networkidle0 + 2s extra for lazy content
 * - Blocks media/font to speed up load
 * - Full-page JPEG screenshot at 85% quality
 * - Reads actual page height from the DOM
 */
export async function captureScreenshot(url: string): Promise<ScreenshotResult> {
  const executablePath = await chromium.executablePath(CHROMIUM_BINARY_URL);

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT },
    executablePath,
    headless: true,
  });

  try {
    const page = await browser.newPage();

    // Set a realistic user-agent
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Block heavy resources to speed up page load
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const type = req.resourceType();
      if (["media", "font"].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Navigate with networkidle0 — waits until no network requests for 500ms
    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 25000,
    });

    // Extra wait for lazy-loaded content, animations, and JS rendering
    await new Promise((r) => setTimeout(r, 2000));

    // Get actual page height from the DOM
    const pageHeight = await page.evaluate(() => {
      return Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
    });

    // Full-page JPEG screenshot
    const screenshotBuffer = await page.screenshot({
      fullPage: true,
      type: "jpeg",
      quality: 85,
    });

    return {
      buffer: Buffer.from(screenshotBuffer),
      pageHeight: Math.max(pageHeight, VIEWPORT_HEIGHT),
      viewportWidth: VIEWPORT_WIDTH,
      viewportHeight: VIEWPORT_HEIGHT,
    };
  } finally {
    await browser.close();
  }
}
