import OpenAI from "openai";
import type { ExtractedContent, UXAuditResult } from "./types";
import { uxAuditSchema } from "./schemas";

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
 * Send extracted page content to OpenAI and get a structured UX audit
 * using the 9-Layer Diagnostic Engine.
 */
export async function generateUXAudit(
  content: ExtractedContent
): Promise<UXAuditResult> {
  const response = await getClient().chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    temperature: 0.4,
    max_tokens: 4096,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(content) },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("No response from OpenAI");
  }

  const parsed = JSON.parse(raw);
  const validated = uxAuditSchema.parse(parsed);
  return validated;
}
