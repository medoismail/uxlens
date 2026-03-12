export interface ScreenshotResult {
  buffer: Buffer;
  pageHeight: number;
  viewportWidth: number;
  viewportHeight: number;
}

const VIEWPORT_WIDTH = 1280;
const VIEWPORT_HEIGHT = 800;

// ---------------------------------------------------------------------------
// Popup / modal / overlay dismissal selectors
// ---------------------------------------------------------------------------

/** Common cookie consent accept/dismiss button selectors */
const COOKIE_ACCEPT_SELECTORS = [
  // CookieBot
  "#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll",
  "#CybotCookiebotDialogBodyButtonAccept",
  // OneTrust
  "#onetrust-accept-btn-handler",
  ".onetrust-close-btn-handler",
  // Quantcast / GDPR
  '[class*="qc-cmp2-summary-buttons"] button:first-child',
  ".qc-cmp-button",
  // Osano
  ".osano-cm-accept-all",
  // Complianz
  "#cmplz-cookiebanner-container .cmplz-accept",
  // Cookie Notice (generic)
  "#cookie-notice .cn-set-cookie",
  "#cookie-law-info-bar .cli_action_button",
  // Generic patterns
  '[id*="cookie"] button',
  '[class*="cookie-banner"] button',
  '[class*="cookie-consent"] button',
  '[class*="cookieConsent"] button',
  '[class*="cookie-notice"] button',
  '[class*="gdpr"] button',
  '[aria-label*="cookie" i] button',
  '[aria-label*="Accept" i]',
  '[aria-label*="accept" i]',
  'button[class*="accept"]',
  'button[class*="agree"]',
  'a[class*="accept"]',
  'a[class*="agree"]',
];

/** Chat widget container selectors to hide */
const CHAT_WIDGET_SELECTORS = [
  // Intercom
  "#intercom-container",
  "#intercom-frame",
  ".intercom-lightweight-app",
  // Zendesk
  "#launcher",
  "#webWidget",
  '[class*="zEWidget"]',
  // Drift
  "#drift-widget",
  "#drift-frame-chat",
  "#drift-frame-controller",
  // Crisp
  '[class*="crisp-client"]',
  "#crisp-chatbox",
  // HubSpot
  "#hubspot-messages-iframe-container",
  // Tidio
  "#tidio-chat",
  "#tidio-chat-iframe",
  // LiveChat
  "#chat-widget-container",
  // Freshdesk / Freshchat
  "#fc_frame",
  "#freshworks-container",
  // Olark
  "#olark-box-wrapper",
  // Tawk.to
  '[class*="tawk-"]',
  "#tawk-bubble-container",
  // Generic
  '[id*="chat-widget"]',
  '[class*="chat-widget"]',
  '[class*="chatWidget"]',
];

/** Modal / overlay selectors to close or remove */
const MODAL_OVERLAY_SELECTORS = [
  // Generic modals
  '[class*="modal-overlay"]',
  '[class*="modalOverlay"]',
  '[class*="popup-overlay"]',
  '[class*="popupOverlay"]',
  '[class*="newsletter-popup"]',
  '[class*="newsletterPopup"]',
  '[class*="email-popup"]',
  '[class*="emailPopup"]',
  '[class*="signup-modal"]',
  '[class*="signupModal"]',
  '[class*="subscribe-modal"]',
  '[class*="exit-intent"]',
  '[class*="exitIntent"]',
  // Common role-based
  '[role="dialog"]',
  '[role="alertdialog"]',
  // Overlay backdrops
  '[class*="overlay"][class*="visible"]',
  '[class*="backdrop"][class*="show"]',
];

/** Close button selectors (tried inside modals) */
const CLOSE_BUTTON_SELECTORS = [
  '[aria-label="Close"]',
  '[aria-label="close"]',
  '[aria-label="Dismiss"]',
  '[aria-label="dismiss"]',
  'button[class*="close"]',
  'button[class*="dismiss"]',
  'button[class*="Close"]',
  ".modal-close",
  ".popup-close",
  '[data-dismiss="modal"]',
  ".close-btn",
  ".close-button",
];

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
 * Dismiss common popups, modals, cookie banners, and chat widgets.
 * Runs in the Puppeteer page context before screenshot capture so the
 * AI analyzes the actual landing page rather than overlay content.
 */
async function dismissPopups(page: import("puppeteer-core").Page): Promise<void> {
  await page.evaluate(
    (cookieSelectors, chatSelectors, modalSelectors, closeSelectors) => {
      // 1. Click cookie consent accept/close buttons
      for (const sel of cookieSelectors) {
        const btn = document.querySelector<HTMLElement>(sel);
        if (btn && btn.offsetParent !== null) {
          btn.click();
          break; // one consent banner at a time
        }
      }

      // 2. Try clicking close buttons inside modals/dialogs
      for (const sel of modalSelectors) {
        const modal = document.querySelector<HTMLElement>(sel);
        if (modal && modal.offsetParent !== null) {
          // Try to find a close button inside the modal first
          for (const closeSel of closeSelectors) {
            const closeBtn = modal.querySelector<HTMLElement>(closeSel);
            if (closeBtn) {
              closeBtn.click();
              break;
            }
          }
        }
      }

      // 3. Also try top-level close buttons for any remaining overlays
      for (const sel of closeSelectors) {
        document.querySelectorAll<HTMLElement>(sel).forEach((btn) => {
          if (btn.offsetParent !== null) btn.click();
        });
      }

      // 4. Hide chat widgets entirely
      for (const sel of chatSelectors) {
        document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
          el.style.display = "none";
        });
      }

      // 5. Remove fixed/sticky overlays that block the page content.
      //    Only target elements that cover a significant portion of the viewport.
      document.querySelectorAll<HTMLElement>("*").forEach((el) => {
        const style = getComputedStyle(el);
        if (
          (style.position === "fixed" || style.position === "sticky") &&
          (style.zIndex === "auto" ? 0 : parseInt(style.zIndex, 10)) > 999
        ) {
          const rect = el.getBoundingClientRect();
          const viewportArea = window.innerWidth * window.innerHeight;
          const elArea = rect.width * rect.height;
          // If the element covers >30% of viewport, it's likely an overlay
          if (elArea / viewportArea > 0.3) {
            el.style.display = "none";
          }
        }
      });
    },
    COOKIE_ACCEPT_SELECTORS,
    CHAT_WIDGET_SELECTORS,
    MODAL_OVERLAY_SELECTORS,
    CLOSE_BUTTON_SELECTORS
  );

  // Wait briefly for animations to settle after dismissals
  await new Promise((r) => setTimeout(r, 800));
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

    // Dismiss popups, cookie banners, chat widgets, and overlays
    // so the screenshot captures the actual page content.
    await dismissPopups(page);

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
