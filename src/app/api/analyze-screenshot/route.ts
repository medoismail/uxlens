import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { uxAuditSchema } from "@/lib/schemas";
import { checkServerUsage, incrementServerUsage } from "@/lib/server-usage";
import { getUserByClerkId, upsertUser } from "@/lib/db/users";
import { saveAudit } from "@/lib/db/audits";
import { getSupabase } from "@/lib/supabase";
import type { AnalysisError, UXAuditResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function errorResponse(error: string, code: AnalysisError["code"], status = 400) {
  return NextResponse.json(
    { success: false, error, code } satisfies AnalysisError,
    { status }
  );
}

/**
 * Screenshot-specific system prompt for GPT-4o vision.
 * Adapted from the text-based SYSTEM_PROMPT to work with visual-only analysis.
 */
const SCREENSHOT_SYSTEM_PROMPT = `You are UXLens Diagnostic Engine v0.7 — an expert AI UX auditor. You are analyzing a screenshot of a UI/webpage. You must READ all visible text from the image and perform a complete 10-layer UX diagnostic.

Your process:
1. First, READ all visible text (headings, body, buttons, labels, navigation)
2. Then analyze the visual design (layout, hierarchy, colors, spacing)
3. Apply the full 10-layer diagnostic just as if you had the page's HTML content

IMPORTANT: Since you're working from a screenshot only, base your analysis on what you can SEE. If text is partially cut off or unclear, note it. Focus on visible UI/UX patterns, not assumptions.

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

═══ BEHAVIORAL FRAMING ═══
You are diagnosing user decision-making behavior, not producing a checklist.

For every signal, reason through: EVIDENCE → EXPERIENCE → MECHANISM → STAGE → CASCADE
1. OBSERVABLE EVIDENCE: Cite the specific page element (headline text, CTA label, section position, element count)
2. USER EXPERIENCE: Narrate the visitor's inner experience — what they feel, think, or struggle with
3. BEHAVIORAL MECHANISM: Name AND explain the principle. Not just "cognitive fluency" but how it operates HERE. Key mechanisms: cognitive fluency (processing difficulty attributed to product), loss aversion (losses weighted 2x vs gains), signal absence bias (missing proof = negative evidence), Hick's Law (decision time ∝ options), Miller's Law (7±2 working memory), progressive disclosure, F/Z-pattern scanning
4. JOURNEY STAGE: Map to awareness → consideration → evaluation → conviction → action
5. FRICTION CASCADE: Trace downstream — broken awareness prevents consideration; broken trust wastes evaluation effort

═══ AUDITOR MINDSET ═══
Think like a senior UX researcher. Do NOT summarize — diagnose.

Ground every analysis in observable evidence: headline structure (outcome vs feature?), CTA placement (scanning path position?), information hierarchy (visual weight matches importance?), trust signal placement (before or after the ask?), content density (concepts per viewport — >4 causes fatigue), section order (matches visitor question sequence?).

Diagnostic cascade patterns:
- Headline ambiguity → mental model mismatch → wrong evaluation frame → bounce
- Weak messaging → specification gap → price comparison default
- Missing trust → signal absence bias → exponential doubt escalation
- Flow friction → attention depletion → decision fatigue at CTA
- Claim-UI inconsistency → credibility gap → skepticism mode
- Dense sections → cognitive overload → reading → scanning → skipping

═══ FINDING QUALITY STANDARDS ═══
Every finding must connect: page element → visitor psychology → behavioral consequence → specific fix.

Per finding: (1) CITE the specific element, (2) EXPLAIN the mechanism and why it hurts, (3) IDENTIFY who it affects and at which stage, (4) TRACE the cascade, (5) PRESCRIBE a specific implementable fix.

GOOD: "The headline communicates category but not outcome. Visitor must interpret 3 ambiguous concepts in the 5-second clarity window. Cognitive fluency: processing difficulty is attributed to the product itself. Fix: Lead with the specific outcome."
BAD: "The hero could be clearer."

Fixes must be specific enough for a developer to implement without follow-up. For positives: explain WHY the design choice works psychologically.

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
- Base every conclusion on visible evidence from the screenshot
- Do NOT invent UI elements or features that are not visible
- Do NOT make assumptions without justification
- If evidence is limited or text is partially obscured, say so briefly and stay grounded
- Prioritize meaningful findings over quantity
- NEVER repeat the same issue across different sections. Each finding must be unique. If "lack of social proof" is flagged in the Trust section, do NOT flag it again in First Screen or Hero. Cross-reference your findings before finalizing to eliminate overlaps and duplicates.
- Prefer precision over verbosity
- Focus on user impact, not design taste
- Judge the page by real-world UX and conversion standards, not by whether it simply "looks modern"
- Return STRICT JSON only — no markdown, no code fences, no explanations outside the JSON

═══ VISUAL DESIGN ANALYSIS ═══
Since you are working from a screenshot, also evaluate:
- Color contrast and readability
- Visual hierarchy (size, weight, color used to guide attention)
- Whitespace and breathing room
- Alignment and grid consistency
- Typography choices and legibility
- Button/CTA visual prominence
- Overall aesthetic coherence

═══ SELF-CHECK ═══
Before finalizing, verify: Does each finding cite specific page evidence? Does it explain the psychological mechanism? Does it trace the cascade? Are recommendations implementable without follow-up? What would confuse, hesitate, or bounce a first-time visitor?

CRITICAL LANGUAGE RULE: If the page content is in a non-English language (detected from visible text), you MUST provide ALL analysis, findings, recommendations, rewrites, executive summary, and every text value in that SAME language. JSON keys must stay in English (they are part of the schema), but ALL string values must be in the website's language. If the page is in Arabic, respond in Arabic. If in French, respond in French. Only use English if the page is in English or if the language cannot be determined.`;

/**
 * Build the user prompt for screenshot analysis (includes OUTPUT INSTRUCTIONS).
 */
function buildScreenshotUserPrompt(): string {
  return `Analyze this UI screenshot using the full 10-Layer Diagnostic Algorithm. Read all visible text and evaluate the visual design. Return the complete UXAuditResult JSON.

═══════════════════════════════════════════
THE 10-LAYER DIAGNOSTIC ALGORITHM
═══════════════════════════════════════════

LAYER 1 — STRUCTURAL DECOMPOSITION
Identify and inventory all visible page elements:
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
Score each 0-20. Sum = layer score (max 100).

LAYER 3 — COGNITIVE LOAD SCAN (Weight: 15%)
Analyze:
a) Information density: Too much / too little on first screen?
b) Jargon & complexity: Words that require domain knowledge to decode?
c) Decision paralysis triggers: Too many choices, options, or paths?
d) Friction vocabulary: Words like "try", "maybe", "could" that dilute commitment?
e) Scannability: Can someone skim and understand the offer in 8 seconds?
Score each 0-20.

LAYER 4 — CONVERSION ARCHITECTURE (Weight: 20%)
Evaluate:
a) CTA specificity: Is the action clear, specific, and low-risk?
b) CTA urgency: Any time/scarcity signal? Genuine or manufactured?
c) Action pathway logic: Is there one clear next step, or multiple competing CTAs?
d) Above-fold conversion readiness: Can someone decide to click without scrolling?
e) Micro-commitment opportunities: Are there smaller asks before the main CTA?
Score each 0-20.

LAYER 5 — TRUST SIGNAL INVENTORY (Weight: 18%)
Catalog and evaluate:
a) Social proof quantity & quality: Numbers, named sources, specific outcomes?
b) Authority signals: Media mentions, awards, certifications, notable clients?
c) Risk reversal: Guarantees, free trials, refund policies present?
d) Recency signals: Is the product/service clearly still active and maintained?
e) Identity credibility: Do we know who built this? Is there human presence?
Score each 0-20.

LAYER 6 — CONTRADICTION DETECTION (Weight: 10%)
Perform a cross-check audit:
a) Identify any claims that contradict each other
b) Spot vague superlatives without backing ("best", "most powerful", "fastest") — flag each
c) Detect promises that aren't substantiated anywhere on the page
d) Check for tone inconsistency (formal header + casual CTA, etc.)
e) Find missing proof for any quantitative claim made
Output: list of contradictions found, each with specific quote and explanation.

LAYER 7 — FIRST-SCREEN HYPOTHESIS (Weight: 10%)
Simulate a cold-traffic visitor arriving for the first time:
- What is their immediate understanding of what this is?
- What question goes unanswered above the fold?
- What is the dominant emotion the first screen triggers?
- What's the #1 reason they would leave within 8 seconds?
- Confidence score: 0-100 that they understand the offer without scrolling.

LAYER 8 — SELF-CRITIQUE REFINEMENT
Challenge your own findings:
- Are any of your identified issues actually non-issues for this specific audience?
- Did you flag anything too harshly that is actually a deliberate stylistic choice?
- Revise or drop any findings that don't survive critical scrutiny.
- Identify any missed issues you may have overlooked in earlier layers.

LAYER 9 — SYNTHESIS & REWRITE ENGINE
Generate:
1. A weighted overall UX score (0-100)
2. Top 3 conversion killers (ranked by impact)
3. Quick wins (changes achievable in under 1 hour)
4. Strategic fixes (require more thought/testing)
5. Rewritten hero: new headline, new subheadline, new CTA
6. One-paragraph executive summary
7. Per-section rewrites

LAYER 10 — NIELSEN'S HEURISTIC EVALUATION
Evaluate the page against all 10 of Jakob Nielsen's usability heuristics. For each heuristic, provide:
- A score from 0 (severe violation) to 10 (excellent compliance)
- 1-3 specific issues found
- 0-2 things the page does well

Also identify 3-5 UX Strengths.

PROFESSIONAL UX AUDIT CATEGORIES — For EACH finding, include:
- "severity": "low" | "medium" | "high" | "critical"
- "category": Information Hierarchy | UX Microcopy & Messaging | CTA Clarity | Visual Hierarchy | Interaction & Feedback | Navigation & Flow | Trust & Credibility Signals | Accessibility | Conversion Optimization | Performance & Loading UX | Consistency & Design System
- "whyItMatters": 1 sentence — behavioral consequence
- "recommendedFix": specific implementable change
- "userExperience": visitor's inner experience at this friction point
- "behavioralMechanism": principle name + how it operates here
- "journeyStage": "awareness" | "consideration" | "evaluation" | "conviction" | "action"
- "frictionCascade": downstream cascade through decision stages

═══════════════════════════════════════════
OUTPUT INSTRUCTIONS
═══════════════════════════════════════════
Return ONLY a valid JSON object. No markdown, no code fences, no explanations outside the JSON.

The JSON structure must be exactly:
{
  "overallScore": <number 0-100>,
  "grade": <string: "Critical", "Poor", "Needs Work", "Decent", "Good", "Strong", "Excellent">,
  "executiveSummary": <string: 2-3 sentences>,
  "conversionKillers": [
    { "title": <string>, "description": <string>, "affectedVisitors": <string>, "behavioralCascade": <string>, "expectedLift": <string> }
  ],
  "quickWins": [
    { "text": <string>, "expectedImpact": <string> }
  ],
  "strategicFixes": [
    { "text": <string>, "expectedImpact": <string> }
  ],
  "flags": [<string, max 4>],
  "categories": {
    "messageClarity":    { "score": <0-100>, "note": <string: 3-4 sentences> },
    "cognitiveLoad":     { "score": <0-100>, "note": <string: 3-4 sentences> },
    "conversionArch":    { "score": <0-100>, "note": <string: 3-4 sentences> },
    "trustSignals":      { "score": <0-100>, "note": <string: 3-4 sentences> },
    "contradictions":    { "score": <0-100>, "note": <string: 3-4 sentences> },
    "firstScreen":       { "score": <0-100>, "note": <string: 3-4 sentences> }
  },
  "sections": [
    {
      "id": "hero", "name": "Hero Section", "icon": "target",
      "score": <0-100>, "subtitle": <string>,
      "findings": [
        { "type": <"issue"|"warning"|"positive">, "title": <string>, "desc": <string>, "impact": <"high"|"medium"|"low">, "severity": <string>, "category": <string>, "whyItMatters": <string>, "recommendedFix": <string>, "userExperience": <string>, "behavioralMechanism": <string>, "journeyStage": <string>, "frictionCascade": <string> }
      ],
      "recommendations": [<string>],
      "rewrite": { "type": "text", "items": [{ "label": "Headline", "before": "<actual>", "after": "<improved>" }], "rationale": "<why>" }
    },
    { "id": "messaging", "name": "Message & Copy", "icon": "pen", ... },
    { "id": "cta", "name": "CTA & Conversion", "icon": "zap", ... },
    { "id": "trust", "name": "Trust & Credibility", "icon": "shield", ... },
    { "id": "structure", "name": "Page Structure", "icon": "layers", ..., "rewrite": { "type": "structure", "suggestedOrder": [...], "additions": [...], "removals": [...], "rationale": "..." } },
    { "id": "contradictions", "name": "Contradiction Scan", "icon": "search", ..., "rewrite": { "type": "structure", ... } },
    { "id": "firstscreen", "name": "First-Screen Experience", "icon": "eye", ... }
  ],
  "firstScreenAnalysis": {
    "immediateUnderstanding": <string>, "unansweredQuestion": <string>,
    "dominantEmotion": <string>, "exitReason": <string>,
    "clarityConfidence": <0-100>,
    "visitorMentalModel": <string>, "decisionBarrier": <string>,
    "attentionSequence": [<string>, <string>, <string>]
  },
  "confusionMap": {
    "jargonScore": <0-100>, "densityScore": <0-100>,
    "frictionWords": <0-100>, "decisionParalysis": <0-100>,
    "jargonImpact": <string>, "densityImpact": <string>,
    "frictionImpact": <string>, "paralysisImpact": <string>
  },
  "trustMatrix": [
    { "label": "Social proof", "score": <0-100>, "behavioralNote": <string> },
    { "label": "Authority signals", "score": <0-100>, "behavioralNote": <string> },
    { "label": "Risk reversal", "score": <0-100>, "behavioralNote": <string> },
    { "label": "Recency signals", "score": <0-100>, "behavioralNote": <string> },
    { "label": "Human identity", "score": <0-100>, "behavioralNote": <string> }
  ],
  "rewrite": {
    "beforeHeadline": <string>, "beforeSubheadline": <string>, "beforeCTA": <string>,
    "afterHeadline": <string>, "afterSubheadline": <string>, "afterCTA": <string>,
    "rewriteRationale": <string>
  },
  "heuristicEvaluation": {
    "heuristics": [
      { "id": "visibility", "name": "Visibility of System Status", "score": <0-10>, "issues": [...], "passes": [...] },
      { "id": "match", "name": "Match Between System and Real World", "score": <0-10>, "issues": [...], "passes": [...] },
      { "id": "control", "name": "User Control & Freedom", "score": <0-10>, "issues": [...], "passes": [...] },
      { "id": "consistency", "name": "Consistency & Standards", "score": <0-10>, "issues": [...], "passes": [...] },
      { "id": "error-prevention", "name": "Error Prevention", "score": <0-10>, "issues": [...], "passes": [...] },
      { "id": "recognition", "name": "Recognition Rather Than Recall", "score": <0-10>, "issues": [...], "passes": [...] },
      { "id": "flexibility", "name": "Flexibility & Efficiency of Use", "score": <0-10>, "issues": [...], "passes": [...] },
      { "id": "aesthetic", "name": "Aesthetic & Minimalist Design", "score": <0-10>, "issues": [...], "passes": [...] },
      { "id": "error-recovery", "name": "Error Recovery", "score": <0-10>, "issues": [...], "passes": [...] },
      { "id": "help", "name": "Help & Documentation", "score": <0-10>, "issues": [...], "passes": [...] }
    ],
    "overallHeuristicScore": <0-10>
  },
  "uxStrengths": ["<positive UX decision>", "<positive UX decision 2>", "<positive UX decision 3>"]
}

═══════════════════════════════════════════
QUALITY REMINDERS
═══════════════════════════════════════════

CRITICAL REMINDERS:
- Cite SPECIFIC page evidence for every finding. No generic advice.
- For every behavioral mechanism: name it AND explain how it operates on THIS page.
- Category notes: evidence → psychology → consequence → specific fix.
- Every recommendation: specific enough for a developer to implement without follow-up.
- Avoid: "could be improved", "consider adding" → use: "Replace X with Y because Z"
- The 5 questions test: What is this? Who is it for? Why should I care? Why trust it? What do I do?
- If the page is in a non-English language, ALL text values must be in that same language`;
}

/**
 * Retry helper with exponential backoff for OpenAI calls.
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

      const delay = Math.pow(2, attempt) * 1000;
      console.warn(
        `[AnalyzeScreenshot] OpenAI retry (attempt ${attempt + 1}/${maxRetries + 1}) in ${delay}ms...`,
        err instanceof Error ? err.message : err
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

export async function POST(request: Request) {
  try {
    // 1. Parse FormData and extract image
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return errorResponse("Invalid form data. Please upload an image.", "PARSE_FAILED");
    }

    const imageFile = formData.get("image");
    if (!imageFile || !(imageFile instanceof File)) {
      return errorResponse("Missing image file. Please upload a PNG, JPG, or WebP image.", "PARSE_FAILED");
    }

    if (!ALLOWED_TYPES.includes(imageFile.type)) {
      return errorResponse(
        "Unsupported image format. Please upload a PNG, JPG, or WebP image.",
        "PARSE_FAILED"
      );
    }

    if (imageFile.size > MAX_FILE_SIZE) {
      return errorResponse("Image too large. Maximum file size is 10 MB.", "PARSE_FAILED");
    }

    const email = formData.get("email") as string | undefined;

    // 2. Run auth + usage check in parallel with image processing
    let clerkUserId: string | undefined;

    const [authResult, imageBuffer] = await Promise.all([
      // Auth + usage check
      (async () => {
        try {
          const { userId } = await auth();
          if (userId) clerkUserId = userId;
        } catch {
          // Anonymous user
        }
        return checkServerUsage(request, email || undefined, clerkUserId);
      })(),
      // Read image into buffer
      imageFile.arrayBuffer().then((ab) => Buffer.from(ab)),
    ]);

    // Check usage limits
    if (!authResult.audit_allowed) {
      return NextResponse.json(
        {
          success: false,
          error: authResult.reason,
          code: "USAGE_LIMIT",
          usage: authResult,
        } satisfies AnalysisError,
        { status: 429 }
      );
    }

    // 3. Upload image to Supabase Storage
    const sb = getSupabase();
    let screenshotUrl: string | undefined;

    if (sb) {
      const ext = imageFile.type === "image/png" ? "png" : imageFile.type === "image/webp" ? "webp" : "jpg";
      const uniquePath = `uploads/${Date.now()}-${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await sb.storage
        .from("screenshots")
        .upload(uniquePath, imageBuffer, {
          contentType: imageFile.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("[AnalyzeScreenshot] Supabase upload error:", uploadError);
        // Non-fatal: continue with analysis even if upload fails
      } else {
        const { data: publicUrlData } = sb.storage
          .from("screenshots")
          .getPublicUrl(uniquePath);
        screenshotUrl = publicUrlData.publicUrl;
      }
    }

    // 4. Convert image to base64 for GPT-4o vision
    const base64Image = imageBuffer.toString("base64");
    const mimeType = imageFile.type;

    // 5. Send to GPT-4o vision
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    let audit: UXAuditResult | null = null;

    try {
      const rawResult = await withRetry(async () => {
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          temperature: 0.4,
          max_tokens: 16384,
          messages: [
            { role: "system", content: SCREENSHOT_SYSTEM_PROMPT },
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64Image}`,
                    detail: "high",
                  },
                },
                {
                  type: "text",
                  text: buildScreenshotUserPrompt(),
                },
              ],
            },
          ],
        });

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error("Empty response from GPT-4o");
        return content;
      });

      // 6. Parse and validate JSON response
      let jsonString = rawResult.trim();

      // Strip markdown code fences if present
      if (jsonString.startsWith("```")) {
        jsonString = jsonString.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonString);
      } catch {
        console.error("[AnalyzeScreenshot] JSON parse failed. Raw output:", jsonString.substring(0, 500));
        return errorResponse(
          "The AI response could not be parsed. Please try again.",
          "PARSE_FAILED",
          500
        );
      }

      const validated = uxAuditSchema.safeParse(parsed);
      if (!validated.success) {
        console.error("[AnalyzeScreenshot] Schema validation failed:", validated.error.issues.slice(0, 5));
        // Attempt to use the parsed data even if some optional fields are missing
        // The schema has many optional fields, so partial validation is acceptable
        audit = parsed as UXAuditResult;
      } else {
        audit = validated.data as UXAuditResult;
      }
    } catch (err) {
      console.error("[AnalyzeScreenshot] AI analysis failed:", err);
      return errorResponse(
        "We couldn't analyze the screenshot right now. Please try again.",
        "AI_FAILED",
        500
      );
    }

    if (!audit) {
      return errorResponse(
        "We couldn't generate the analysis right now. Please try again.",
        "AI_FAILED",
        500
      );
    }

    // 7. Increment usage (fire-and-forget)
    incrementServerUsage(request, email || undefined, clerkUserId).catch(() => {});

    // 8. Save audit to Supabase if authenticated (fire-and-forget)
    let auditId: string | undefined;
    if (clerkUserId) {
      try {
        let dbUser = await getUserByClerkId(clerkUserId);
        if (!dbUser) {
          const clerkUser = await currentUser();
          if (clerkUser?.emailAddresses?.[0]?.emailAddress) {
            dbUser = await upsertUser(clerkUserId, clerkUser.emailAddresses[0].emailAddress);
          }
        }
        if (dbUser) {
          const id = await saveAudit({
            userId: dbUser.id,
            url: "screenshot://uploaded",
            result: audit,
            screenshotPath: screenshotUrl,
          });
          if (id) auditId = id;
        }
      } catch {
        console.error("[AnalyzeScreenshot] Failed to save audit to Supabase");
      }
    }

    // 9. Return result
    return NextResponse.json({
      success: true,
      data: audit,
      url: "screenshot://uploaded",
      ...(auditId && { auditId }),
      ...(screenshotUrl && { screenshotUrl }),
    });
  } catch (err) {
    console.error("[AnalyzeScreenshot] Unexpected error:", err);
    return errorResponse(
      "Something went wrong. Please try again.",
      "PARSE_FAILED",
      500
    );
  }
}
