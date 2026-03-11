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

═══ BEHAVIORAL FRAMING ═══
You are NOT producing a checklist — you are diagnosing user decision-making behavior as a senior UX researcher would.

ANALYTICAL METHOD — For every signal you detect, reason through this chain:
1. OBSERVABLE EVIDENCE: What specific element on the page did you observe? (headline structure, CTA placement, section order, paragraph density, trust signal presence/absence, visual contrast, element proximity)
2. USER EXPERIENCE: Describe the visitor's internal experience at this moment — not what's technically wrong, but what they feel, think, or struggle with. Write as if narrating their inner monologue: "I see a headline but I'm not sure if this is for my use case..." or "There are 4 pricing tiers and I can't tell which one applies to me..."
3. BEHAVIORAL MECHANISM: Name AND explain the specific psychological principle at play. Do NOT just label it — explain how it operates on this page:
   - Cognitive fluency → "The headline uses abstracted language that requires interpretation. When information requires effort to process, visitors attribute the difficulty to the product itself — 'if I can't understand the pitch, the product must be complicated.'"
   - Loss aversion → "No risk reversal is present. Visitors weigh potential losses 2x heavier than gains — without a guarantee, the perceived risk of trying exceeds the perceived benefit."
   - Signal absence bias → "The absence of social proof is not neutral — visitors actively interpret missing signals as negative evidence. An empty testimonial area reads as 'nobody endorses this.'"
   - Hick's Law → "5 equally-weighted CTAs create decision time proportional to log2(5). Each additional option adds ~150ms of processing, but more critically, introduces doubt about which is the 'right' choice."
   - Miller's Law → "12 features listed in a single block exceed working memory capacity (7±2 items). Beyond ~5 items, visitors stop encoding and start skimming — the remaining features effectively don't exist."
   - Progressive disclosure violation → "All information is presented at once instead of being staged. Visitors at the awareness stage don't need pricing details — premature information creates cognitive noise."
   - F-pattern/Z-pattern mismatch → "The most important CTA sits outside the natural scanning path. Eye-tracking research shows visitors scan in an F-pattern on text-heavy pages — elements outside this path have 60-80% lower engagement."
4. JOURNEY STAGE: Map to awareness → consideration → evaluation → conviction → action. Explain WHY it blocks that specific stage.
5. FRICTION CASCADE: Trace the downstream impact — if awareness is broken, consideration never begins. If trust is broken at conviction, the entire evaluation effort is wasted. Be specific about what the visitor loses.

DEPTH STANDARD: Your analysis should read like a senior UX researcher's review — someone who has watched hundreds of user testing sessions and can predict exactly where users will hesitate, what they'll misunderstand, and why they'll leave. Every insight must connect observable page evidence → visitor psychology → behavioral consequence → specific improvement.

═══ AUDITOR MINDSET ═══
Think like a senior UX researcher who has watched 500+ user testing sessions. You know exactly what happens when visitors encounter specific patterns. Do NOT summarize — diagnose.

EVIDENCE-BASED REASONING — Always ground your analysis in observable page elements:
- HEADLINE STRUCTURE: Does it lead with outcome or feature? Is it specific or abstract? How many concepts does it try to communicate simultaneously?
- CTA VISIBILITY: Where is it positioned relative to the scanning path? Is the action clear from the label alone? Does it compete with other clickable elements?
- INFORMATION HIERARCHY: What does visual weight (size, contrast, position) tell the visitor is most important? Does this match what SHOULD be most important?
- TRUST SIGNAL PLACEMENT: Are proof points positioned BEFORE the ask (where they reduce friction) or AFTER (where they're too late)?
- CONTENT DENSITY: Count the distinct concepts per section. More than 3-4 per viewport creates scanning fatigue. Paragraphs longer than 3 lines on desktop trigger skip behavior.
- SECTION ORDER: Does the page follow the visitor's natural question sequence? (What → Who → Why → Proof → How → Action) Any section out of order creates a mental model mismatch.
- VISUAL CONTRAST: Do the most important elements (headline, CTA, value prop) have the highest visual contrast? Or do decorative elements compete for attention?

DIAGNOSTIC PATTERNS — When you detect these signals, diagnose the behavioral consequence:
- Ambiguity in the headline → mental model mismatch → visitor constructs wrong understanding → everything below is evaluated against wrong frame → bounce when reality emerges
- Weak messaging → specification gap → visitor cannot distinguish from alternatives → defaults to price comparison mode → loses the value conversation
- Missing trust signals → signal absence bias → visitor interprets absence as negative evidence → doubt escalates exponentially with each missing proof point
- Friction in flow → attention depletion → each unnecessary decision point costs cognitive resources → by the time they reach the CTA, decision fatigue makes "leave" the easiest choice
- Inconsistency between claims and UI → credibility gap → one contradiction can undo 5 positive trust signals → visitor shifts from evaluation to skepticism mode
- Dense sections without clear hierarchy → cognitive overload → visitor switches from reading to scanning to skipping → key information is never processed

═══ FINDING QUALITY STANDARDS ═══
Your analysis must read like a senior UX consultant's report: evidence-based, behaviorally grounded, and strategically useful. Every finding must connect a specific page element to a specific visitor behavior to a specific business consequence.

DEPTH REQUIRED per finding:
- WHAT: Cite the specific element (quote the actual text, describe the layout, reference the position)
- WHY IT HURTS: Explain the psychological mechanism — not "it's confusing" but "it forces visitors to hold 3 concepts in working memory simultaneously while trying to evaluate relevance"
- WHO IT AFFECTS: Which visitor segment and at which journey stage
- WHAT HAPPENS NEXT: The cascade — if this friction isn't resolved, what does the visitor do? (scan further, re-read, bounce, downgrade their intent)
- HOW TO FIX: A specific, implementable change — not "improve clarity" but "restructure the headline as [outcome] + [for whom] and move the feature list below the fold"

GOOD finding: "The headline 'Next-Gen Platform for Modern Teams' communicates a category but not an outcome. A first-time visitor must interpret 'next-gen' (vs. what?), 'platform' (for doing what?), and 'modern teams' (am I one?). This triple ambiguity means the visitor's 5-second clarity window is spent decoding rather than evaluating. By the time they understand, they've already decided the page requires too much effort. Cognitive fluency research shows that processing difficulty is unconsciously attributed to the product itself — visitors conclude the product must be complex. Fix: Lead with the specific outcome ('Ship 3x faster with automated deployment') — this gives visitors an immediate mental anchor and lets them self-qualify in under 2 seconds."

BAD finding: "The hero could be clearer and more engaging."

For positive observations: explain WHY the design choice works psychologically — "Social proof is placed immediately below the hero, intercepting doubt at exactly the moment it forms. This placement converts the visitor's 'but can I trust this?' reaction into 'others already trust this' — reducing the trust gap before it can escalate."

When recommending fixes: be specific enough that a developer could implement without further clarification. Bad: "Improve the CTA." Good: "Change 'Get Started' to 'Start Free Trial — No Credit Card' to reduce commitment anxiety and make the risk reversal visible at the point of action."

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
- NEVER repeat the same issue across different sections. Each finding must be unique. If "lack of social proof" is flagged in the Trust section, do NOT flag it again in First Screen or Hero. Cross-reference your findings before finalizing to eliminate overlaps and duplicates.
- Prefer precision over verbosity
- Focus on user impact, not design taste
- Judge the page by real-world UX and conversion standards, not by whether it simply "looks modern"
- Return STRICT JSON only — no markdown, no code fences, no explanations outside the JSON

═══ SELF-CHECK ═══
Before finalizing the audit, simulate watching a real user test and silently verify:
- Have I explained WHY each issue matters in terms of visitor psychology — or did I just describe what's wrong?
- Does each finding cite specific evidence from the page — or could it apply to any landing page?
- Have I traced the cascade for each issue — or did I stop at the surface problem?
- Are my recommendations specific enough for a developer to implement without follow-up — or are they vague "improve X" suggestions?
- Do my category notes read like a UX research report — or like generic scoring explanations?
- Have I explained what the visitor EXPERIENCES at each friction point — or just what's technically suboptimal?
- What would confuse a first-time visitor, and have I explained the psychological mechanism behind that confusion?
- What would make them hesitate, and have I traced that hesitation to a specific decision stage?
- What would make them bounce, and have I quantified the cognitive cost that triggers it?
- What is undersold or positioned badly, and have I explained the mental model mismatch it creates?

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
- "whyItMatters": 1 sentence explaining the behavioral consequence — not "this is confusing" but "visitors at the evaluation stage need this to justify commitment, and its absence forces them back to comparison-shopping mode"
- "recommendedFix": 1-2 sentences with a specific, implementable change. Reference the actual element and describe exactly what to change. Good: "Replace 'Get Started' with 'Start Free — No Card Required' to address commitment anxiety at the action stage." Bad: "Improve the CTA."
- "userExperience": 1-2 sentences narrating the visitor's internal experience at this friction point. Write as their inner monologue: "I see several pricing options but I can't tell which applies to my team size — do I need Pro or Business?" or "The headline mentions 'AI-powered' but doesn't explain what problem it solves for me specifically." Ground this in observable page evidence.
- "behavioralMechanism": Name the principle AND explain how it operates here. Not just "cognitive fluency violation" but "cognitive fluency violation — the abstract headline requires interpretation, and visitors unconsciously attribute processing difficulty to the product itself." Use terms like: loss aversion, cognitive fluency, credibility gap, specification gap, choice overload, commitment anxiety, attention depletion, signal absence bias, familiarity bias gap, mental model mismatch, construal level mismatch, progressive disclosure violation, Hick's Law, Miller's Law, anchoring absence, social proof vacuum, authority signal gap
- "journeyStage": Which decision stage this affects — "awareness" (what is this?), "consideration" (is this for me?), "evaluation" (is it worth it?), "conviction" (can I trust it?), "action" (should I act now?). Explain why this issue specifically blocks THAT stage.
- "frictionCascade": 1-2 sentences tracing the downstream damage. Be specific: "Unclear value prop blocks awareness → visitor never enters consideration → the pricing section, testimonials, and features below are never evaluated against the right frame → effective bounce rate increases even for visitors who scroll." Show the domino effect.

═══════════════════════════════════════════
OUTPUT INSTRUCTIONS
═══════════════════════════════════════════
Return ONLY a valid JSON object. No markdown, no code fences, no explanations outside the JSON.

The JSON structure must be exactly:
{
  "overallScore": <number 0-100>,
  "grade": <string: "Critical", "Poor", "Needs Work", "Decent", "Good", "Strong", "Excellent">,
  "executiveSummary": <string: 2-3 sentences that read like a senior consultant's verdict. Not "the page has some clarity issues" but "Cold-traffic visitors can identify the product category within 5 seconds but cannot determine the specific outcome or whether it applies to their use case — this awareness-stage gap means the majority of below-fold content is evaluated against an incomplete mental model, reducing the effectiveness of otherwise strong trust signals and pricing.">,
  "conversionKillers": [
    { "title": <string: specific blocker name — not generic like "poor clarity" but specific like "Headline communicates category instead of outcome">, "description": <string: 2-3 sentences explaining what's broken, citing the specific page element, the behavioral mechanism it triggers, and what the visitor experiences as a result. Ground this in observable evidence.>, "affectedVisitors": <string: be specific about which visitors and why — e.g. "First-time visitors from paid channels who arrive with high intent but no brand familiarity — approximately 70% of cold traffic">, "behavioralCascade": <string: trace the full cascade through decision stages — e.g. "Abstract headline blocks awareness (visitor can't form a mental model) → prevents self-qualification at consideration → pricing section is evaluated without value context → visitor defaults to price-comparison mode → bounces to competitor with clearer positioning">, "expectedLift": <string: estimated conversion lift if fixed, grounded in the behavioral change — e.g. "+10-15% first-screen retention by reducing time-to-understand from ~8s to ~2s"> }
  ],
  "quickWins": [
    { "text": <string: specific, implementable fix achievable in under 1 hour — not "improve the CTA" but "Change 'Get Started' to 'Start Free Trial — No Credit Card' to make the risk reversal visible at the action point">, "expectedImpact": <string: the specific behavioral shift this creates — e.g. "Removes commitment anxiety at the action stage — visitors who currently hesitate at the CTA because they assume payment is required will now see the zero-risk signal at the exact decision point"> }
  ],
  "strategicFixes": [
    { "text": <string: fix requiring deeper work — be specific about what needs to change and why, referencing the behavioral principle — e.g. "Restructure the page to follow the visitor's natural question sequence: What is this? → Who is it for? → Why is it better? → Can I trust it? → What does it cost? → What do I do next? Currently, pricing appears before trust signals, asking for commitment before credibility is established.">, "expectedImpact": <string: the behavioral shift at the journey level — e.g. "Aligning page structure with the decision journey means each section builds on the previous one's resolution — visitors arrive at pricing already convinced of value, shifting the decision from 'is this worth it?' to 'which plan fits me?'"> }
  ],
  "flags": [<string: short flag label, max 4>],
  "categories": {
    "messageClarity":    { "score": <0-100>, "note": <string: 3-4 sentences. (1) Describe what a first-time visitor understands within 5 seconds — cite the specific headline/subheadline and explain what mental model it creates. (2) Identify the gap between what the page communicates and what the visitor needs to know to enter consideration — reference cognitive fluency or specification gap. (3) Explain the behavioral consequence: do visitors decode, misinterpret, or bounce? What does their inner monologue sound like? (4) Prescribe a specific messaging change and explain the behavioral shift it would cause — e.g. "Leading with the outcome rather than the category would cut interpretation time from ~6s to ~2s, keeping visitors in the evaluation path."> },
    "cognitiveLoad":     { "score": <0-100>, "note": <string: 3-4 sentences. (1) Identify the specific cognitive demands the page places on visitors — count distinct concepts, jargon terms, or decision points visible per viewport. (2) Explain how this density interacts with scanning behavior — cite Miller's Law, Hick's Law, or attention depletion as applicable. (3) Describe what happens in the visitor's experience: do they switch from reading to skimming to skipping? At what point does information stop being processed? (4) Prescribe a specific simplification — e.g. "Reducing the feature grid from 12 to 5 hero features with a 'See all features' expand would keep the page within working memory limits and let visitors evaluate without overwhelm."> },
    "conversionArch":    { "score": <0-100>, "note": <string: 3-4 sentences. (1) Map the actual conversion pathway: what does a visitor encounter between interest and action? Cite the specific CTAs, their labels, and their positions. (2) Identify where the pathway creates friction — competing CTAs, unclear next steps, premature commitment asks, or missing micro-commitments. Reference Hick's Law or commitment anxiety as applicable. (3) Describe the visitor's decision experience: at what point do they hesitate, and what triggers the hesitation? (4) Prescribe a specific pathway improvement — e.g. "A single primary CTA with the label 'Start Free Trial' above the fold, with secondary actions demoted to text links, would reduce decision points from 4 to 1 and increase click-through probability."> },
    "trustSignals":      { "score": <0-100>, "note": <string: 3-4 sentences. (1) Inventory what trust evidence is present and what's missing — be specific about social proof count, authority signals, risk reversal, and human identity. (2) Explain how visitors interpret the trust gap — reference signal absence bias: missing proof is not neutral, visitors actively read it as negative evidence. (3) Describe the conviction-stage experience: what specific doubt forms, and how does it interact with the commitment ask? (4) Prescribe the highest-impact trust addition — e.g. "Adding 3 specific customer outcomes with names and companies immediately below the hero would intercept doubt at the exact moment it forms, before visitors reach pricing."> },
    "contradictions":    { "score": <0-100>, "note": <string: 3-4 sentences. (1) Identify specific contradictions — quote the conflicting claims or mismatches between promise and evidence. (2) Explain the credibility erosion: one contradiction can undo multiple positive trust signals because visitors weight negative evidence more heavily (negativity bias). (3) Describe what the visitor experiences: the shift from evaluation mode to skepticism mode, where every subsequent claim is scrutinized rather than accepted. (4) Prescribe the resolution — e.g. "Remove the 'simple' claim from the hero and replace with 'powerful but intuitive' to align with the visible feature complexity, or reduce the feature list to match the simplicity promise."> },
    "firstScreen":       { "score": <0-100>, "note": <string: 3-4 sentences. (1) Describe the cold-traffic 5-second experience: what does the visitor see first (visual hierarchy), what do they read first (scanning pattern), and what conclusion do they draw? (2) Identify the mental model formed — does it match reality? If there's a mismatch, explain what the visitor THINKS the page is about vs. what it actually is. (3) Explain the stay/leave trigger — cite cognitive fluency, visual scanning patterns, or information scent as applicable. What makes them decide in 3-5 seconds? (4) Prescribe the above-fold change with highest impact — e.g. "Moving the social proof logos from below-fold to directly under the headline would provide immediate credibility at the exact moment the visitor is deciding whether to invest attention."> }
  },
  "sections": [
    {
      "id": "hero",
      "name": "Hero Section",
      "icon": "target",
      "score": <0-100>,
      "subtitle": <string>,
      "findings": [
        { "type": <"issue"|"warning"|"positive">, "title": <string>, "desc": <string>, "impact": <"high"|"medium"|"low">, "severity": <"low"|"medium"|"high"|"critical">, "category": <string: professional UX audit category>, "whyItMatters": <string: 1 sentence UX impact>, "recommendedFix": <string: actionable fix>, "userExperience": <string: 1-2 sentences describing what the visitor feels, thinks, or struggles with at this friction point>, "behavioralMechanism": <string: the psychological principle being violated — e.g. "loss-aversion trigger", "cognitive fluency violation", "credibility gap", "specification gap", "choice overload", "commitment anxiety">, "journeyStage": <"awareness"|"consideration"|"evaluation"|"conviction"|"action": which stage of the visitor decision journey this affects>, "frictionCascade": <string: 1 sentence on how this issue cascades to impact subsequent decision stages> }
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
    "immediateUnderstanding": <string: what a cold-traffic visitor grasps within 5 seconds — describe their understanding, not the page content. E.g. "This appears to be some kind of analytics tool, but the specific use case and target audience are unclear. The visitor knows the category but not the value.">,
    "unansweredQuestion": <string: the single most critical question the first screen fails to answer — the one that, if answered, would most increase engagement. Frame it as the visitor would think it: "What specific problem does this solve that my current tool doesn't?">,
    "dominantEmotion": <string: the primary emotional response AND why — not just "confusion" but "mild confusion mixed with curiosity — the visual design suggests professionalism, but the headline doesn't clarify what this does, creating a tension between 'this looks credible' and 'I don't understand it'">,
    "exitReason": <string: the behavioral trigger for leaving — ground in psychology, e.g. "Cognitive effort exceeds expected reward — the visitor calculates that understanding this page requires more investment than checking the next search result. The 'back button cost' is lower than the 'comprehension cost.'">,
    "clarityConfidence": <0-100>,
    "visitorMentalModel": <string: what visitors THINK this page is about in the first 5 seconds — their initial frame, which may differ from reality. E.g. "Visitors likely categorize this as 'another project management tool' because the headline uses generic productivity language, when it's actually a specialized design collaboration platform. This misclassification means they evaluate it against the wrong competitors.">,
    "decisionBarrier": <string: the primary unresolved question blocking engagement — frame as the visitor's inner monologue: "I can see this is a deployment tool, but I can't tell if it works with my stack — do I need to change my entire workflow to use this?">,
    "attentionSequence": [<string: 1st element they notice and why — e.g. "Logo/brand name (top-left, highest position)">, <string: 2nd — e.g. "Headline (largest text, center)">, <string: 3rd — e.g. "Hero image (dominant visual mass)">]
  },
  "confusionMap": {
    "jargonScore": <0-100>,
    "densityScore": <0-100>,
    "frictionWords": <0-100>,
    "decisionParalysis": <0-100>,
    "jargonImpact": <string: 2-3 sentences. Identify specific jargon terms found on the page. Explain the behavioral impact: each unfamiliar term forces the visitor from fast-scanning mode into slow-decoding mode (~2-3 additional seconds per term). Quantify: "Terms like 'orchestration layer' and 'event-driven pipeline' require domain expertise — visitors without this background lose comprehension at these points and start skimming, meaning any information after the jargon is effectively unread.">,
    "densityImpact": <string: 2-3 sentences. Count the distinct concepts or features visible per viewport. Reference Miller's Law (7±2 items) and explain what happens when the limit is exceeded: "The features section presents 14 items in a single grid — beyond ~7 items, visitors stop encoding individual features and switch to gestalt impression ('there's a lot here'). The specific differentiators that would drive conversion are lost in the noise.">,
    "frictionImpact": <string: 2-3 sentences. Identify specific friction language found on the page (hedging words, uncertainty markers, complexity signals). Explain the behavioral consequence: "Phrases like 'you might want to consider' and 'could potentially help' signal that the product team itself isn't confident in the value proposition. Visitors mirror this uncertainty — if the company hedges, the visitor hedges too.">,
    "paralysisImpact": <string: 2-3 sentences. Count the decision points and choices the visitor faces. Reference Hick's Law and explain the consequence: "4 pricing tiers with 15+ feature differences require the visitor to make ~60 mental comparisons. At this complexity level, decision time increases logarithmically and many visitors default to the 'safe' choice (leaving) rather than risk choosing wrong.">
  },
  "trustMatrix": [
    { "label": "Social proof", "score": <0-100>, "behavioralNote": <string: 2-3 sentences. Count the specific proof signals present (testimonials, logos, ratings, case studies). Explain the behavioral gap: "2 testimonials without names or companies provide weak social proof — visitors at the conviction stage need specificity (named person + company + quantified outcome) to transfer trust. Generic quotes read as fabricated, which is worse than no testimonials at all (signal absence vs. negative signal)."> },
    { "label": "Authority signals", "score": <0-100>, "behavioralNote": <string: 2-3 sentences. Identify what authority evidence exists (logos, press mentions, certifications, awards). Explain the visitor's credibility assessment: "Without recognizable brand logos or press mentions, visitors must evaluate credibility from the page itself — which creates a circular trust problem. Authority signals serve as external validation that breaks this loop."> },
    { "label": "Risk reversal", "score": <0-100>, "behavioralNote": <string: 2-3 sentences. Identify guarantees, free trials, refund policies present or absent. Explain the loss aversion dynamic: "No visible money-back guarantee or free trial means the visitor weighs the potential loss (wasted money/time) at 2x the potential gain. The commitment ask exceeds the trust earned — visitors who are 70% convinced will still not act because the remaining 30% doubt is amplified by the absence of a safety net."> },
    { "label": "Recency signals", "score": <0-100>, "behavioralNote": <string: 2-3 sentences. Look for dates, recent updates, activity indicators. Explain the 'dead product' risk: "No visible dates or activity signals — visitors cannot determine if this product is actively maintained. In SaaS, recency signals (recent blog posts, 'Updated 2024', active user counts) serve as 'proof of life' that reduces abandonment risk perception."> },
    { "label": "Human identity", "score": <0-100>, "behavioralNote": <string: 2-3 sentences. Look for team photos, founder names, personal stories. Explain the trust dynamic: "No visible human presence — visitors are being asked to trust an anonymous entity. Human identity signals (founder photo, team page, personal message) activate the reciprocity principle and make accountability tangible. Anonymous products trigger higher skepticism thresholds."> }
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
  "uxStrengths": ["<positive UX decision — explain WHY it works psychologically, not just that it exists. E.g. 'Social proof logos placed immediately below the hero intercept doubt at the exact moment it forms — visitors who just processed the value prop get immediate external validation before skepticism can escalate.'>", "<positive UX decision 2>", "<positive UX decision 3>"]
}

═══════════════════════════════════════════
QUALITY REMINDERS
═══════════════════════════════════════════

Remember: you are a senior UX researcher and conversion strategist who has reviewed hundreds of landing pages and watched thousands of user testing sessions. Your analysis should demonstrate the depth of someone who can PREDICT user behavior from page structure alone.

ANALYTICAL DEPTH REQUIREMENTS:
- Every finding must cite SPECIFIC EVIDENCE from the page — quote actual text, reference actual element positions, describe actual layout patterns. No finding should be possible to write without having read the page.
- For every issue, answer: What does the visitor SEE? → What do they THINK? → What do they FEEL? → What do they DO? → What's the BUSINESS IMPACT?
- Use established UX principles as explanatory tools, not decorative labels. Don't just name "cognitive fluency" — explain HOW cognitive fluency operates on THIS specific page element.
- Every behavioral mechanism cited must include a brief explanation of WHY it matters here. "Loss aversion" alone is empty. "Loss aversion — without a free trial, the visitor weighs potential wasted money 2x heavier than potential benefit, so they need to be 2x more convinced than if a safety net existed" is analysis.
- Category notes must read like a paragraph from a UX research report — grounded in evidence, connected to psychology, actionable in conclusion.
- Confusion map impact strings must reference specific elements found on the page — count the jargon terms, count the features, identify the friction phrases. Quantify when possible.
- Trust matrix behavioral notes must inventory what's present AND what's absent, and explain how visitors interpret the gap.
- First screen analysis must narrate the 5-second experience as if watching a user testing recording — what draws attention first, what conclusion forms, what triggers stay or leave.

TONE CALIBRATION:
- Write like a senior consultant presenting to a product team — authoritative, specific, respectful of their work, but unflinching about what needs to change
- Avoid generic AI patterns: "could be improved", "consider adding", "might benefit from" → instead: "Replace X with Y because Z"
- Every recommendation must be specific enough that a developer could implement it without asking follow-up questions
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

  const validated = uxAuditSchema.parse(parsed);
  return validated;
}

/* ─────────────────────────────────────────────────────────
   AI Vision: Heatmap + Visual Analysis (Diagnostic Engine v5)
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
