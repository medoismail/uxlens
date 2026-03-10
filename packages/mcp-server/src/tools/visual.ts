import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { mcpFetch } from "../client.js";

interface ScreenshotResponse {
  screenshotUrl?: string;
  pageHeight: number;
  viewportWidth: number;
}

interface HeatmapZone {
  x: number;
  y: number;
  width: number;
  height: number;
  intensity: number;
  label: string;
}

interface VisualAnalysisResponse {
  heatmapZones: HeatmapZone[];
  visualAnalysis: {
    layoutScore: number;
    visualHierarchyScore: number;
    whitespaceScore: number;
    colorContrastScore: number;
    mobileReadinessScore: number;
    overallVisualScore: number;
    findings: { severity: string; category: string; issue: string; recommendation: string }[];
    summary: string;
  } | null;
  pageHeight: number;
  viewportWidth: number;
}

export function registerVisualTool(server: McpServer) {
  server.tool(
    "visual_analysis",
    "Capture a screenshot of a website and run AI visual analysis. Returns attention heatmap zones and visual design scores (layout, hierarchy, whitespace, contrast, mobile readiness).",
    { url: z.string().url().describe("The website URL to analyze visually") },
    async ({ url }) => {
      // Step 1: Capture screenshot
      const screenshot = await mcpFetch<ScreenshotResponse>("/screenshot", { url });

      if (!screenshot.screenshotUrl) {
        return {
          content: [{ type: "text" as const, text: "❌ Screenshot capture failed. The page may be unreachable." }],
        };
      }

      // Step 2: Run vision analysis
      const vision = await mcpFetch<VisualAnalysisResponse>("/visual-analysis", {
        screenshotUrl: screenshot.screenshotUrl,
        pageHeight: screenshot.pageHeight,
        viewportWidth: screenshot.viewportWidth,
      });

      let text = `# Visual Analysis Report\n\n`;
      text += `**URL:** ${url}\n`;
      text += `**Screenshot:** ${screenshot.screenshotUrl}\n\n`;

      if (vision.visualAnalysis) {
        const va = vision.visualAnalysis;
        text += `## Visual Design Scores\n\n`;
        text += `| Metric | Score |\n|--------|-------|\n`;
        text += `| Layout | ${va.layoutScore}/100 |\n`;
        text += `| Visual Hierarchy | ${va.visualHierarchyScore}/100 |\n`;
        text += `| Whitespace | ${va.whitespaceScore}/100 |\n`;
        text += `| Color & Contrast | ${va.colorContrastScore}/100 |\n`;
        text += `| Mobile Readiness | ${va.mobileReadinessScore}/100 |\n`;
        text += `| **Overall** | **${va.overallVisualScore}/100** |\n`;

        if (va.summary) {
          text += `\n## Summary\n\n${va.summary}\n`;
        }

        if (va.findings?.length) {
          text += `\n## Visual Findings\n\n`;
          va.findings.forEach((f, i) => {
            text += `${i + 1}. **[${f.severity.toUpperCase()}] ${f.category}** — ${f.issue}\n`;
            text += `   → ${f.recommendation}\n`;
          });
        }
      }

      if (vision.heatmapZones?.length) {
        text += `\n## Attention Heatmap Zones (${vision.heatmapZones.length} zones)\n\n`;
        const sorted = [...vision.heatmapZones].sort((a, b) => b.intensity - a.intensity);
        for (const zone of sorted.slice(0, 10)) {
          const level = zone.intensity >= 0.7 ? "HIGH" : zone.intensity >= 0.4 ? "MEDIUM" : "LOW";
          text += `- **${zone.label}** — ${level} attention (${Math.round(zone.intensity * 100)}%)\n`;
        }
      }

      return { content: [{ type: "text" as const, text }] };
    }
  );
}
