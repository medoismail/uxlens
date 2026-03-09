/** Core types for the UXLens analysis pipeline */

export interface OfferDetection {
  offer_detected: string;
  target_user_guess: string;
  outcome_guess: string;
  confidence: number;
}

export interface AuditScores {
  first_screen_clarity: number;
  cta_strength: number;
  trust_first_screen: number;
  message_clarity_score: number;
  conversion_structure_score: number;
  confusion_score: number;
  ux_score: number;
}

export interface HeroRewrite {
  headline: string;
  subheadline: string;
  cta: string;
}

export interface UXAuditResult {
  offer_detection: OfferDetection;
  scores: AuditScores;
  major_issues: string[];
  missing_conversion_elements: string[];
  confusing_phrases: string[];
  hero_rewrite: HeroRewrite;
  quick_fixes: string[];
  audit_quality_score: number;
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
}

export interface AnalysisError {
  success: false;
  error: string;
  code: "INVALID_URL" | "FETCH_FAILED" | "CONTENT_TOO_WEAK" | "AI_FAILED" | "PARSE_FAILED" | "USAGE_LIMIT";
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
