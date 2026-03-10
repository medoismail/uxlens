export interface ScreenshotResult {
  buffer: Buffer;
  pageHeight: number;
  viewportWidth: number;
  viewportHeight: number;
}

const VIEWPORT_WIDTH = 1280;
const VIEWPORT_HEIGHT = 800;

/**
 * Capture a full-page screenshot using the Microlink API.
 *
 * Cheaper and more reliable than Puppeteer on Vercel:
 * - No Chromium binary download on cold starts
 * - No serverless compute for browser rendering
 * - Works on all Vercel plan tiers
 *
 * Falls back to Puppeteer only in local development.
 */
export async function captureScreenshot(url: string): Promise<ScreenshotResult> {
  // Primary: Microlink API (free, reliable, no infrastructure needed)
  try {
    return await captureWithMicrolink(url);
  } catch (err) {
    console.warn("[Screenshot] Microlink failed:", err instanceof Error ? err.message : err);
  }

  // Fallback: Puppeteer (for local dev or if Microlink is down)
  if (process.env.NODE_ENV === "development" || process.env.USE_PUPPETEER === "true") {
    try {
      return await captureWithPuppeteer(url);
    } catch (err) {
      console.error("[Screenshot] Puppeteer fallback also failed:", err instanceof Error ? err.message : err);
    }
  }

  throw new Error("Screenshot capture failed with all methods");
}

/**
 * Microlink API screenshot capture.
 * Free tier works for most sites. waitForTimeout=3000 handles SPAs.
 */
async function captureWithMicrolink(url: string): Promise<ScreenshotResult> {
  const apiUrl = new URL("https://api.microlink.io");
  apiUrl.searchParams.set("url", url);
  apiUrl.searchParams.set("screenshot", "true");
  apiUrl.searchParams.set("meta", "false");
  apiUrl.searchParams.set("viewport.width", String(VIEWPORT_WIDTH));
  apiUrl.searchParams.set("viewport.height", String(VIEWPORT_HEIGHT));
  apiUrl.searchParams.set("screenshot.fullPage", "true");
  apiUrl.searchParams.set("screenshot.type", "jpeg");
  apiUrl.searchParams.set("screenshot.quality", "85");
  apiUrl.searchParams.set("waitForTimeout", "5000");

  // Add Microlink API key if available (for higher rate limits)
  const microlinkKey = process.env.MICROLINK_API_KEY;
  const headers: Record<string, string> = {};
  if (microlinkKey) {
    headers["x-api-key"] = microlinkKey;
  }

  const res = await fetch(apiUrl.toString(), {
    headers,
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Microlink API error: HTTP ${res.status} - ${text.slice(0, 200)}`);
  }

  // JSON response with screenshot URL and metadata
  const data = await res.json() as {
    status?: string;
    message?: string;
    data?: { screenshot?: { url?: string; height?: number } };
  };

  if (data.status === "fail") {
    throw new Error(`Microlink failed: ${data.message || "unknown error"}`);
  }

  const screenshotUrl = data?.data?.screenshot?.url;
  if (!screenshotUrl) {
    throw new Error("Microlink returned no screenshot URL");
  }

  // Fetch the actual screenshot image
  const imgRes = await fetch(screenshotUrl, {
    signal: AbortSignal.timeout(15000),
  });

  if (!imgRes.ok) {
    throw new Error(`Failed to fetch Microlink screenshot: HTTP ${imgRes.status}`);
  }

  const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
  const pageHeight = data?.data?.screenshot?.height || 3000;

  return {
    buffer: imgBuffer,
    pageHeight: Math.max(pageHeight, VIEWPORT_HEIGHT),
    viewportWidth: VIEWPORT_WIDTH,
    viewportHeight: VIEWPORT_HEIGHT,
  };
}

/**
 * Puppeteer fallback (local development only).
 */
async function captureWithPuppeteer(url: string): Promise<ScreenshotResult> {
  const chromium = (await import("@sparticuz/chromium-min")).default;
  const puppeteer = (await import("puppeteer-core")).default;

  const CHROMIUM_BINARY_URL =
    "https://github.com/nicholasgasior/chromium-binaries/releases/download/v143.0.0/chromium-v143.0.0-pack.tar";

  const executablePath = await chromium.executablePath(CHROMIUM_BINARY_URL);

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT },
    executablePath,
    headless: true,
  });

  try {
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const type = req.resourceType();
      if (["media", "font"].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 25000,
    });

    await new Promise((r) => setTimeout(r, 2000));

    const pageHeight = await page.evaluate(() => {
      return Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
    });

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
