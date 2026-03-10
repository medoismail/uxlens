import type { UXAuditResult, VisualAnalysis, CompetitorAnalysis } from "@/lib/types";
import type { HeatmapZone } from "@/lib/heatmap";

/* ── MCP Audit ─────────────────────────────────────── */

export interface McpAuditRequest {
  url: string;
}

export interface McpAuditResponse {
  success: true;
  data: UXAuditResult;
  url: string;
  auditId?: string;
}

/* ── MCP Screenshot ────────────────────────────────── */

export interface McpScreenshotRequest {
  url: string;
}

export interface McpScreenshotResponse {
  screenshotUrl?: string;
  pageHeight: number;
  viewportWidth: number;
}

/* ── MCP Visual Analysis ───────────────────────────── */

export interface McpVisualAnalysisRequest {
  screenshotUrl: string;
  pageHeight: number;
  viewportWidth: number;
  auditId?: string;
}

export interface McpVisualAnalysisResponse {
  heatmapZones: HeatmapZone[];
  visualAnalysis: VisualAnalysis | null;
}

/* ── MCP Competitor Analysis ───────────────────────── */

export interface McpCompetitorRequest {
  url: string;
  headline?: string;
  executiveSummary?: string;
  overallScore?: number;
  categories?: Record<string, { score: number }>;
  auditId?: string;
}

export interface McpCompetitorResponse {
  analysis: CompetitorAnalysis;
}

/* ── MCP Error ─────────────────────────────────────── */

export interface McpErrorResponse {
  error: string;
  detail?: string;
}
