import OpenAI from "openai";
import type { ExtractedContent, UXAuditResult, CompetitorAnalysis } from "./types";
import { uxAuditSchema, identifyCompetitorsSchema, competitorAnalysisSchema } from "./schemas";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * 10-Layer Diagnostic Engine system prompt.
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
 * 10. Nielsen's Heuristic Evaluation
 */
const SYSTEM_PROMPT = `You are UXLens Diagnostic Engine v5 — an expert AI UX auditor specialized in landing page analysis, conversion optimization, usability diagnostics, heuristic evaluation, and visual communication strategy.

Your role is NOT to casually review a page. Your role is to perform a professional-grade UX audit as if a real business depends on it.

═══ YOUR EXPERT IDENTITY ═══
You operate with the combined expertise of:
- Senior UX Researcher — observing user behavior, scanning patterns, and cognitive friction
- CRO (Conversion Rate Optimization) Strategist — maximizing action probability at every step
- Information Architecture Specialist — evaluating hierarchy, structure, and content organization
- Usability Heuristic Evaluator — applying Nielsen's 10 principles with rigor
- Product Designer — focused on clarity, trust, and action readiness

═══ EVALUATION LENSES ═══
You evaluate every page through 10 lenses simultaneously:
1. Clarity of value proposition
2. Information hierarchy and scanning behavior
3. Cognitive load and friction
4. Conversion pathway strength
5. CTA clarity and action readiness
6. Trust and credibility signals
7. Consistency and interaction logic
8. Accessibility and readability
9. Nielsen usability heuristics
10. First impression for cold traffic users

═══ THE 5 QUESTIONS ═══
Assume the visitor is unfamiliar with the brand and arrives with limited attention, low patience, and many alternatives. Assess whether the page quickly answers:
- What is this?
- Who is it for?
- Why should I care?
- Why should I trust it?
- What should I do next?

═══ AUDITOR MINDSET ═══
Think like a real UX auditor. Do NOT merely summarize the page — interrogate it.
- Detect ambiguity
- Detect weak messaging
- Detect missed opportunities
- Detect friction in flow
- Detect trust gaps
- Detect inconsistency between claims and UI
- Detect sections that increase effort without increasing clarity
- Detect places where users may hesitate, bounce, or fail to act

═══ FINDING QUALITY STANDARDS ═══
Your analysis must be practical, evidence-based, specific, and strategically useful. Avoid generic advice, shallow praise, and filler. Do not explain UX theory unless it directly supports a finding.

For every issue, determine: what exactly is wrong, where it appears, why it matters, how strongly it affects usability or conversion, and what should be improved.

For every positive observation, explain why it is effective from a UX perspective.

GOOD finding example: "The hero communicates the product category, but not the concrete outcome. Users may understand what the tool is, yet still fail to grasp why it is meaningfully better or what specific result they will get. This weakens first-screen conversion intent."

BAD finding example: "The hero could be clearer and more engaging."

When recommending fixes: make them actionable, tie them to the actual issue, prefer realistic improvements over vague redesign advice, and do not suggest unnecessary complexity.

═══ SEVERITY GUIDELINES ═══
- Critical: likely blocks trust, understanding, or conversion
- High: meaningfully harms usability, clarity, or action completion
- Medium: creates friction or weakens effectiveness
- Low: noticeable but not severely damaging

═══ AUDIT BEHAVIOR RULES ═══
- Do not stop at description; interpret impact
- Do not stop at criticism; explain consequence
- Do not stop at suggestion; explain why the fix helps
- Distinguish between usability issues and conversion issues
- Distinguish between clarity issues and visual issues
- Treat the first screen as disproportionately important
- Treat weak value communication as a major issue
- Treat vague CTAs as conversion friction
- Treat missing trust signals as hesitation amplifiers
- Treat excessive density as cognitive load
- Treat inconsistency between promise and content as trust erosion
- Reward pages that reduce uncertainty quickly

═══ VISITOR ASSUMPTIONS ═══
Assume the visitor is:
- New to the product
- Scanning quickly
- Moderately skeptical
- Comparing alternatives
- Unwilling to read everything
- Looking for a clear reason to trust and act

═══ HARD RULES ═══
- Base every conclusion on visible evidence from the provided content
- Do NOT invent UI elements or features that are not present
- Do NOT make assumptions without justification
- If evidence is limited, say so briefly and stay grounded
- Prioritize meaningful findings over quantity
- Prefer precision over verbosity
- Focus on user impact, not design taste
- Judge the page by real-world UX and conversion standards, not by whether it simply "looks modern"
- Return STRICT JSON only — no markdown, no code fences, no explanations outside the JSON

═══ SELF-CHECK ═══
Before finalizing the audit, silently ask yourself:
- What would confuse a first-time visitor?
- What would make them hesitate?
- What would make them bounce?
- What would make them trust this page more?
- What is undersold despite being valuable?

CRITICAL LANGUAGE RULE: If the page content is in a non-English language (detected from the lang attribute or the actual content), you MUST provide ALL analysis, findings, recommendations, rewrites, executive summary, and every text value in that SAME language. JSON keys must stay in English (they are part of the schema), but ALL string values must be in the website's language. If the page is in Arabic, respond in Arabic. If in French, respond in French. Only use English if the page is in English or if the language cannot be determined.`;

function buildUserPrompt(content: ExtractedContent): string {
  return `Analyze this landing page using the full 10-Layer Diagnostic Algorithm, then return only the final output as JSON.

═══════════════════════════════════════════
LANDING PAGE CONTENT TO AUDIT:
URL: ${content.url}
DETECTED LANGUAGE: ${content.language || "not detected (assume English)"}

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
THE 10-LAYER DIAGNOSTIC ALGORITHM
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
7. Per-section rewrites: For EACH of the 7 sections, generate a "rewrite" object with concrete, copy-paste-ready improvements:

   TEXT REWRITE sections (hero, messaging, cta, trust, firstscreen):
   Return type "text" with 2-4 before/after items. Each item must quote the ACTUAL original copy from the page as "before" and provide an improved version as "after". Include a label for what each item is (e.g. "Headline", "CTA button", "Value proposition").

   STRUCTURE REWRITE sections (structure, contradictions):
   Return type "structure" with suggestedOrder (optimal section ordering), additions (sections/elements to add), and removals (sections/elements to remove or reword).

   Every rewrite must reference specific content from the page — no generic advice.

LAYER 10 — NIELSEN'S HEURISTIC EVALUATION
Evaluate the page against all 10 of Jakob Nielsen's usability heuristics. For each heuristic, provide:
- A score from 0 (severe violation) to 10 (excellent compliance)
- 1-3 specific issues found (cite evidence from the page content)
- 0-2 things the page does well for this heuristic

The 10 heuristics:
1. Visibility of System Status (id: "visibility") — Does the page communicate what's happening? Loading indicators, progress states, action feedback?
2. Match Between System and Real World (id: "match") — Does the language match the user's mental model? Familiar metaphors and terms?
3. User Control & Freedom (id: "control") — Can users undo, go back, or escape? Clear exit points and navigation?
4. Consistency & Standards (id: "consistency") — Does the page follow platform conventions? Consistent terminology and UI patterns?
5. Error Prevention (id: "error-prevention") — Does the design prevent mistakes? Good form validation and input constraints?
6. Recognition Rather Than Recall (id: "recognition") — Is information visible when needed? Minimal memory load?
7. Flexibility & Efficiency of Use (id: "flexibility") — Shortcuts for power users? Efficient for both novice and expert?
8. Aesthetic & Minimalist Design (id: "aesthetic") — Is irrelevant information minimized? Clean, focused visual design?
9. Help Users Recognize, Diagnose, and Recover from Errors (id: "error-recovery") — Clear, constructive error messages? Solution-oriented guidance?
10. Help & Documentation (id: "help") — Is help available if needed? Easy to find and task-focused?

Score 5 = adequate, below 5 = problems found, above 7 = good, 10 = exceptional. Be critical but fair.

Also identify 3-5 UX Strengths — positive UX decisions the page makes well. These are things the page does RIGHT.

PROFESSIONAL UX AUDIT CATEGORIES — For EACH finding in every section, you MUST assign these additional fields:
- "severity": "low" | "medium" | "high" | "critical" — how severe is this issue?
- "category": one of these professional audit categories:
  Information Hierarchy, UX Microcopy & Messaging, CTA Clarity, Visual Hierarchy,
  Interaction & Feedback, Navigation & Flow, Trust & Credibility Signals,
  Accessibility, Conversion Optimization, Performance & Loading UX, Consistency & Design System
- "whyItMatters": 1 sentence explaining the UX impact of this issue
- "recommendedFix": 1-2 sentence actionable fix recommendation

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
        { "type": <"issue"|"warning"|"positive">, "title": <string>, "desc": <string>, "impact": <"high"|"medium"|"low">, "severity": <"low"|"medium"|"high"|"critical">, "category": <string: professional UX audit category>, "whyItMatters": <string: 1 sentence UX impact>, "recommendedFix": <string: actionable fix> }
      ],
      "recommendations": [<string>, <string>],
      "rewrite": {
        "type": "text",
        "items": [
          { "label": "Headline", "before": "<actual headline from page>", "after": "<improved headline>" },
          { "label": "Subheadline", "before": "<actual subheadline>", "after": "<improved subheadline>" },
          { "label": "CTA button", "before": "<actual CTA text>", "after": "<improved CTA>" }
        ],
        "rationale": "<why these changes improve conversion>"
      }
    },
    {
      "id": "messaging",
      "name": "Message & Copy",
      "icon": "pen",
      "score": <0-100>,
      "subtitle": <string>,
      "findings": [...],
      "recommendations": [...],
      "rewrite": { "type": "text", "items": [{ "label": "Value proposition", "before": "...", "after": "..." }, ...], "rationale": "..." }
    },
    {
      "id": "cta",
      "name": "CTA & Conversion",
      "icon": "zap",
      "score": <0-100>,
      "subtitle": <string>,
      "findings": [...],
      "recommendations": [...],
      "rewrite": { "type": "text", "items": [{ "label": "Primary CTA", "before": "...", "after": "..." }, ...], "rationale": "..." }
    },
    {
      "id": "trust",
      "name": "Trust & Credibility",
      "icon": "shield",
      "score": <0-100>,
      "subtitle": <string>,
      "findings": [...],
      "recommendations": [...],
      "rewrite": { "type": "text", "items": [{ "label": "Social proof header", "before": "...", "after": "..." }, ...], "rationale": "..." }
    },
    {
      "id": "structure",
      "name": "Page Structure",
      "icon": "layers",
      "score": <0-100>,
      "subtitle": <string>,
      "findings": [...],
      "recommendations": [...],
      "rewrite": {
        "type": "structure",
        "suggestedOrder": ["Hero", "Social Proof", "Features/Benefits", "Pricing", "FAQ", "Final CTA"],
        "additions": ["<sections to add>"],
        "removals": ["<sections to remove or reword>"],
        "rationale": "..."
      }
    },
    {
      "id": "contradictions",
      "name": "Contradiction Scan",
      "icon": "search",
      "score": <0-100>,
      "subtitle": <string>,
      "findings": [...],
      "recommendations": [...],
      "rewrite": { "type": "structure", "suggestedOrder": [], "additions": ["<claims to add for consistency>"], "removals": ["<contradictory claims to remove>"], "rationale": "..." }
    },
    {
      "id": "firstscreen",
      "name": "First-Screen Experience",
      "icon": "eye",
      "score": <0-100>,
      "subtitle": <string>,
      "findings": [...],
      "recommendations": [...],
      "rewrite": { "type": "text", "items": [{ "label": "Above-fold headline", "before": "...", "after": "..." }, ...], "rationale": "..." }
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
  },
  "heuristicEvaluation": {
    "heuristics": [
      { "id": "visibility", "name": "Visibility of System Status", "score": <0-10>, "issues": ["<specific issue>"], "passes": ["<what works>"] },
      { "id": "match", "name": "Match Between System and Real World", "score": <0-10>, "issues": ["..."], "passes": ["..."] },
      { "id": "control", "name": "User Control & Freedom", "score": <0-10>, "issues": ["..."], "passes": ["..."] },
      { "id": "consistency", "name": "Consistency & Standards", "score": <0-10>, "issues": ["..."], "passes": ["..."] },
      { "id": "error-prevention", "name": "Error Prevention", "score": <0-10>, "issues": ["..."], "passes": ["..."] },
      { "id": "recognition", "name": "Recognition Rather Than Recall", "score": <0-10>, "issues": ["..."], "passes": ["..."] },
      { "id": "flexibility", "name": "Flexibility & Efficiency of Use", "score": <0-10>, "issues": ["..."], "passes": ["..."] },
      { "id": "aesthetic", "name": "Aesthetic & Minimalist Design", "score": <0-10>, "issues": ["..."], "passes": ["..."] },
      { "id": "error-recovery", "name": "Error Recovery", "score": <0-10>, "issues": ["..."], "passes": ["..."] },
      { "id": "help", "name": "Help & Documentation", "score": <0-10>, "issues": ["..."], "passes": ["..."] }
    ],
    "overallHeuristicScore": <0-10, average of all 10 heuristic scores>
  },
  "uxStrengths": ["<positive UX decision 1>", "<positive UX decision 2>", "<positive UX decision 3>"]
}

═══════════════════════════════════════════
QUALITY REMINDERS
═══════════════════════════════════════════

Remember: you are a sharp senior UX auditor reviewing a real SaaS landing page for growth, usability, and conversion performance.

- Every finding must cite specific evidence from the page content above
- Write like a professional UX consultant: direct, concrete, non-generic, business-aware, user-centered
- Do NOT produce filler or shallow praise
- Severity must be justified by real user impact
- Recommended fixes must be actionable and tied to the specific issue
- Think in terms of user behavior: what draws attention first, what causes hesitation, what reduces trust, what increases confidence, what improves action probability
- The 5 questions test: Does the page answer What is this? Who is it for? Why should I care? Why should I trust it? What should I do next?
- If the page is in a non-English language, ALL text values in your JSON must be in that same language`;
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
 * using the 10-Layer Diagnostic Engine.
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
      max_tokens: 12288,
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
   AI Vision: Heatmap + Visual Analysis (Diagnostic Engine v5)
   ───────────────────────────────────────────────────────── */

/**
 * Send a screenshot to AI vision and get AI-generated attention hotspots.
 * The AI analyzes visual hierarchy, contrast, size, positioning, and color
 * to determine where a real user's eyes would be drawn.
 */
export async function generateVisionHeatmap(
  screenshotBase64: string
): Promise<import("./types").VisionHotspot[]> {
  const { visionHeatmapResponseSchema } = await import("./schemas");

  const response = await withRetry(() =>
    getClient().chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 2048,
      messages: [
        {
          role: "system",
          content: `You are an expert eye-tracking analyst and UX researcher. Given a screenshot of a web page, identify 8-15 areas where a user's visual attention would naturally be drawn in the first 10 seconds of viewing.

Use these eye-tracking principles:
- F-pattern / Z-pattern reading behavior (Western languages read left-to-right, top-to-bottom)
- Large elements with high contrast draw attention first
- Faces and images of people attract strong fixation
- Color contrast against the background (bright CTAs on muted backgrounds)
- Isolated elements with whitespace around them get more attention
- Above-the-fold content gets 80% of attention
- Interactive elements (buttons, forms) draw deliberate attention
- Text size and font weight indicate visual hierarchy
- Motion or animation cues (even in a static screenshot, visual dynamism)

Return coordinates as NORMALIZED values (0-1) relative to the full image dimensions:
- (0,0) = top-left corner
- (1,1) = bottom-right corner
- x and width are fractions of image width
- y and height are fractions of image height

CRITICAL: Be precise with coordinates. Each hotspot should tightly wrap the actual visual element, not be vague or oversized.

Return STRICT JSON only.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this web page screenshot and identify the attention hotspots. For each hotspot, specify the bounding box, intensity level, what the element is, and WHY it draws attention.

Return JSON:
{
  "hotspots": [
    {
      "x": <0-1 normalized left edge>,
      "y": <0-1 normalized top edge>,
      "width": <0-1 fraction of image width>,
      "height": <0-1 fraction of image height>,
      "intensity": "high" | "medium" | "low",
      "label": "<what this element is, e.g. 'Hero headline', 'Primary CTA button'>",
      "reason": "<brief reason why it draws attention>"
    }
  ]
}

Rules:
- Return 8-15 hotspots, sorted by visual priority (most attention-grabbing first)
- Mark the single most prominent CTA/button as "high"
- Main headline: usually "high"
- Supporting elements: "medium"
- Navigation, footer, subtle links: "low"
- Be specific in labels — "Sign Up Free button" not just "button"`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${screenshotBase64}`,
                detail: "high",
              },
            },
          ],
        },
      ],
    })
  );

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("No response from OpenAI vision (heatmap)");

  const parsed = JSON.parse(raw);
  const validated = visionHeatmapResponseSchema.parse(parsed);
  return validated.hotspots;
}

/**
 * Send a screenshot to AI vision for visual UX design analysis.
 * Evaluates layout, visual hierarchy, whitespace, color/contrast, and mobile readiness.
 */
export async function generateVisualAnalysis(
  screenshotBase64: string
): Promise<import("./types").VisualAnalysis> {
  const { visualAnalysisSchema } = await import("./schemas");

  const response = await withRetry(() =>
    getClient().chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 2048,
      messages: [
        {
          role: "system",
          content: `You are a senior UX visual designer and conversion rate optimization expert conducting a professional visual audit. You are looking at the ACTUAL rendered page — not code, not wireframes, the real thing.

You audit this page as a high-stakes business asset, not as a casual design critique. Think like a sharp senior auditor: detect where users may get confused, where cognitive effort is too high, where the page undersells itself, where flow breaks down, and where it succeeds.

Evaluate the page across 5 visual dimensions:

1. LAYOUT (0-100): Grid alignment, section spacing, visual rhythm, content organization. Is the page well-structured or chaotic?

2. VISUAL HIERARCHY (0-100): Can you instantly identify what's most important? Is the reading order clear? Does size/weight/color properly guide the eye from primary → secondary → tertiary content?

3. WHITESPACE (0-100): Is breathing room well-used? Is the page too cramped (low score) or too sparse (medium)? Does whitespace create clear content groups?

4. COLOR & CONTRAST (0-100): Are CTAs visually prominent against backgrounds? Is text readable? Does the color palette feel cohesive and intentional? Are there accessibility issues with contrast?

5. MOBILE READINESS (0-100): Based on the desktop layout, how well would this degrade on a phone? Are touch targets large enough? Is text readable without zooming? Would the layout stack well?

Also identify 3-5 specific visual issues, warnings, or positives — things you can SEE in the screenshot.

For each finding: describe what you observe, explain the user behavior impact, and suggest a specific fix. Avoid vague or generic observations like "the layout could be improved" — instead cite the specific element and its visual consequence.

Severity: Critical = blocks trust/conversion, High = meaningfully harms usability, Medium = creates friction, Low = noticeable but minor.

Every finding must cite what you OBSERVE in the screenshot. No generic advice.

Return STRICT JSON only.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Perform a visual UX audit of this page screenshot. Think like a senior auditor — what draws attention first? What causes hesitation? What reduces trust? What improves action probability?

Return JSON:
{
  "layoutScore": <0-100>,
  "visualHierarchyScore": <0-100>,
  "whitespaceScore": <0-100>,
  "colorContrastScore": <0-100>,
  "mobileReadinessScore": <0-100>,
  "overallVisualScore": <0-100 weighted average>,
  "findings": [
    { "type": "issue"|"warning"|"positive", "title": "<short title>", "desc": "<what you see, why it matters for users, and what to fix>", "impact": "high"|"medium"|"low" }
  ],
  "summary": "<2-3 sentence visual design assessment — be specific about what works and what doesn't, not generic>"
}

Quality rules:
- Cite specific elements you see (e.g. "the blue CTA button in the hero" not "the buttons")
- Explain user behavior impact, not just design opinion
- Prioritize findings by conversion and usability impact
- Good finding: "The primary CTA sits below a dense text block, reducing its visibility. Users scanning quickly may miss it entirely."
- Bad finding: "The CTA placement could be better."`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${screenshotBase64}`,
                detail: "high",
              },
            },
          ],
        },
      ],
    })
  );

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("No response from OpenAI vision (visual analysis)");

  const parsed = JSON.parse(raw);
  return visualAnalysisSchema.parse(parsed);
}

/* ─────────────────────────────────────────────────────────
   Competitor Analysis (Pro+)
   ───────────────────────────────────────────────────────── */

/**
 * Step 1: Identify the 2 biggest competitors for a given landing page.
 * Small, fast AI call (~512 tokens).
 */
export async function identifyCompetitors(
  url: string,
  headline: string,
  executiveSummary: string,
  additionalContext?: {
    metaDescription?: string;
    subheadings?: string[];
    buttons?: string[];
    title?: string;
  }
): Promise<{ url: string; name: string; reasoning: string }[]> {
  // Build rich context for better identification
  const extraContext = [
    additionalContext?.title ? `PAGE TITLE: ${additionalContext.title}` : "",
    additionalContext?.metaDescription ? `META DESCRIPTION: ${additionalContext.metaDescription}` : "",
    additionalContext?.subheadings?.length ? `KEY SUBHEADINGS: ${additionalContext.subheadings.slice(0, 5).join(" | ")}` : "",
    additionalContext?.buttons?.length ? `CTA BUTTONS: ${additionalContext.buttons.slice(0, 5).join(" | ")}` : "",
  ].filter(Boolean).join("\n");

  const response = await withRetry(() =>
    getClient().chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 512,
      messages: [
        {
          role: "system",
          content: `You are a senior market research analyst specializing in competitive intelligence. Given detailed information about a landing page, you must identify the 2 most direct competitors in the EXACT same market niche.

Your process:
1. First, determine the specific industry/niche and the exact product category
2. Then identify competitors that serve the SAME audience with a SIMILAR product
3. Only return real, well-known companies with live websites

Return STRICT JSON only.`,
        },
        {
          role: "user",
          content: `Identify the 2 biggest direct competitors for this landing page:

URL: ${url}
HEADLINE: ${headline}
SUMMARY: ${executiveSummary}
${extraContext}

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
- Competitors must be in the SAME market/category with similar products, not just tangentially related
- Consider the specific product type, target audience, and pricing tier when selecting competitors
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
 * Full AI call analyzing all 3 sites side-by-side.
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

Be specific: cite actual content from each site. Do not give generic advice. Return STRICT JSON only.

If the user's site is in a non-English language, provide all insights, strengths, weaknesses, competitive advantages, and position summary in that same language. JSON keys stay English, only values change.`,
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
