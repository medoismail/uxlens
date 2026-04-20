/**
 * Content script — runs on every page.
 * Handles:
 * 1. Page dimension queries + scroll control for full-page screenshots
 * 2. DOM content extraction (same as server-side extractPageContent but from live DOM)
 */

// Extension can send more text since it captures the full page the user sees
const MAX_BODY_TEXT_LENGTH = 12000;
const MAX_ITEMS = 80;

const TRUST_KEYWORDS = [
  "testimonial", "review", "rating", "trusted by", "customers",
  "case study", "case studies", "partner", "client",
  "guarantee", "money back", "secure", "certified", "award",
  "featured in", "as seen on", "proof", "verified",
];

// Selectors for elements to remove before extracting content
const NOISE_SELECTORS = [
  // Cookie banners
  '#CybotCookiebotDialog', '#onetrust-consent-sdk', '[class*="cookie-banner"]',
  '[class*="cookie-consent"]', '[class*="cookieConsent"]', '[class*="gdpr-banner"]',
  // Chat widgets
  '#intercom-container', '.intercom-lightweight-app', '#drift-widget',
  '[class*="crisp-client"]', '#hubspot-messages-iframe-container', '#tidio-chat',
  '[class*="tawk-"]', '#tawk-bubble-container', '[class*="chat-widget"]',
  // Modals/overlays
  '[role="dialog"]', '[role="alertdialog"]', '[class*="modal-overlay"]',
  '[class*="popup-overlay"]', '[class*="newsletter-popup"]', '[class*="exit-intent"]',
];

function dedup(items: string[]): string[] {
  const seen = new Set<string>();
  return items
    .map((s) => s.trim())
    .filter((s) => {
      if (!s || seen.has(s.toLowerCase())) return false;
      seen.add(s.toLowerCase());
      return true;
    })
    .slice(0, MAX_ITEMS);
}

/** Extract structured content from the live DOM */
function extractPageContent() {
  const url = window.location.href;

  // Detect language
  const htmlLang = document.documentElement.lang?.trim().split("-")[0]?.toLowerCase() || "";
  const metaLang = document.querySelector('meta[http-equiv="Content-Language"]')?.getAttribute("content")?.trim().split(",")[0]?.split("-")[0]?.toLowerCase() || "";
  const language = htmlLang || metaLang || "";

  const title = document.title.trim();
  const metaDescription =
    document.querySelector('meta[name="description"]')?.getAttribute("content")?.trim() ||
    document.querySelector('meta[property="og:description"]')?.getAttribute("content")?.trim() ||
    "";

  // Clone body to avoid modifying the live page
  const bodyClone = document.body.cloneNode(true) as HTMLElement;

  // Remove noise elements from clone
  for (const sel of NOISE_SELECTORS) {
    bodyClone.querySelectorAll(sel).forEach((el) => el.remove());
  }
  bodyClone.querySelectorAll("script, style, noscript, svg, iframe, [hidden], [aria-hidden='true']").forEach((el) => el.remove());

  // Headings
  const headings: string[] = [];
  bodyClone.querySelectorAll("h1").forEach((el) => {
    const text = el.textContent?.trim();
    if (text) headings.push(text);
  });

  const subheadings: string[] = [];
  bodyClone.querySelectorAll("h2, h3").forEach((el) => {
    const text = el.textContent?.trim();
    if (text) subheadings.push(text);
  });

  // Buttons & CTAs
  const buttons: string[] = [];
  bodyClone.querySelectorAll("button, [role='button'], a.btn, a.button, a.cta, input[type='submit']").forEach((el) => {
    const text = el.textContent?.trim() || (el as HTMLInputElement).value?.trim() || el.getAttribute("aria-label")?.trim() || "";
    if (text && text.length < 100) buttons.push(text);
  });

  bodyClone.querySelectorAll("a").forEach((el) => {
    const text = el.textContent?.trim() || "";
    const href = el.getAttribute("href") || "";
    if (text && text.length < 60 && text.length > 2 && !href.startsWith("#") &&
      /sign|start|try|get|join|buy|subscribe|demo|contact|learn/i.test(text)) {
      buttons.push(text);
    }
  });

  // Sections
  const sections: string[] = [];
  bodyClone.querySelectorAll("section, [class*='section'], [class*='hero'], [class*='feature'], [class*='pricing'], [class*='testimonial'], [class*='faq'], footer, header, nav").forEach((el) => {
    const tag = el.tagName.toLowerCase();
    const cls = el.className || "";
    const id = el.id || "";
    const label = [tag, typeof cls === "string" ? cls : "", id].filter(Boolean).join(" ").slice(0, 100);
    if (label) sections.push(label);
  });

  // Forms
  const forms: string[] = [];
  bodyClone.querySelectorAll("form").forEach((el) => {
    const action = el.getAttribute("action") || "";
    const inputs: string[] = [];
    el.querySelectorAll("input, textarea, select").forEach((input) => {
      const name = input.getAttribute("name") || input.getAttribute("placeholder") || input.getAttribute("type") || "";
      if (name) inputs.push(name);
    });
    forms.push(`Form(action=${action || "none"}, fields=[${inputs.join(", ")}])`);
  });

  // Trust signals
  const trustSignals: string[] = [];
  const fullText = bodyClone.textContent?.toLowerCase() || "";
  for (const keyword of TRUST_KEYWORDS) {
    if (fullText.includes(keyword)) {
      trustSignals.push(keyword);
    }
  }

  bodyClone.querySelectorAll("[class*='testimonial'], [class*='review'], [class*='trust'], [class*='partner'], [class*='client']").forEach((el) => {
    const text = el.textContent?.trim().slice(0, 200);
    if (text) trustSignals.push(text);
  });

  // Body text
  let bodyText = (bodyClone.textContent || "").replace(/\s+/g, " ").trim();
  if (bodyText.length > MAX_BODY_TEXT_LENGTH) {
    bodyText = bodyText.slice(0, MAX_BODY_TEXT_LENGTH) + "...";
  }

  return {
    url,
    title,
    metaDescription,
    headings: dedup(headings),
    subheadings: dedup(subheadings),
    buttons: dedup(buttons),
    sections: dedup(sections),
    forms: forms.slice(0, 10),
    trustSignals: dedup(trustSignals),
    bodyText,
    language,
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case "GET_PAGE_DIMENSIONS":
      sendResponse({
        scrollHeight: Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight
        ),
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
      });
      return false;

    case "SCROLL_TO":
      window.scrollTo({ top: message.y, behavior: "instant" as ScrollBehavior });
      sendResponse({ ok: true });
      return false;

    case "EXTRACT_CONTENT":
      try {
        const content = extractPageContent();
        sendResponse({ ok: true, content });
      } catch (err) {
        sendResponse({ ok: false, error: String(err) });
      }
      return false;
  }

  return false;
});
