export type PlanTier = "free" | "starter" | "pro" | "agency";

export interface UserInfo {
  userId: string;
  email: string;
  plan: PlanTier;
  auditsUsed: number;
  monthlyLimit: number;
}

export interface AuditProgress {
  stage: string;
  percent: number;
}

export interface AuditResult {
  overallScore: number;
  grade: string;
  executiveSummary: string;
  auditId?: string;
}

/** Messages between popup <-> background service worker */
export type ExtensionMessage =
  | { type: "GET_AUTH_STATUS" }
  | { type: "AUTH_STATUS"; data: UserInfo | null }
  | { type: "SIGN_IN" }
  | { type: "SIGN_OUT" }
  | { type: "START_AUDIT"; url: string; tabId: number }
  | { type: "CANCEL_AUDIT" }
  | { type: "AUDIT_PROGRESS"; data: AuditProgress }
  | { type: "AUDIT_COMPLETE"; data: AuditResult }
  | { type: "AUDIT_ERROR"; error: string }
  | { type: "CAPTURE_SCREENSHOT"; tabId: number }
  | { type: "SCREENSHOT_CAPTURED"; dataUrl: string };
