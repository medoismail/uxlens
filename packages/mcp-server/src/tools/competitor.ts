import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { mcpFetch } from "../client.js";

interface AuditResponse {
  success: boolean;
  data: {
    overallScore: number;
    executiveSummary: string;
    categories: Record<string, { name: string; score: number }>;
  };
  url: string;
}

interface CompetitorResponse {
  success: boolean;
  data: {
    competitors: { url: string; name: string; overallScore: number; strengths: string[]; weaknesses: string[] }[];
    competitiveAdvantages: string[];
    competitivePosition: string;
    userOverallScore: number;
    averageCompetitorScore: number;
    scoreGap: number;
    categoryComparisons: { category: string; userScore: number; avgCompetitorScore: number; insight: string }[];
  };
}

export function registerCompetitorTool(server: McpServer) {
  server.tool(
    "competitor_analysis",
    "Compare a website against its top competitors. First runs a UX audit, then identifies and benchmarks competitors. Returns competitive positioning, score gaps, and advantages.",
    { url: z.string().url().describe("Your website URL to compare against competitors") },
    async ({ url }) => {
      // Step 1: Run audit first to get scores
      const audit = await mcpFetch<AuditResponse>("/audit", { url });

      if (!audit.success || !audit.data) {
        return {
          content: [{ type: "text" as const, text: "❌ Could not audit the URL. Competitor analysis requires a successful audit first." }],
        };
      }

      // Step 2: Run competitor analysis
      const comp = await mcpFetch<CompetitorResponse>("/competitor-analysis", {
        url,
        overallScore: audit.data.overallScore,
        categories: audit.data.categories,
        headline: "",
        executiveSummary: audit.data.executiveSummary,
      });

      if (!comp.success || !comp.data) {
        return {
          content: [{ type: "text" as const, text: "❌ Competitor analysis failed. Could not identify or reach competitors." }],
        };
      }

      const d = comp.data;
      let text = `# Competitor Benchmarking Report\n\n`;
      text += `**Your URL:** ${url}\n`;
      text += `**Your Score:** ${d.userOverallScore}/100\n`;
      text += `**Avg Competitor Score:** ${d.averageCompetitorScore}/100\n`;
      text += `**Score Gap:** ${d.scoreGap > 0 ? "+" : ""}${d.scoreGap}\n\n`;

      text += `## Competitive Position\n\n${d.competitivePosition}\n`;

      if (d.competitors?.length) {
        text += `\n## Competitors\n\n`;
        for (const c of d.competitors) {
          text += `### ${c.name} (${c.url})\n`;
          text += `**Score:** ${c.overallScore}/100\n`;
          if (c.strengths?.length) {
            text += `**Strengths:** ${c.strengths.join(", ")}\n`;
          }
          if (c.weaknesses?.length) {
            text += `**Weaknesses:** ${c.weaknesses.join(", ")}\n`;
          }
          text += `\n`;
        }
      }

      if (d.categoryComparisons?.length) {
        text += `## Category Comparison\n\n`;
        text += `| Category | You | Competitors | Insight |\n|----------|-----|-------------|--------|\n`;
        for (const cc of d.categoryComparisons) {
          text += `| ${cc.category} | ${cc.userScore} | ${cc.avgCompetitorScore} | ${cc.insight} |\n`;
        }
      }

      if (d.competitiveAdvantages?.length) {
        text += `\n## Your Competitive Advantages\n\n`;
        d.competitiveAdvantages.forEach((a, i) => { text += `${i + 1}. ${a}\n`; });
      }

      return { content: [{ type: "text" as const, text }] };
    }
  );
}
