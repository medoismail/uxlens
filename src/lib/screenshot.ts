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

const VIEWPORT_WIDTH = 1280;
const VIEWPORT_HEIGHT = 800;

/**
 * Capture a full-page screenshot via Microlink API (free, no key needed)
 * and estimate element positions from HTML for heatmap generation.
 * No Puppeteer/Chromium needed — works on any serverless platform.
 */
export async function captureScreenshot(url: string): Promise<ScreenshotResult> {
  // Run screenshot API call + HTML fetch in parallel
  const [buffer, html] = await Promise.all([
    fetchScreenshot(url),
    fetchHTML(url),
  ]);

  const { elements, pageHeight } = estimateElementPositions(html);

  return {
    buffer,
    elements,
    pageHeight: Math.max(pageHeight, VIEWPORT_HEIGHT),
    viewportWidth: VIEWPORT_WIDTH,
    viewportHeight: VIEWPORT_HEIGHT,
  };
}

/**
 * Fetch screenshot using Microlink API (free tier — 50 req/day, no API key).
 * Uses embed mode which redirects directly to the image.
 */
async function fetchScreenshot(url: string): Promise<Buffer> {
  const params = new URLSearchParams({
    url,
    screenshot: "true",
    "screenshot.fullPage": "true",
    "screenshot.width": String(VIEWPORT_WIDTH),
    "screenshot.height": String(VIEWPORT_HEIGHT),
    "screenshot.type": "jpeg",
    meta: "false",
    embed: "screenshot.url",
  });

  const res = await fetch(`https://api.microlink.io?${params}`, {
    redirect: "follow",
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    throw new Error(`Screenshot API error: HTTP ${res.status}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

/**
 * Fetch page HTML for element position estimation.
 * Non-critical — if it fails, heatmap will just use F-pattern base layer.
 */
async function fetchHTML(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; UXLensBot/1.0; +https://www.uxlens.pro)",
        Accept: "text/html,*/*",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return "";
    return await res.text();
  } catch {
    return "";
  }
}

/**
 * Estimate DOM element positions from HTML using document order.
 * Not pixel-perfect, but sufficient for heatmap visualization.
 */
function estimateElementPositions(html: string): {
  elements: ElementPosition[];
  pageHeight: number;
} {
  if (!html) return { elements: [], pageHeight: 2000 };

  const elements: ElementPosition[] = [];

  // Strip scripts and styles for cleaner parsing
  const clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  // Element patterns with estimated dimensions
  const patterns: {
    regex: RegExp;
    tag: string;
    height: number;
    widthFraction: number;
  }[] = [
    { regex: /<h1[^>]*>([\s\S]*?)<\/h1>/gi, tag: "h1", height: 56, widthFraction: 0.7 },
    { regex: /<h2[^>]*>([\s\S]*?)<\/h2>/gi, tag: "h2", height: 40, widthFraction: 0.6 },
    { regex: /<h3[^>]*>([\s\S]*?)<\/h3>/gi, tag: "h3", height: 32, widthFraction: 0.5 },
    { regex: /<button[^>]*>([\s\S]*?)<\/button>/gi, tag: "button", height: 44, widthFraction: 0.18 },
    { regex: /<input[^>]*type=["']submit["'][^>]*\/?>/gi, tag: "input", height: 44, widthFraction: 0.18 },
    { regex: /<img[^>]*\/?>/gi, tag: "img", height: 260, widthFraction: 0.75 },
    { regex: /<form[^>]*>[\s\S]*?<\/form>/gi, tag: "form", height: 180, widthFraction: 0.45 },
  ];

  // Collect all matches with their position in HTML (for ordering)
  const matches: {
    tag: string;
    text: string;
    index: number;
    height: number;
    widthFraction: number;
  }[] = [];

  for (const p of patterns) {
    let m;
    while ((m = p.regex.exec(clean)) !== null) {
      const rawText = m[1] || "";
      const text = rawText.replace(/<[^>]*>/g, "").trim().slice(0, 50);
      matches.push({
        tag: p.tag,
        text,
        index: m.index,
        height: p.height,
        widthFraction: p.widthFraction,
      });
    }
  }

  // Find links (limit to 25 to avoid noise from nav/footer)
  const linkRe = /<a[^>]*href[^>]*>([\s\S]*?)<\/a>/gi;
  let lm;
  let linkCount = 0;
  while ((lm = linkRe.exec(clean)) !== null && linkCount < 25) {
    const text = (lm[1] || "").replace(/<[^>]*>/g, "").trim().slice(0, 50);
    if (text.length > 1) {
      matches.push({
        tag: "a",
        text,
        index: lm.index,
        height: 22,
        widthFraction: 0.12,
      });
      linkCount++;
    }
  }

  // Sort by position in HTML (approximates document order)
  matches.sort((a, b) => a.index - b.index);

  // Assign estimated Y positions
  let y = 80; // Start below typical nav bar
  const gap = 20;

  for (const m of matches) {
    const width = VIEWPORT_WIDTH * m.widthFraction;
    const x = (VIEWPORT_WIDTH - width) / 2;

    elements.push({
      tag: m.tag,
      text: m.text,
      x,
      y,
      width,
      height: m.height,
    });

    y += m.height + gap;
  }

  return {
    elements,
    pageHeight: Math.max(y + 200, 2000),
  };
}
