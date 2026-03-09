import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export interface ElementPosition {
  tag: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScreenshotResult {
  buffer: Buffer;
  elements: ElementPosition[];
  pageHeight: number;
  viewportWidth: number;
  viewportHeight: number;
}

/**
 * Capture a full-page screenshot and extract DOM element positions.
 * Uses puppeteer-core + @sparticuz/chromium for Vercel serverless.
 */
export async function captureScreenshot(url: string): Promise<ScreenshotResult> {
  // Disable GPU/WebGL for serverless environment
  chromium.setGraphicsMode = false;

  const executablePath = await chromium.executablePath();

  const browser = await puppeteer.launch({
    args: [
      ...chromium.args,
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--single-process",
    ],
    defaultViewport: { width: 1280, height: 800 },
    executablePath,
    headless: true,
  });

  try {
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 15000,
    });

    // Wait a bit for lazy-loaded content
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Get page dimensions
    const dimensions = await page.evaluate(() => ({
      pageHeight: document.documentElement.scrollHeight,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    }));

    // Extract element positions for heatmap
    const elements: ElementPosition[] = await page.evaluate(() => {
      const selectors = "h1, h2, h3, button, a[href], img, form, input[type='submit'], [role='button']";
      const els = document.querySelectorAll(selectors);
      const results: {
        tag: string;
        text: string;
        x: number;
        y: number;
        width: number;
        height: number;
      }[] = [];

      els.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          results.push({
            tag: el.tagName.toLowerCase(),
            text: (el.textContent || "").slice(0, 50).trim(),
            x: rect.x + window.scrollX,
            y: rect.y + window.scrollY,
            width: rect.width,
            height: rect.height,
          });
        }
      });

      return results;
    });

    // Take full-page screenshot
    const screenshotBuffer = await page.screenshot({
      fullPage: true,
      type: "jpeg",
      quality: 80,
    });

    return {
      buffer: Buffer.from(screenshotBuffer),
      elements,
      pageHeight: dimensions.pageHeight,
      viewportWidth: dimensions.viewportWidth,
      viewportHeight: dimensions.viewportHeight,
    };
  } finally {
    await browser.close();
  }
}
