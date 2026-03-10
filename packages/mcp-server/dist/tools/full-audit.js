import { z } from "zod";
import { mcpFetch } from "../client.js";
export function registerFullAuditTool(server) {
    server.tool("full_audit", "Run a complete UXLens analysis: 9-layer UX audit + screenshot + AI visual analysis + attention heatmap. This is the most comprehensive analysis available — use it when you want everything in one call.", { url: z.string().url().describe("The website URL to fully audit") }, async ({ url }) => {
        let text = `# UXLens Full Audit Report\n\n`;
        text += `**URL:** ${url}\n\n`;
        // Step 1: UX Audit
        text += `---\n\n## Part 1: 9-Layer UX Audit\n\n`;
        const audit = await mcpFetch("/audit", { url });
        if (!audit.success || !audit.data) {
            text += `❌ UX audit failed.\n`;
            return { content: [{ type: "text", text }] };
        }
        const d = audit.data;
        text += `**Overall Score:** ${d.overallScore}/100 (${d.grade})\n\n`;
        text += `### Executive Summary\n\n${d.executiveSummary}\n\n`;
        const cats = Object.values(d.categories);
        text += `### Category Scores\n\n`;
        for (const cat of cats) {
            text += `- **${cat.name}:** ${cat.score}/100 (${cat.grade})\n`;
        }
        if (d.conversionKillers?.length) {
            text += `\n### 🚨 Conversion Killers\n\n`;
            d.conversionKillers.forEach((k, i) => { text += `${i + 1}. ${k}\n`; });
        }
        if (d.quickWins?.length) {
            text += `\n### ⚡ Quick Wins\n\n`;
            d.quickWins.forEach((w, i) => { text += `${i + 1}. ${w}\n`; });
        }
        if (d.strategicFixes?.length) {
            text += `\n### 🎯 Strategic Fixes\n\n`;
            d.strategicFixes.forEach((f, i) => { text += `${i + 1}. ${f}\n`; });
        }
        // Step 2: Screenshot
        text += `\n---\n\n## Part 2: Visual Analysis\n\n`;
        try {
            const screenshot = await mcpFetch("/screenshot", { url });
            if (screenshot.screenshotUrl) {
                text += `**Screenshot:** ${screenshot.screenshotUrl}\n\n`;
                // Step 3: Vision analysis
                const vision = await mcpFetch("/visual-analysis", {
                    screenshotUrl: screenshot.screenshotUrl,
                    pageHeight: screenshot.pageHeight,
                    viewportWidth: screenshot.viewportWidth,
                    auditId: audit.auditId,
                });
                if (vision.visualAnalysis) {
                    const va = vision.visualAnalysis;
                    text += `### Visual Design Scores\n\n`;
                    text += `| Metric | Score |\n|--------|-------|\n`;
                    text += `| Layout | ${va.layoutScore}/100 |\n`;
                    text += `| Visual Hierarchy | ${va.visualHierarchyScore}/100 |\n`;
                    text += `| Whitespace | ${va.whitespaceScore}/100 |\n`;
                    text += `| Color & Contrast | ${va.colorContrastScore}/100 |\n`;
                    text += `| Mobile Readiness | ${va.mobileReadinessScore}/100 |\n`;
                    text += `| **Overall** | **${va.overallVisualScore}/100** |\n`;
                    if (va.summary) {
                        text += `\n### Summary\n\n${va.summary}\n`;
                    }
                    if (va.findings?.length) {
                        text += `\n### Visual Findings\n\n`;
                        va.findings.forEach((f, i) => {
                            text += `${i + 1}. **[${f.severity.toUpperCase()}] ${f.category}** — ${f.issue}\n`;
                            text += `   → ${f.recommendation}\n`;
                        });
                    }
                }
                if (vision.heatmapZones?.length) {
                    text += `\n### Attention Heatmap (${vision.heatmapZones.length} zones)\n\n`;
                    const sorted = [...vision.heatmapZones].sort((a, b) => b.intensity - a.intensity);
                    for (const zone of sorted.slice(0, 10)) {
                        const level = zone.intensity >= 0.7 ? "HIGH" : zone.intensity >= 0.4 ? "MEDIUM" : "LOW";
                        text += `- **${zone.label}** — ${level} attention (${Math.round(zone.intensity * 100)}%)\n`;
                    }
                }
            }
            else {
                text += `⚠️ Screenshot capture failed — visual analysis skipped.\n`;
            }
        }
        catch (err) {
            text += `⚠️ Visual analysis unavailable: ${err instanceof Error ? err.message : "unknown error"}\n`;
        }
        return { content: [{ type: "text", text }] };
    });
}
//# sourceMappingURL=full-audit.js.map