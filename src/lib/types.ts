/** Core types for the UXLens 9-Layer Diagnostic Engine */

export interface CategoryScore {
  score: number;
  note: string;
}

export interface Finding {
  type: "issue" | "warning" | "positive";
  title: string;
  desc: string;
  impact: "high" | "medium" | "low";
}

export interface AuditSection {
  id: string;
  name: string;
  icon: string;
  score: number;
  subtitle: string;
  findings: Finding[];
  recommendations: string[];
}

export interface FirstScreenAnalysis {
  immediateUnderstanding: string;
  unansweredQuestion: string;
  dominantEmotion: string;
  exitReason: string;
  clarityConfidence: number;
}

export interface ConfusionMap {
  jargonScore: number;
  densityScore: number;
  frictionWords: number;
  decisionParalysis: number;
}

export interface TrustMatrixItem {
  label: string;
  score: number;
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

export interface UXAuditResult {
  overallScore: number;
  grade: string;
  executiveSummary: string;
  conversionKillers: string[];
  quickWins: string[];
  strategicFixes: string[];
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

/** Heatmap zone for attention overlay */
export interface HeatmapZone {
  x: number;
  y: number;
  width: number;
  height: number;
  intensity: number;
  label: string;
}

export interface AnalysisError {
  success: false;
  error: string;
  code: "INVALID_URL" | "FETCH_FAILED" | "CONTENT_TOO_WEAK" | "AI_FAILED" | "PARSE_FAILED" | "USAGE_LIMIT";
  usage?: UsageCheck;
}

export type AnalysisResult = AnalysisResponse | AnalysisError;

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
