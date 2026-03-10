import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { mcpFetch } from "../client.js";

interface AuditCategory {
  name: string;
  score: number;
  grade: string;
  summary: string;
}

interface AuditResponse {
  success: boolean;
  data: {
    overallScore: number;
    grade: string;
    executiveSummary: string;
    conversionKillers: string[];
    quickWins: string[];
    strategicFixes: string[];
    categories: Record<string, AuditCategory>;
  };
  url: string;
  auditId?: string;
}

export function registerAuditTool(server: McpServer) {
  server.tool(
    "audit_url",
    "Run a comprehensive 9-layer UX audit on a website URL. Returns overall score, category scores, conversion killers, quick wins, and strategic fixes.",
    { url: z.string().url().describe("The website URL to audit (e.g., https://example.com)") },
    async ({ url }) => {
      const result = await mcpFetch<AuditResponse>("/audit", { url });

      if (!result.success || !result.data) {
        return {
          content: [{ type: "text" as const, text: "❌ Audit failed. The page may be unreachable or have insufficient content." }],
        };
      }

      const d = result.data;
      const cats = Object.values(d.categories);

      let text = `# UXLens Audit Report\n\n`;
      text += `**URL:** ${result.url}\n`;
      text += `**Overall Score:** ${d.overallScore}/100 (${d.grade})\n`;
      if (result.auditId) text += `**Audit ID:** ${result.auditId}\n`;
      text += `\n## Executive Summary\n\n${d.executiveSummary}\n`;

      text += `\n## Category Scores\n\n`;
      for (const cat of cats) {
        text += `- **${cat.name}:** ${cat.score}/100 (${cat.grade}) — ${cat.summary}\n`;
      }

      if (d.conversionKillers?.length) {
        text += `\n## 🚨 Conversion Killers\n\n`;
        d.conversionKillers.forEach((k, i) => { text += `${i + 1}. ${k}\n`; });
      }

      if (d.quickWins?.length) {
        text += `\n## ⚡ Quick Wins\n\n`;
        d.quickWins.forEach((w, i) => { text += `${i + 1}. ${w}\n`; });
      }

      if (d.strategicFixes?.length) {
        text += `\n## 🎯 Strategic Fixes\n\n`;
        d.strategicFixes.forEach((f, i) => { text += `${i + 1}. ${f}\n`; });
      }

      return { content: [{ type: "text" as const, text }] };
    }
  );
}
