/** Core types for the UXLens 10-Layer Diagnostic Engine */

export interface CategoryScore {
  score: number;
  note: string;
  /** Industry average benchmark for this category based on page type */
  benchmark?: number;
}

export type JourneyStage = "awareness" | "consideration" | "evaluation" | "conviction" | "action";

export interface Finding {
  type: "issue" | "warning" | "positive";
  title: string;
  desc: string;
  impact: "high" | "medium" | "low";
  severity?: "low" | "medium" | "high" | "critical";
  category?: string;
  whyItMatters?: string;
  recommendedFix?: string;
  /** What the visitor experiences at this friction point */
  userExperience?: string;
  /** Psychological principle being violated (e.g. "loss-aversion trigger", "cognitive fluency violation") */
  behavioralMechanism?: string;
  /** Which stage of the visitor decision journey this affects */
  journeyStage?: JourneyStage;
  /** How this issue cascades to impact subsequent decision stages */
  frictionCascade?: string;
  /** Estimated conversion lift if this issue is fixed (e.g. "+5-12%") */
  estimatedConversionLift?: string;
  /** Estimated effort to fix (e.g. "30 min", "2 hours", "1 day") */
  estimatedEffort?: string;
  /** Short punchy headline summarizing the revenue impact (e.g. "Losing ~15% of sign-ups") */
  impactHeadline?: string;
}

export interface AuditSection {
  id: string;
  name: string;
  icon: string;
  score: number;
  subtitle: string;
  findings: Finding[];
  recommendations: string[];
  rewrite?: SectionRewrite;
}

export interface FirstScreenAnalysis {
  immediateUnderstanding: string;
  unansweredQuestion: string;
  dominantEmotion: string;
  exitReason: string;
  clarityConfidence: number;
  /** What visitors THINK the page is about in the first 5 seconds */
  visitorMentalModel?: string;
  /** The primary question blocking the visitor from engaging further */
  decisionBarrier?: string;
  /** Ordered attention sequence: what visitors look at first → second → third */
  attentionSequence?: string[];
}

export interface ConfusionMap {
  jargonScore: number;
  densityScore: number;
  frictionWords: number;
  decisionParalysis: number;
  /** What the jargon level means for user comprehension behavior */
  jargonImpact?: string;
  /** How information density affects scanning vs. reading behavior */
  densityImpact?: string;
  /** What friction language signals to the visitor psychologically */
  frictionImpact?: string;
  /** What choice overload does to decision-making speed */
  paralysisImpact?: string;
}

export interface TrustMatrixItem {
  label: string;
  score: number;
  /** What this trust score means for visitor confidence at the decision stage */
  behavioralNote?: string;
}

/* ── Heuristic Evaluation (Nielsen's 10 Usability Heuristics) ── */

export interface HeuristicScore {
  id: string;
  name: string;
  score: number;    // 0-10
  issues: string[];
  passes: string[];
}

export interface HeuristicEvaluation {
  heuristics: HeuristicScore[];
  overallHeuristicScore: number; // 0-10
}

export interface Rewrite {
  beforeHeadline: string;
  beforeSubheadline: string;
  beforeCTA: string;
  afterHeadline: string;
  afterSubheadline: string;
  afterCTA: string;
  rewriteRationale: string;
}

/* ── Per-section rewrite types ─────────────────────────── */

export interface TextRewrite {
  type: "text";
  items: { label: string; before: string; after: string }[];
  rationale: string;
}

export interface StructureRewrite {
  type: "structure";
  suggestedOrder: string[];
  additions: string[];
  removals: string[];
  rationale: string;
}

export type SectionRewrite = TextRewrite | StructureRewrite;

/** Structured conversion killer with behavioral context */
export interface ConversionKillerItem {
  title: string;
  description: string;
  /** Which visitors this blocker primarily affects */
  affectedVisitors?: string;
  /** How this issue cascades through the decision journey */
  behavioralCascade?: string;
  /** Expected conversion lift if this is fixed */
  expectedLift?: string;
}

/** Backward-compatible: old audits have string[], new audits have object[] */
export type ConversionKiller = string | ConversionKillerItem;

/** Quick win or strategic fix with behavioral impact context */
export interface ActionItem {
  text: string;
  /** Expected behavioral change if implemented */
  expectedImpact?: string;
}

/** Backward-compatible: old audits have string[], new audits have object[] */
export type ActionableItem = string | ActionItem;

/** User persona feedback — each persona gives feedback from their professional background */
export interface PersonaFeedback {
  persona: string;       // e.g. "UX Designer", "Marketing Manager"
  emoji: string;         // e.g. "🎨", "📈"
  feedback: string;      // 2-3 sentences from their perspective
  topConcern: string;    // Their #1 concern in one short sentence
  priority: "high" | "medium" | "low";  // How urgent from their perspective
}

/** Visitor emotional journey point across page sections */
export interface JourneyPoint {
  section: string;
  emotion: "confidence" | "interest" | "neutral" | "doubt" | "frustration";
  intensity: number; // 0-100
  note: string;
}

/** Accessibility audit results */
export interface AccessibilityScore {
  overallScore: number; // 0-100
  contrastScore: number;
  textSizeScore: number;
  touchTargetScore: number;
  altTextScore: number;
  keyboardNavScore: number;
  issues: string[];
  passes: string[];
}

/** Information architecture analysis */
export interface IAScore {
  overallScore: number; // 0-100
  sectionOrderScore: number;
  navigationScore: number;
  contentGroupingScore: number;
  scanabilityScore: number;
  suggestedOrder: string[];
  issues: string[];
}

export type PageType = "landing" | "app" | "signup" | "checkout" | "form" | "content" | "other";

export interface UXAuditResult {
  pageType?: PageType;
  pageTypeLabel?: string;
  overallScore: number;
  grade: string;
  executiveSummary: string;
  conversionKillers: ConversionKiller[];
  quickWins: ActionableItem[];
  strategicFixes: ActionableItem[];
  flags: string[];
  categories: {
    messageClarity: CategoryScore;
    cognitiveLoad: CategoryScore;
    conversionArch: CategoryScore;
    trustSignals: CategoryScore;
    contradictions: CategoryScore;
    firstScreen: CategoryScore;
  };
  sections: AuditSection[];
  firstScreenAnalysis: FirstScreenAnalysis;
  confusionMap: ConfusionMap;
  trustMatrix: TrustMatrixItem[];
  rewrite: Rewrite;
  heuristicEvaluation?: HeuristicEvaluation;
  uxStrengths?: string[];
  personaFeedback?: PersonaFeedback[];
  /** Visitor emotional journey across page sections */
  journeyMap?: JourneyPoint[];
  /** WCAG accessibility audit */
  accessibilityScore?: AccessibilityScore;
  /** Information architecture analysis */
  iaScore?: IAScore;
}

export interface ExtractedContent {
  url: string;
  title: string;
  metaDescription: string;
  headings: string[];
  subheadings: string[];
  buttons: string[];
  sections: string[];
  forms: string[];
  trustSignals: string[];
  bodyText: string;
  language?: string;
}

export interface AnalysisResponse {
  success: true;
  data: UXAuditResult;
  url: string;
  auditId?: string;
  screenshotUrl?: string;
  heatmapZones?: HeatmapZone[];
  pageHeight?: number;
  viewportWidth?: number;
}

/** Heatmap attention point for gaussian overlay */
export interface HeatmapZone {
  x: number;          // pixel center x
  y: number;          // pixel center y
  intensity: number;  // 0-1
  radius: number;     // pixel radius for gaussian blob
}

export interface AnalysisError {
  success: false;
  error: string;
  code: "INVALID_URL" | "FETCH_FAILED" | "CONTENT_TOO_WEAK" | "AI_FAILED" | "PARSE_FAILED" | "USAGE_LIMIT";
  usage?: UsageCheck;
}

export type AnalysisResult = AnalysisResponse | AnalysisError;

/** SSE event types for streaming analyze endpoint */
export type AnalyzeSSEEvent =
  | { type: "metadata"; url: string; title: string; description: string; headingsCount: number; language?: string }
  | { type: "progress"; stage: string; percent: number }
  | { type: "complete"; data: UXAuditResult; url: string }
  | { type: "saved"; auditId: string }
  | { type: "error"; error: string; code: AnalysisError["code"] };

/** Subscription plan tiers */
export type PlanTier = "free" | "starter" | "pro" | "agency";

export interface UsageCheck {
  audit_allowed: boolean;
  reason: string;
  plan: PlanTier;
  monthly_limit: number;
  audits_used: number;
  audits_remaining: number;
  upgrade_suggestion: string;
}

export const PLAN_LIMITS: Record<PlanTier, number> = {
  free: 5,
  starter: 50,
  pro: 200,
  agency: 1000,
};

export const RATE_LIMIT_PER_HOUR = 10;

/** Feature access per plan tier */
export interface PlanFeatures {
  improvements: boolean;
  pdfExport: boolean;
  aiChat: boolean;
  chatLimit: number;
  competitorAnalysis: boolean;
}

export const PLAN_FEATURES: Record<PlanTier, PlanFeatures> = {
  free: { improvements: false, pdfExport: false, aiChat: false, chatLimit: 0, competitorAnalysis: false },
  starter: { improvements: true, pdfExport: true, aiChat: false, chatLimit: 0, competitorAnalysis: true },
  pro: { improvements: true, pdfExport: true, aiChat: true, chatLimit: 50, competitorAnalysis: true },
  agency: { improvements: true, pdfExport: true, aiChat: true, chatLimit: 200, competitorAnalysis: true },
};

/** Chat message interface */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

/* ── AI Vision Analysis ───────────────────────────────── */

/** AI-generated attention point from UXLens AI vision (gaussian heatmap) */
export interface VisionHotspot {
  x: number;          // normalized 0-1 (center of attention)
  y: number;          // normalized 0-1 (center of attention)
  intensity: number;  // 0.0-1.0 continuous attention strength
  spread?: number;    // optional radius multiplier (0.5-2.0)
}

/** Visual design analysis from AI vision */
export interface VisualAnalysis {
  layoutScore: number;           // 0-100
  visualHierarchyScore: number;  // 0-100
  whitespaceScore: number;       // 0-100
  colorContrastScore: number;    // 0-100
  mobileReadinessScore: number;  // 0-100
  overallVisualScore: number;    // 0-100
  findings: Finding[];
  summary: string;
}

/** AI-generated annotation coordinate for placing finding markers on screenshots */
export interface AnnotationCoordinate {
  findingIndex: number;  // matches the order sent to the AI
  title: string;         // finding title for fallback matching
  x: number;             // 0-1 normalized horizontal position
  y: number;             // 0-1 normalized vertical position
}

/* ── Competitor Analysis (Pro+) ────────────────────────── */

export interface CompetitorProfile {
  url: string;
  name: string;
  estimatedScore: number;
  estimatedGrade: string;
  categories: {
    messageClarity: CategoryScore;
    cognitiveLoad: CategoryScore;
    conversionArch: CategoryScore;
    trustSignals: CategoryScore;
    contradictions: CategoryScore;
    firstScreen: CategoryScore;
  };
  strengths: string[];   // 3 things competitor does better
  weaknesses: string[];  // 3 things user does better
}

export interface CategoryComparison {
  category: string;
  userScore: number;
  competitor1Score: number;
  competitor2Score: number;
  winner: "user" | "competitor1" | "competitor2";
  insight: string;
}

export interface CompetitorAnalysis {
  competitors: CompetitorProfile[];
  categoryComparisons: CategoryComparison[];
  competitiveAdvantages: string[];        // 5 actionable items
  competitivePosition: string;            // 2-3 sentence summary
  userOverallScore: number;
  averageCompetitorScore: number;
  scoreGap: number;                       // positive = user ahead
}
