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
const SYSTEM_PROMPT = `You are UXLens Diagnostic Engine v0.7 — an expert AI UX auditor specialized in analyzing ANY digital interface: landing pages, web apps, mobile apps, signup forms, dashboards, checkout flows, onboarding screens, settings pages, and more.

Your role is NOT to casually review a page. Your role is to perform a professional-grade UX audit as if a real business depends on it.

═══ STEP ZERO — PAGE TYPE DETECTION ═══
Before auditing, FIRST identify what type of interface this is. Set "pageType" in your output to one of:
- "landing" — Marketing/sales landing page, homepage, product page
- "app" — Web or mobile application interface, dashboard, admin panel
- "signup" — Registration, login, onboarding, or account creation flow
- "checkout" — Payment, cart, pricing, or purchase flow
- "form" — Contact form, survey, application form, multi-step wizard
- "content" — Blog, documentation, help center, knowledge base
- "other" — Anything else (portfolio, directory, tool, etc.)

CRITICAL: Your entire audit must ADAPT to the detected page type. Do NOT evaluate a signup form as if it were a landing page. Do NOT judge a dashboard by "conversion" or "cold traffic" criteria.

═══ PAGE-TYPE ADAPTATION RULES ═══

For LANDING PAGES: Focus on value proposition clarity, conversion pathway, trust signals, cold-traffic first impression. The 5 Questions apply fully.

For APP INTERFACES: Focus on task completion efficiency, navigation clarity, information architecture, feature discoverability, cognitive load per task, error handling, system status feedback. Replace "conversion" thinking with "task success" thinking. Judge hierarchy by workflow priority, not sales funnel.

For SIGNUP/LOGIN FORMS: Focus on form friction, field count & necessity, error messages, password requirements clarity, social login options, progressive disclosure, trust signals (privacy, security), time-to-complete, abandonment risk factors.

For CHECKOUT FLOWS: Focus on cart clarity, pricing transparency, trust badges, security indicators, shipping/billing UX, error recovery, progress indication, urgency vs pressure balance, payment method variety.

For FORMS: Focus on field grouping, label clarity, validation feedback, required vs optional, help text, progressive disclosure, mobile-friendliness, submission confirmation.

For CONTENT PAGES: Focus on readability, scanning support, navigation depth, search, content hierarchy, related content discovery, typography, information density.

═══ YOUR EXPERT IDENTITY ═══
You operate with the combined expertise of:
- Senior UX Researcher — observing user behavior, scanning patterns, and cognitive friction
- CRO (Conversion Rate Optimization) Strategist — maximizing action probability at every step
- Information Architecture Specialist — evaluating hierarchy, structure, and content organization
- Usability Heuristic Evaluator — applying Nielsen's 10 principles with rigor
- Product Designer — focused on clarity, trust, and action readiness
- Product Engineer — evaluating app flows, form logic, and interaction patterns

═══ EVALUATION LENSES ═══
You evaluate every interface through 10 lenses, ADAPTED to the page type:
1. Clarity of purpose / value proposition (landing) OR task clarity (app/form)
2. Information hierarchy and scanning behavior
3. Cognitive load and friction
4. Conversion pathway (landing/checkout) OR task completion flow (app/form)
5. CTA clarity (landing) OR action affordance (app) OR submit flow (form)
6. Trust and credibility signals
7. Consistency and interaction logic
8. Accessibility and readability
9. Nielsen usability heuristics
10. First impression / onboarding experience

═══ THE 5 QUESTIONS (adapted per page type) ═══

For LANDING PAGES:
- What is this? / Who is it for? / Why should I care? / Why should I trust it? / What should I do next?

For APP INTERFACES:
- What can I do here? / Where am I in the app? / How do I complete my task? / Is my data safe? / What happens next?

For SIGNUP/FORMS:
- What am I signing up for? / How long will this take? / Why do they need this info? / Is my data secure? / What happens after I submit?

For CHECKOUT:
- What am I paying for? / Is the price clear? / Is this secure? / Can I change my mind? / What happens after payment?

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

═══ USER ASSUMPTIONS (adapted per page type) ═══

For LANDING PAGES — assume the visitor is:
- New to the product, scanning quickly, moderately skeptical, comparing alternatives, looking for a clear reason to trust and act

For APP INTERFACES — assume the user is:
- Already signed in, trying to complete a specific task, expects familiar patterns, has limited patience for confusion, values efficiency over aesthetics

For SIGNUP/LOGIN — assume the user is:
- Partially interested but not committed, weighing effort vs reward, privacy-conscious, on the verge of abandoning if friction is too high

For CHECKOUT — assume the user is:
- Already decided to buy but easily spooked, scanning for hidden costs, needing security reassurance, comparing against other payment experiences

For FORMS — assume the user is:
- Task-oriented, wants to finish quickly, unsure what's required, anxious about errors, expecting clear feedback

═══ HARD RULES ═══
- Base every conclusion on visible evidence from the provided content
- Do NOT invent UI elements or features that are not present
- Do NOT make assumptions without justification
- If evidence is limited, say so briefly and stay grounded
- Prioritize meaningful findings over quantity
- NEVER repeat the same issue across different sections. Each finding must be unique. If "lack of social proof" is flagged in the Trust section, do NOT flag it again in First Screen or Hero. Cross-reference your findings before finalizing to eliminate overlaps and duplicates.
- Prefer precision over verbosity
- Focus on user impact, not design taste
- Judge the page by real-world UX and conversion standards, not by whether it simply "looks modern"
- Return STRICT JSON only — no markdown, no code fences, no explanations outside the JSON

═══ POPUP / OVERLAY CONTENT ═══
The page content provided has been pre-processed to remove common popups, cookie banners, chat widgets, and modal overlays. However, some residual popup text may still appear (e.g., "Accept cookies", "Subscribe to our newsletter", chat widget greetings, GDPR notices). IGNORE any such popup/overlay content entirely — do NOT treat it as part of the landing page's value proposition, messaging, or UX structure. Focus exclusively on the actual page content: headings, body copy, CTAs, forms, trust signals, and navigation.

═══ USER PERSONA FEEDBACK ═══
After completing the technical audit, step into the shoes of 5 different professionals reviewing this page. Each persona sees the page through their unique lens:
- UX Designer: usability patterns, interaction design, accessibility
- Marketing Manager: conversion metrics, brand perception, competitive positioning
- Product Manager: user flow, value communication, feature discoverability
- Developer: implementation quality, performance, responsiveness
- First-Time Visitor: gut reaction, trust, clarity, "do I get it?"
Each must give authentic feedback from their background — not repeat the same points in different words.

═══ REVENUE IMPACT ESTIMATION ═══
For EVERY finding (issue or warning), you MUST include:
- "estimatedConversionLift": Estimate the conversion improvement if this issue is fixed. Use ranges like "+3-8%", "+10-20%", "+1-3%". Base estimates on the severity and the behavioral mechanism involved. Be realistic — not every fix is a 20% lift.
- "estimatedEffort": Estimate implementation effort: "15 min", "30 min", "1 hour", "2 hours", "4 hours", "1 day", "2-3 days", "1 week". Consider both design and development effort.
- "impactHeadline": A short, punchy headline that frames the issue in terms of lost visitors/revenue. Examples: "Losing ~15% of sign-ups to form friction", "Costing 1 in 4 mobile visitors", "Bleeding trust with 60% of first-time visitors". This should feel like a wake-up call, not a dry observation.

For POSITIVE findings, set estimatedConversionLift to the estimated value being preserved (e.g. "+5-10% retained"), estimatedEffort to "—" (already done), and impactHeadline to a positive version (e.g. "Saving ~20% of visitors from bouncing").

Revenue impact rules:
- Critical/high severity → larger lift estimates (10-25%)
- Medium severity → moderate lift (3-10%)
- Low severity → small lift (1-5%)
- These are estimates, not guarantees — use "~" or ranges to show uncertainty
- Landing pages: frame in terms of conversion rate lift
- Apps: frame in terms of task completion or retention improvement
- Forms: frame in terms of completion rate improvement

═══ SELF-CHECK ═══
Before finalizing, verify: Does each finding cite specific page evidence? Does it explain the psychological mechanism? Does it trace the cascade? Are recommendations implementable without follow-up? What would confuse, hesitate, or bounce a first-time visitor?

CRITICAL LANGUAGE RULE: If the page content is in a non-English language (detected from the lang attribute or the actual content), you MUST provide ALL analysis, findings, recommendations, rewrites, executive summary, and every text value in that SAME language. JSON keys must stay in English (they are part of the schema), but ALL string values must be in the website's language. If the page is in Arabic, respond in Arabic. If in French, respond in French. Only use English if the page is in English or if the language cannot be determined.`;

function buildUserPrompt(content: ExtractedContent): string {
  return `First, detect the PAGE TYPE (landing, app, signup, checkout, form, content, or other). Then analyze this interface using the full 10-Layer Diagnostic Algorithm ADAPTED to the detected page type. Return only the final output as JSON.

═══════════════════════════════════════════
PAGE CONTENT TO AUDIT:
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

PROFESSIONAL UX AUDIT CATEGORIES — For EACH finding, include these fields (detailed instructions are in the system prompt):
- "severity": "low" | "medium" | "high" | "critical"
- "category": Information Hierarchy | UX Microcopy & Messaging | CTA Clarity | Visual Hierarchy | Interaction & Feedback | Navigation & Flow | Trust & Credibility Signals | Accessibility | Conversion Optimization | Performance & Loading UX | Consistency & Design System
- "whyItMatters": 1 sentence — behavioral consequence, not label
- "recommendedFix": specific implementable change referencing the actual element
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
  "pageType": <string: "landing" | "app" | "signup" | "checkout" | "form" | "content" | "other">,
  "pageTypeLabel": <string: human-readable label, e.g. "Landing Page", "Web Application", "Signup Form", "Checkout Flow", "Contact Form", "Blog / Documentation", "Other">,
  "overallScore": <number 0-100>,
  "grade": <string: "Critical", "Poor", "Needs Work", "Decent", "Good", "Strong", "Excellent">,
  "executiveSummary": <string: 3-4 sentences — (1) senior consultant behavioral verdict with overall score context, (2) the single biggest conversion leak with estimated revenue impact, (3) the top 3 priorities numbered as "Fix first: [1] ... [2] ... [3] ...", (4) estimated total conversion lift if all critical/high issues are fixed, e.g. "Addressing these issues could improve conversion by an estimated 25-40%.">,
  "conversionKillers": [
    { "title": <string: specific blocker name>, "description": <string: 2-3 sentences citing evidence + mechanism + visitor experience>, "affectedVisitors": <string: which visitors and why>, "behavioralCascade": <string: trace through decision stages>, "expectedLift": <string: estimated lift if fixed> }
  ],
  "quickWins": [
    { "text": <string: specific implementable fix under 1 hour>, "expectedImpact": <string: the behavioral shift this creates> }
  ],
  "strategicFixes": [
    { "text": <string: deeper fix with behavioral rationale>, "expectedImpact": <string: journey-level behavioral shift> }
  ],
  "flags": [<string: short flag label, max 4>],
  "categories": {
    "messageClarity":    { "score": <0-100>, "benchmark": <0-100: industry average for this page type>, "note": <string: 3-4 sentences — (1) what visitor understands in 5s citing headline, (2) awareness-stage gap, (3) behavioral consequence with mechanism, (4) specific fix with expected shift> },
    "cognitiveLoad":     { "score": <0-100>, "benchmark": <0-100>, "note": <string: 3-4 sentences — (1) cognitive demands with counts, (2) scanning behavior impact citing Miller/Hick, (3) visitor experience shift, (4) specific simplification> },
    "conversionArch":    { "score": <0-100>, "benchmark": <0-100>, "note": <string: 3-4 sentences — (1) map conversion pathway citing CTAs, (2) friction points with mechanism, (3) hesitation trigger, (4) specific pathway fix> },
    "trustSignals":      { "score": <0-100>, "benchmark": <0-100>, "note": <string: 3-4 sentences — (1) trust inventory present vs missing, (2) signal absence interpretation, (3) conviction-stage doubt, (4) highest-impact trust addition> },
    "contradictions":    { "score": <0-100>, "benchmark": <0-100>, "note": <string: 3-4 sentences — (1) specific contradictions quoted, (2) credibility erosion via negativity bias, (3) skepticism mode shift, (4) specific resolution> },
    "firstScreen":       { "score": <0-100>, "benchmark": <0-100>, "note": <string: 3-4 sentences — (1) 5-second experience with scanning pattern, (2) mental model match/mismatch, (3) stay/leave trigger with mechanism, (4) highest-impact above-fold change> }
  },
  "sections": [
    {
      "id": "hero",
      "name": "Hero Section",
      "icon": "target",
      "score": <0-100>,
      "subtitle": <string>,
      "findings": [
        { "type": <"issue"|"warning"|"positive">, "title": <string>, "desc": <string>, "impact": <"high"|"medium"|"low">, "severity": <"low"|"medium"|"high"|"critical">, "category": <string>, "whyItMatters": <string>, "recommendedFix": <string>, "userExperience": <string: visitor inner experience>, "behavioralMechanism": <string: principle + how it operates here>, "journeyStage": <"awareness"|"consideration"|"evaluation"|"conviction"|"action">, "frictionCascade": <string: downstream cascade> }
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
    "immediateUnderstanding": <string: what visitor grasps in 5s — describe their understanding, not page content>,
    "unansweredQuestion": <string: most critical unanswered question, framed as visitor's thought>,
    "dominantEmotion": <string: primary emotion AND why — not just label but cause>,
    "exitReason": <string: behavioral trigger for leaving, grounded in psychology>,
    "clarityConfidence": <0-100>,
    "visitorMentalModel": <string: what visitors THINK the page is about — may differ from reality>,
    "decisionBarrier": <string: primary unresolved question blocking engagement>,
    "attentionSequence": [<string: 1st element noticed and why>, <string: 2nd>, <string: 3rd>]
  },
  "confusionMap": {
    "jargonScore": <0-100>,
    "densityScore": <0-100>,
    "frictionWords": <0-100>,
    "decisionParalysis": <0-100>,
    "jargonImpact": <string: 1-2 sentences — cite specific jargon terms found, explain scanning behavior impact>,
    "densityImpact": <string: 1-2 sentences — count concepts per viewport, reference Miller's Law>,
    "frictionImpact": <string: 1-2 sentences — cite specific friction language found, explain confidence impact>,
    "paralysisImpact": <string: 1-2 sentences — count decision points, reference Hick's Law>
  },
  "trustMatrix": [
    { "label": "Social proof", "score": <0-100>, "behavioralNote": <string: 1-2 sentences — count proof signals, explain conviction-stage gap> },
    { "label": "Authority signals", "score": <0-100>, "behavioralNote": <string: 1-2 sentences — identify authority evidence, explain credibility assessment> },
    { "label": "Risk reversal", "score": <0-100>, "behavioralNote": <string: 1-2 sentences — identify guarantees present/absent, explain loss aversion dynamic> },
    { "label": "Recency signals", "score": <0-100>, "behavioralNote": <string: 1-2 sentences — identify activity signals, explain abandonment risk> },
    { "label": "Human identity", "score": <0-100>, "behavioralNote": <string: 1-2 sentences — identify human presence signals, explain trust dynamic> }
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
  "uxStrengths": ["<positive UX decision — explain WHY it works psychologically>", "<positive UX decision 2>", "<positive UX decision 3>"],
  "personaFeedback": [
    { "persona": "UX Designer", "emoji": "🎨", "feedback": "<2-3 sentences — focus on usability patterns, interaction design, accessibility, design system consistency>", "topConcern": "<one short sentence>", "priority": "high|medium|low" },
    { "persona": "Marketing Manager", "emoji": "📈", "feedback": "<2-3 sentences — focus on conversion rate, brand perception, messaging effectiveness, competitive positioning>", "topConcern": "<one short sentence>", "priority": "high|medium|low" },
    { "persona": "Product Manager", "emoji": "🧩", "feedback": "<2-3 sentences — focus on user flow, value communication, feature discoverability, onboarding clarity>", "topConcern": "<one short sentence>", "priority": "high|medium|low" },
    { "persona": "Developer", "emoji": "💻", "feedback": "<2-3 sentences — focus on technical implementation quality, performance indicators, responsive behavior, form handling>", "topConcern": "<one short sentence>", "priority": "high|medium|low" },
    { "persona": "First-Time Visitor", "emoji": "👤", "feedback": "<2-3 sentences — focus on immediate understanding, trust feeling, clarity of next steps, overall first impression>", "topConcern": "<one short sentence>", "priority": "high|medium|low" }
  ]
}

═══════════════════════════════════════════
QUALITY REMINDERS
═══════════════════════════════════════════

═══ INDUSTRY BENCHMARKS ═══
For each category score, include a "benchmark" field — the estimated industry average for this page type. Use these baselines (adjust up or down based on the specific niche):
- Landing pages (SaaS): messageClarity ~60, cognitiveLoad ~55, conversionArch ~50, trustSignals ~55, contradictions ~70, firstScreen ~55
- Landing pages (E-commerce): messageClarity ~55, cognitiveLoad ~50, conversionArch ~55, trustSignals ~60, contradictions ~65, firstScreen ~50
- App interfaces: messageClarity ~65, cognitiveLoad ~45, conversionArch ~60, trustSignals ~70, contradictions ~75, firstScreen ~60
- Signup/Forms: messageClarity ~60, cognitiveLoad ~55, conversionArch ~65, trustSignals ~55, contradictions ~70, firstScreen ~55
These benchmarks help users understand whether their score is above or below average for their type of page.

═══ FINDING QUALITY — BEFORE/AFTER EXAMPLES ═══
For every finding with recommendedFix, include a concrete before/after example when possible. Do NOT just say "improve your headline" — say "Change 'AI-Powered Platform for Teams' to 'Ship campaigns in half the time — no training required'." Specific rewrites, not vague directions.

CRITICAL REMINDERS:
- Cite SPECIFIC page evidence for every finding. No generic advice.
- For every behavioral mechanism: name it AND explain how it operates on THIS page.
- Category notes: evidence → psychology → consequence → specific fix.
- Every recommendation: specific enough for a developer to implement without follow-up.
- Avoid: "could be improved", "consider adding" → use: "Replace X with Y because Z"
- The 5 questions test: What is this? Who is it for? Why should I care? Why trust it? What do I do?
- If the page is in a non-English language, ALL text values must be in that same language
- Persona feedback: Each persona must speak in character. The UX Designer talks about patterns, the Marketing Manager about metrics and positioning, the Developer about code implications, the First-Time Visitor about their gut feeling. No generic advice — each perspective must be distinct.`;
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
      max_tokens: 16384,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(content) },
      ],
    })
  );

  const raw = response.choices[0]?.message?.content;
  const finishReason = response.choices[0]?.finish_reason;

  if (!raw) {
    throw new Error("No response from OpenAI");
  }

  if (finishReason === "length") {
    console.error("[UXAudit] Output truncated — finish_reason=length. Response length:", raw.length);
    throw new Error("AI output was truncated due to token limit. The audit response was too long.");
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (jsonErr) {
    console.error("[UXAudit] JSON parse failed. finish_reason:", finishReason, "raw length:", raw.length, "last 200 chars:", raw.slice(-200));
    throw new Error(`Failed to parse AI response as JSON (finish_reason: ${finishReason})`);
  }

  const result = uxAuditSchema.safeParse(parsed);
  if (!result.success) {
    console.error("[UXAudit] Schema validation failed:", JSON.stringify(result.error.issues.slice(0, 5)));
    // Try lenient parse — strip unknown fields but keep what we can
    const lenient = uxAuditSchema.passthrough().safeParse(parsed);
    if (lenient.success) {
      console.warn("[UXAudit] Passed with passthrough — some fields may be non-standard");
      return lenient.data as UXAuditResult;
    }
    throw new Error(`AI response failed schema validation: ${result.error.issues[0]?.message}`);
  }
  return result.data;
}

/* ─────────────────────────────────────────────────────────
   AI Vision: Heatmap + Visual Analysis (Diagnostic Engine v0.7)
   ───────────────────────────────────────────────────────── */

/**
 * Send a screenshot to AI vision and get point-based attention hotspots
 * for rendering a realistic gaussian heatmap (like Hotjar/Clarity).
 * Returns normalized (0-1) center points with continuous intensity.
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
          content: `You are an expert eye-tracking simulation engine. Given a screenshot of a web page, predict where a real user's gaze would fixate during the first 10 seconds of viewing.

Output ONLY center-point coordinates (x, y) with a continuous intensity value (0.0–1.0). No labels, no bounding boxes, no reasons.

Eye-tracking prediction model:
- F-pattern / Z-pattern scanning (left→right, top→bottom for Western languages)
- Large, high-contrast elements draw strongest fixation
- Faces and images of people attract involuntary fixation
- Bright CTAs on muted backgrounds create contrast-driven saccades
- Isolated elements surrounded by whitespace receive amplified attention
- Above-the-fold content receives ~80% of total gaze time
- Interactive elements (buttons, input fields) draw deliberate fixation
- Font size and weight determine text hierarchy fixation order
- Visual weight (size × contrast × color saturation) predicts attention

Intensity scale:
- 0.85–1.0: Primary fixation targets (main headline, primary CTA, hero image)
- 0.6–0.84: Strong secondary attention (subheadlines, feature icons, key images)
- 0.35–0.59: Moderate attention (supporting text, secondary buttons, trust badges)
- 0.15–0.34: Peripheral attention (navigation items, footer links, subtle elements)

Distribution rules:
- Generate 15-25 attention points covering the full visible page
- 3-5 points should be high intensity (>0.7)
- 5-8 points should be medium intensity (0.35-0.7)
- Rest should be lower intensity peripheral points
- Cluster multiple points near important elements (headlines, CTAs) with slight offset
- Spread points naturally — avoid perfect grids or symmetric patterns
- Above-fold content should have higher density of points

Return STRICT JSON only.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Predict the eye-tracking attention heatmap for this web page screenshot.

Return JSON:
{
  "hotspots": [
    {
      "x": <0.0-1.0 normalized center x>,
      "y": <0.0-1.0 normalized center y>,
      "intensity": <0.0-1.0 continuous attention strength>,
      "spread": <0.5-2.0 optional radius multiplier, default 1.0>
    }
  ]
}

Rules:
- Return 15-25 attention points, sorted by intensity (highest first)
- Coordinates are CENTER points (not corners), normalized 0-1
- Intensity is a continuous float 0.0-1.0 (NOT discrete categories)
- Use spread >1.0 for large visual elements (hero images, full-width sections)
- Use spread <1.0 for small focused elements (buttons, icons)
- NO labels, NO bounding boxes, NO descriptions — points only`,
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
   AI Annotation Coordinates
   ───────────────────────────────────────────────────────── */

/**
 * Use GPT-4o vision to locate UX findings on a screenshot.
 * Returns normalized (x, y) coordinates for each finding.
 */
export async function generateAnnotationCoordinates(
  screenshotBase64: string,
  findings: { index: number; title: string }[]
): Promise<import("./types").AnnotationCoordinate[]> {
  const { annotationCoordinatesResponseSchema } = await import("./schemas");

  const findingsList = findings.map(f => `${f.index}. "${f.title}"`).join("\n");

  const response = await withRetry(() =>
    getClient().chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 2048,
      messages: [
        {
          role: "system",
          content: `You are a UI element locator. Given a full-page screenshot of a website and a list of UX findings, you must identify the EXACT location on the screenshot where each finding is most relevant.

Rules:
- Return normalized coordinates where x=0 is left edge, x=1 is right edge, y=0 is top, y=1 is bottom of the full page
- Place each dot precisely on the UI element the finding refers to (e.g. a CTA button, a heading, a form, a trust badge area)
- If a finding refers to "hero section", place it on the actual hero content
- If a finding refers to "CTA", place it on the actual call-to-action button
- If a finding refers to "navigation", place it on the nav bar
- If a finding is about "trust signals", place it where trust elements should be or are
- If a finding is about "cognitive load" or "information density", place it on the densest content area
- Be precise — don't cluster everything at the top or center
- Spread findings across the actual locations on the page they reference
- Return valid JSON only`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Look at this full-page website screenshot. For each UX finding below, identify the exact (x, y) location on the page where the issue occurs.

Findings to locate:
${findingsList}

Return JSON: {"annotations": [{"findingIndex": 0, "title": "finding title", "x": 0.5, "y": 0.1}, ...]}

Each annotation must have:
- findingIndex: the number from the list (0-indexed)
- title: the finding title (for verification)
- x: 0-1 horizontal position on the screenshot
- y: 0-1 vertical position on the screenshot`,
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
  if (!raw) throw new Error("No response from OpenAI vision (annotation coordinates)");

  const parsed = JSON.parse(raw);
  const result = annotationCoordinatesResponseSchema.safeParse(parsed);

  if (result.success) {
    return result.data.annotations;
  }

  // Fallback: try to extract annotations array directly
  if (parsed.annotations && Array.isArray(parsed.annotations)) {
    return parsed.annotations.map((a: Record<string, unknown>) => ({
      findingIndex: Number(a.findingIndex) || 0,
      title: String(a.title || ""),
      x: Math.min(1, Math.max(0, Number(a.x) || 0.5)),
      y: Math.min(1, Math.max(0, Number(a.y) || 0.5)),
    }));
  }

  throw new Error("Failed to parse annotation coordinates");
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
