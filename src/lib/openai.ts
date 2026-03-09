import OpenAI from "openai";
import type { ExtractedContent, UXAuditResult, CompetitorAnalysis } from "./types";
import { uxAuditSchema, identifyCompetitorsSchema, competitorAnalysisSchema } from "./schemas";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * 9-Layer Diagnostic Engine system prompt.
 * Simulates a multi-stage audit pipeline:
 * 1. Structural Decomposition
 * 2. Message Clarity Analysis
 * 3. Cognitive Load Scan
 * 4. Conversion Architecture
 * 5. Trust Signal Inventory
 * 6. Contradiction Detection
 * 7. First-Screen Hypothesis
 * 8. Self-Critique Refinement
 * 9. Synthesis & Rewrite Engine
 */
const SYSTEM_PROMPT = `You are UXLens — the world's most rigorous AI-powered UX diagnostic engine. You conduct structured, multi-layer landing page audits with the precision of a senior conversion rate optimization specialist combined with a cognitive psychologist and a direct-response copywriter.

Your diagnostic process runs in 9 sequential layers. You must complete ALL layers and return a single structured JSON report.

Do NOT invent missing information. Do NOT produce generic UX advice. Every finding must cite specific evidence from the provided content. Return STRICT JSON only.`;

function buildUserPrompt(content: ExtractedContent): string {
  return `Analyze this landing page using the full 9-Layer Diagnostic Algorithm, then return only the final output as JSON.

═══════════════════════════════════════════
LANDING PAGE CONTENT TO AUDIT:
URL: ${content.url}

PAGE TITLE:
${content.title || "(none)"}

META DESCRIPTION:
${content.metaDescription || "(none)"}

HEADINGS:
${content.headings.join("\n") || "(none)"}

SUBHEADINGS:
${content.subheadings.join("\n") || "(none)"}

BUTTON LABELS:
${content.buttons.join("\n") || "(none)"}

SECTIONS:
${content.sections.join("\n") || "(none)"}

FORMS:
${content.forms.join("\n") || "(none)"}

TRUST SIGNALS:
${content.trustSignals.join("\n") || "(none)"}

BODY TEXT:
${content.bodyText || "(none)"}
═══════════════════════════════════════════

═══════════════════════════════════════════
THE 9-LAYER DIAGNOSTIC ALGORITHM
═══════════════════════════════════════════

LAYER 1 — STRUCTURAL DECOMPOSITION
Identify and inventory all page elements present in the content:
- Hero section (headline, subheadline, CTA)
- Value proposition block
- Feature/benefit sections
- Social proof (testimonials, reviews, logos, ratings)
- Trust signals (guarantees, certifications, security)
- Pricing section
- FAQ or objection handling
- Footer / secondary navigation
Flag any structurally missing critical sections.

LAYER 2 — MESSAGE CLARITY ANALYSIS (Weight: 22%)
Evaluate on 5 sub-dimensions:
a) Headline power: Is it specific, outcome-focused, and immediately graspable?
b) Value prop clarity: Can a stranger understand the core offer in 5 seconds?
c) Target audience signal: Does copy speak to a specific person or vague "everyone"?
d) Benefit vs. feature ratio: Is the copy benefit-led or feature-dumping?
e) Semantic precision: Are claims concrete with numbers/specifics, or vague fluff?
Score each 0–20. Sum = layer score (max 100).

LAYER 3 — COGNITIVE LOAD SCAN (Weight: 15%)
Analyze:
a) Information density: Too much / too little on first screen?
b) Jargon & complexity: Words that require domain knowledge to decode?
c) Decision paralysis triggers: Too many choices, options, or paths?
d) Friction vocabulary: Words like "try", "maybe", "could" that dilute commitment?
e) Scannability: Can someone skim and understand the offer in 8 seconds?
Score each 0–20.

LAYER 4 — CONVERSION ARCHITECTURE (Weight: 20%)
Evaluate:
a) CTA specificity: Is the action clear, specific, and low-risk?
b) CTA urgency: Any time/scarcity signal? Genuine or manufactured?
c) Action pathway logic: Is there one clear next step, or multiple competing CTAs?
d) Above-fold conversion readiness: Can someone decide to click without scrolling?
e) Micro-commitment opportunities: Are there smaller asks before the main CTA?
Score each 0–20.

LAYER 5 — TRUST SIGNAL INVENTORY (Weight: 18%)
Catalog and evaluate:
a) Social proof quantity & quality: Numbers, named sources, specific outcomes?
b) Authority signals: Media mentions, awards, certifications, notable clients?
c) Risk reversal: Guarantees, free trials, refund policies present?
d) Recency signals: Is the product/service clearly still active and maintained?
e) Identity credibility: Do we know who built this? Is there human presence?
Score each 0–20.

LAYER 6 — CONTRADICTION DETECTION (Weight: 10%)
Perform a cross-check audit:
a) Identify any claims that contradict each other (e.g., "simple" but feature-list is 12 items long)
b) Spot vague superlatives without backing ("best", "most powerful", "fastest") — flag each
c) Detect promises that aren't substantiated anywhere on the page
d) Check for tone inconsistency (formal header + casual CTA, etc.)
e) Find missing proof for any quantitative claim made (e.g., "10x faster" — where's the evidence?)
Output: list of contradictions found, each with specific quote and explanation.

LAYER 7 — FIRST-SCREEN HYPOTHESIS (Weight: 10%)
Simulate a cold-traffic visitor arriving for the first time:
- What is their immediate understanding of what this is?
- What question goes unanswered above the fold?
- What is the dominant emotion the first screen triggers? (confusion, curiosity, clarity, excitement, doubt)
- What's the #1 reason they would leave within 8 seconds?
- Confidence score: 0–100 that they understand the offer without scrolling.

LAYER 8 — SELF-CRITIQUE REFINEMENT
Now challenge your own findings:
- Are any of your identified issues actually non-issues for this specific audience or product type?
- Did you flag anything too harshly that is actually a deliberate stylistic choice?
- Is there a finding that seems like an issue but is actually consistent with a specific conversion strategy (e.g., minimal copy for premium products)?
- Revise or drop any findings that don't survive critical scrutiny.
- Also: identify any missed issues you may have overlooked in earlier layers.

LAYER 9 — SYNTHESIS & REWRITE ENGINE
Generate:
1. A weighted overall UX score (0–100) combining all layer scores using weights: 0.22*messageClarity + 0.15*cognitiveLoad + 0.20*conversionArch + 0.18*trustSignals + 0.10*contradictions + 0.10*firstScreen + 0.05*selfCritiqueAdjustment
2. Top 3 conversion killers (ranked by impact)
3. Quick wins (changes achievable in under 1 hour)
4. Strategic fixes (require more thought/testing)
5. Rewritten hero: new headline, new subheadline, new CTA
6. One-paragraph executive summary

═══════════════════════════════════════════
OUTPUT INSTRUCTIONS
═══════════════════════════════════════════
Return ONLY a valid JSON object. No markdown, no code fences, no explanations outside the JSON.

The JSON structure must be exactly:
{
  "overallScore": <number 0-100>,
  "grade": <string: "Critical", "Poor", "Needs Work", "Decent", "Good", "Strong", "Excellent">,
  "executiveSummary": <string: 2-3 sentence summary>,
  "conversionKillers": [<string>, <string>, <string>],
  "quickWins": [<string>, <string>, <string>],
  "strategicFixes": [<string>, <string>],
  "flags": [<string: short flag label, max 4>],
  "categories": {
    "messageClarity":    { "score": <0-100>, "note": <string: 1-sentence insight> },
    "cognitiveLoad":     { "score": <0-100>, "note": <string> },
    "conversionArch":    { "score": <0-100>, "note": <string> },
    "trustSignals":      { "score": <0-100>, "note": <string> },
    "contradictions":    { "score": <0-100>, "note": <string> },
    "firstScreen":       { "score": <0-100>, "note": <string> }
  },
  "sections": [
    {
      "id": "hero",
      "name": "Hero Section",
      "icon": "target",
      "score": <0-100>,
      "subtitle": <string>,
      "findings": [
        { "type": <"issue"|"warning"|"positive">, "title": <string>, "desc": <string>, "impact": <"high"|"medium"|"low"> }
      ],
      "recommendations": [<string>, <string>]
    },
    {
      "id": "messaging",
      "name": "Message & Copy",
      "icon": "pen",
      "score": <0-100>,
      "subtitle": <string>,
      "findings": [...],
      "recommendations": [...]
    },
    {
      "id": "cta",
      "name": "CTA & Conversion",
      "icon": "zap",
      "score": <0-100>,
      "subtitle": <string>,
      "findings": [...],
      "recommendations": [...]
    },
    {
      "id": "trust",
      "name": "Trust & Credibility",
      "icon": "shield",
      "score": <0-100>,
      "subtitle": <string>,
      "findings": [...],
      "recommendations": [...]
    },
    {
      "id": "structure",
      "name": "Page Structure",
      "icon": "layers",
      "score": <0-100>,
      "subtitle": <string>,
      "findings": [...],
      "recommendations": [...]
    },
    {
      "id": "contradictions",
      "name": "Contradiction Scan",
      "icon": "search",
      "score": <0-100>,
      "subtitle": <string>,
      "findings": [...],
      "recommendations": [...]
    },
    {
      "id": "firstscreen",
      "name": "First-Screen Experience",
      "icon": "eye",
      "score": <0-100>,
      "subtitle": <string>,
      "findings": [...],
      "recommendations": [...]
    }
  ],
  "firstScreenAnalysis": {
    "immediateUnderstanding": <string>,
    "unansweredQuestion": <string>,
    "dominantEmotion": <string>,
    "exitReason": <string>,
    "clarityConfidence": <0-100>
  },
  "confusionMap": {
    "jargonScore": <0-100>,
    "densityScore": <0-100>,
    "frictionWords": <0-100>,
    "decisionParalysis": <0-100>
  },
  "trustMatrix": [
    { "label": "Social proof", "score": <0-100> },
    { "label": "Authority signals", "score": <0-100> },
    { "label": "Risk reversal", "score": <0-100> },
    { "label": "Recency signals", "score": <0-100> },
    { "label": "Human identity", "score": <0-100> }
  ],
  "rewrite": {
    "beforeHeadline": <string: original or reconstructed headline>,
    "beforeSubheadline": <string>,
    "beforeCTA": <string>,
    "afterHeadline": <string: optimized headline>,
    "afterSubheadline": <string: optimized subheadline>,
    "afterCTA": <string: optimized CTA>,
    "rewriteRationale": <string: why the rewrite is better>
  }
}`;
}

/**
 * Retry helper with exponential backoff.
 * Retries on transient OpenAI errors (rate limit, server error, timeout).
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const isRetryable =
        err instanceof Error &&
        (err.message.includes("429") ||
          err.message.includes("500") ||
          err.message.includes("502") ||
          err.message.includes("503") ||
          err.message.includes("timeout") ||
          err.message.includes("ECONNRESET"));

      if (!isRetryable || attempt === maxRetries) {
        throw err;
      }

      // Exponential backoff: 1s, 2s
      const delay = Math.pow(2, attempt) * 1000;
      console.warn(
        `OpenAI request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`,
        err instanceof Error ? err.message : err
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

/**
 * Send extracted page content to OpenAI and get a structured UX audit
 * using the 9-Layer Diagnostic Engine.
 * Retries up to 2 times on transient failures (rate limits, server errors).
 */
export async function generateUXAudit(
  content: ExtractedContent
): Promise<UXAuditResult> {
  const response = await withRetry(() =>
    getClient().chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 4096,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(content) },
      ],
    })
  );

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("No response from OpenAI");
  }

  const parsed = JSON.parse(raw);
  const validated = uxAuditSchema.parse(parsed);
  return validated;
}

/* ─────────────────────────────────────────────────────────
   Competitor Analysis (Pro+)
   ───────────────────────────────────────────────────────── */

/**
 * Step 1: Identify the 2 biggest competitors for a given landing page.
 * Small, fast GPT-4o call (~512 tokens).
 */
export async function identifyCompetitors(
  url: string,
  headline: string,
  executiveSummary: string
): Promise<{ url: string; name: string; reasoning: string }[]> {
  const response = await withRetry(() =>
    getClient().chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 512,
      messages: [
        {
          role: "system",
          content: `You are a market research analyst. Given a landing page URL, headline, and summary, identify the 2 biggest direct competitors in the same market. Return their actual, real website URLs — NOT made-up URLs. Only return competitors that are real, well-known companies with live websites. Return STRICT JSON only.`,
        },
        {
          role: "user",
          content: `Identify the 2 biggest direct competitors for this landing page:

URL: ${url}
HEADLINE: ${headline}
SUMMARY: ${executiveSummary}

Return JSON:
{
  "competitors": [
    { "url": "https://competitor1.com", "name": "Competitor Name", "reasoning": "Why they're a direct competitor" },
    { "url": "https://competitor2.com", "name": "Competitor Name", "reasoning": "Why they're a direct competitor" }
  ]
}

Rules:
- Only return REAL companies with live, public websites
- URLs must be the main marketing/landing page (not a subpage)
- Competitors must be in the SAME market/category, not just tangentially related
- If the site is too niche to identify 2 competitors, return just 1`,
        },
      ],
    })
  );

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("No response from OpenAI");

  const parsed = JSON.parse(raw);
  const validated = identifyCompetitorsSchema.parse(parsed);
  return validated.competitors;
}

/**
 * Step 2: Deep competitor comparison.
 * Full GPT-4o call analyzing all 3 sites side-by-side.
 */
export async function generateCompetitorComparison(
  userUrl: string,
  userContent: ExtractedContent,
  userAuditScores: {
    overallScore: number;
    categories: UXAuditResult["categories"];
  },
  competitors: {
    url: string;
    name: string;
    content: ExtractedContent;
  }[]
): Promise<CompetitorAnalysis> {
  function summarizeContent(c: ExtractedContent): string {
    return `URL: ${c.url}
TITLE: ${c.title || "(none)"}
META: ${c.metaDescription || "(none)"}
HEADINGS: ${c.headings.slice(0, 8).join(" | ") || "(none)"}
BUTTONS: ${c.buttons.slice(0, 8).join(" | ") || "(none)"}
TRUST SIGNALS: ${c.trustSignals.slice(0, 6).join(" | ") || "(none)"}
BODY TEXT (first 1500 chars): ${(c.bodyText || "").slice(0, 1500)}`;
  }

  const compSections = competitors
    .map(
      (c, i) => `
═══ COMPETITOR ${i + 1}: ${c.name} ═══
${summarizeContent(c.content)}`
    )
    .join("\n\n");

  const userCats = userAuditScores.categories;

  const response = await withRetry(() =>
    getClient().chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 4096,
      messages: [
        {
          role: "system",
          content: `You are a senior UX competitive analyst. You compare landing pages across 6 UX categories using the same methodology as UXLens audits. Your job is to:
1. Score each competitor on the same 6 categories (messageClarity, cognitiveLoad, conversionArch, trustSignals, contradictions, firstScreen)
2. Identify what each competitor does BETTER and WORSE than the user's site
3. Provide 5 actionable competitive advantages the user can implement
4. Give a 2-3 sentence competitive position summary

Be specific: cite actual content from each site. Do not give generic advice. Return STRICT JSON only.`,
        },
        {
          role: "user",
          content: `Compare this user's landing page against their competitors.

═══ USER'S SITE ═══
${summarizeContent(userContent)}

USER'S AUDIT SCORES (already calculated):
- Overall: ${userAuditScores.overallScore}/100
- Message Clarity: ${userCats.messageClarity.score}/100
- Cognitive Load: ${userCats.cognitiveLoad.score}/100
- Conversion Arch: ${userCats.conversionArch.score}/100
- Trust Signals: ${userCats.trustSignals.score}/100
- Contradictions: ${userCats.contradictions.score}/100
- First Screen: ${userCats.firstScreen.score}/100

${compSections}

Return JSON:
{
  "competitors": [
    {
      "url": "...",
      "name": "...",
      "estimatedScore": <0-100 overall>,
      "estimatedGrade": "Critical|Poor|Needs Work|Decent|Good|Strong|Excellent",
      "categories": {
        "messageClarity": { "score": <0-100>, "note": "..." },
        "cognitiveLoad": { "score": <0-100>, "note": "..." },
        "conversionArch": { "score": <0-100>, "note": "..." },
        "trustSignals": { "score": <0-100>, "note": "..." },
        "contradictions": { "score": <0-100>, "note": "..." },
        "firstScreen": { "score": <0-100>, "note": "..." }
      },
      "strengths": ["3 things they do better than the user"],
      "weaknesses": ["3 things the user does better than them"]
    }
  ],
  "categoryComparisons": [
    {
      "category": "Message Clarity",
      "userScore": ${userCats.messageClarity.score},
      "competitor1Score": <0-100>,
      "competitor2Score": <0-100>,
      "winner": "user|competitor1|competitor2",
      "insight": "one-sentence comparison insight"
    }
    // ... for all 6 categories
  ],
  "competitiveAdvantages": ["5 specific, actionable recommendations based on competitor weaknesses"],
  "competitivePosition": "2-3 sentence summary of competitive standing",
  "userOverallScore": ${userAuditScores.overallScore},
  "averageCompetitorScore": <average of competitor scores>,
  "scoreGap": <userScore minus averageCompetitorScore>
}`,
        },
      ],
    })
  );

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("No response from OpenAI");

  const parsed = JSON.parse(raw);
  const validated = competitorAnalysisSchema.parse(parsed);
  return validated;
}
