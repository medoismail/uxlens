import OpenAI from "openai";
import type { ExtractedContent, UXAuditResult } from "./types";
import { uxAuditSchema } from "./schemas";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Multi-role UX audit system prompt.
 * Simulates 3 internal roles: UX Analyst → UX Critic → Final Reviewer
 * to produce professional, non-generic, evidence-based audits.
 */
const SYSTEM_PROMPT = `You are a multi-stage UX audit system for landing page analysis.
You operate as three internal roles sequentially:

ROLE 1 — UX ANALYST: Perform structured diagnosis.
- Detect the offer, target user, and promised outcome.
- Analyze the first screen experience (headline, CTA, trust).
- Evaluate message clarity (vague language, buzzwords, unclear benefits).
- Check conversion architecture (CTA, testimonials, pricing, FAQ, visuals).
- Detect confusion (competing CTAs, unclear category, headline/CTA mismatch).
- Generate improved hero section copy.
- Compute initial UX score.

ROLE 2 — UX CRITIC: Review the analyst's work critically.
- Flag generic advice, missing issues, incorrect assumptions, unjustified scores.
- Suggest score adjustments and stronger recommendations.

ROLE 3 — FINAL REVIEWER: Produce the corrected final audit.
- Remove generic advice, strengthen recommendations.
- Ensure evidence-based reasoning using only provided content.
- Make the report concise but actionable.

Do NOT invent missing information. Do NOT produce generic UX advice.
Focus on conversion, clarity, trust, and user understanding.
Return STRICT JSON only.`;

function buildUserPrompt(content: ExtractedContent): string {
  return `Analyze this landing page. Run all 3 internal roles, then return only the final corrected output as JSON.

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

Scoring weights for ux_score:
0.25 * first_screen_clarity + 0.20 * message_clarity_score + 0.20 * conversion_structure_score + 0.15 * trust_first_screen + 0.20 * confusion_score

Return JSON in this exact shape:
{
  "offer_detection": {
    "offer_detected": "what the page sells",
    "target_user_guess": "who the target user is",
    "outcome_guess": "what outcome is promised",
    "confidence": 0-100
  },
  "scores": {
    "first_screen_clarity": 0-100,
    "cta_strength": 0-100,
    "trust_first_screen": 0-100,
    "message_clarity_score": 0-100,
    "conversion_structure_score": 0-100,
    "confusion_score": 0-100,
    "ux_score": 0-100
  },
  "major_issues": ["specific issue found"],
  "missing_conversion_elements": ["missing element"],
  "confusing_phrases": ["confusing phrase from the page"],
  "hero_rewrite": {
    "headline": "improved headline",
    "subheadline": "improved subheadline",
    "cta": "improved CTA text"
  },
  "quick_fixes": ["specific actionable fix"],
  "audit_quality_score": 0-100
}`;
}

/**
 * Send extracted page content to OpenAI and get a structured UX audit.
 * Uses the 3-role system for higher quality, non-generic results.
 */
export async function generateUXAudit(
  content: ExtractedContent
): Promise<UXAuditResult> {
  const response = await getClient().chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    temperature: 0.4,
    max_tokens: 3000,
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
