import * as cheerio from "cheerio";
import type { ExtractedContent } from "./types";

const MAX_BODY_TEXT_LENGTH = 3000;
const MAX_ITEMS = 50;

/** Trust-related keywords to detect trust signals in page content */
const TRUST_KEYWORDS = [
  "testimonial", "review", "rating", "trusted by", "customers",
  "case study", "case studies", "logo", "partner", "client",
  "guarantee", "money back", "secure", "certified", "award",
  "featured in", "as seen on", "proof", "verified", "ssl",
];

/** Deduplicate and trim an array of strings */
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

/**
 * Extract structured content from raw HTML.
 * Pulls out headings, buttons, forms, trust signals, and body text
 * into a compact payload suitable for AI analysis.
 */
export function extractPageContent(html: string, url: string): ExtractedContent {
  const $ = cheerio.load(html);

  // Remove scripts, styles, and hidden elements to clean the DOM
  $("script, style, noscript, svg, iframe, [hidden], [aria-hidden='true']").remove();

  const title = $("title").first().text().trim();
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    "";

  // Collect headings: h1 as primary, h2/h3 as subheadings
  const headings: string[] = [];
  $("h1").each((_, el) => {
    const text = $(el).text().trim();
    if (text) headings.push(text);
  });

  const subheadings: string[] = [];
  $("h2, h3").each((_, el) => {
    const text = $(el).text().trim();
    if (text) subheadings.push(text);
  });

  // Collect button labels and CTA-like links
  const buttons: string[] = [];
  $("button, [role='button'], a.btn, a.button, a.cta, input[type='submit']").each((_, el) => {
    const text =
      $(el).text().trim() ||
      $(el).attr("value")?.trim() ||
      $(el).attr("aria-label")?.trim() ||
      "";
    if (text && text.length < 100) buttons.push(text);
  });

  // Detect links that look like CTAs (short text, action-oriented)
  $("a").each((_, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr("href") || "";
    if (
      text &&
      text.length < 60 &&
      text.length > 2 &&
      !href.startsWith("#") &&
      /sign|start|try|get|join|buy|subscribe|demo|contact|learn/i.test(text)
    ) {
      buttons.push(text);
    }
  });

  // Detect major page sections via semantic elements and common class names
  const sections: string[] = [];
  $("section, [class*='section'], [class*='hero'], [class*='feature'], [class*='pricing'], [class*='testimonial'], [class*='faq'], footer, header, nav").each(
    (_, el) => {
      const tag = el.type === "tag" ? el.tagName : "";
      const cls = $(el).attr("class") || "";
      const id = $(el).attr("id") || "";
      const label = [tag, cls, id].filter(Boolean).join(" ").slice(0, 100);
      if (label) sections.push(label);
    }
  );

  // Detect forms
  const forms: string[] = [];
  $("form").each((_, el) => {
    const action = $(el).attr("action") || "";
    const inputs: string[] = [];
    $(el)
      .find("input, textarea, select")
      .each((_, input) => {
        const name =
          $(input).attr("name") ||
          $(input).attr("placeholder") ||
          $(input).attr("type") ||
          "";
        if (name) inputs.push(name);
      });
    forms.push(`Form(action=${action || "none"}, fields=[${inputs.join(", ")}])`);
  });

  // Detect trust signals by scanning text content for trust keywords
  const trustSignals: string[] = [];
  const fullText = $("body").text().toLowerCase();
  for (const keyword of TRUST_KEYWORDS) {
    if (fullText.includes(keyword)) {
      trustSignals.push(keyword);
    }
  }

  // Also look for common trust-related elements
  $("[class*='testimonial'], [class*='review'], [class*='trust'], [class*='logo'], [class*='partner'], [class*='client']").each(
    (_, el) => {
      const text = $(el).text().trim().slice(0, 200);
      if (text) trustSignals.push(text);
    }
  );

  // Extract body text, stripping excess whitespace
  let bodyText = $("body")
    .text()
    .replace(/\s+/g, " ")
    .trim();

  // Trim to token-efficient length
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
  };
}

/**
 * Check if the extracted content has enough substance for a meaningful analysis.
 * Returns false if the page is essentially empty.
 */
export function hasEnoughContent(content: ExtractedContent): boolean {
  const hasText = content.bodyText.length > 30;
  const hasTitle = content.title.length > 0;
  const hasMeta = content.metaDescription.length > 0;
  const hasStructure =
    content.headings.length > 0 ||
    content.subheadings.length > 0 ||
    content.buttons.length > 0;
  return hasText || hasStructure || (hasTitle && hasMeta);
}
