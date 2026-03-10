import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { validateApiKey } from "@/lib/api-keys";
import { checkMcpRateLimit } from "@/lib/mcp-auth";
import { normalizeUrl } from "@/lib/validate-url";
import { fetchPageHTML } from "@/lib/fetch-html";
import { extractPageContent, hasEnoughContent } from "@/lib/extract-page-content";
import {
  generateUXAudit,
  generateVisionHeatmap,
  generateVisualAnalysis,
  identifyCompetitors,
  generateCompetitorComparison,
} from "@/lib/openai";
import { captureScreenshot } from "@/lib/screenshot";
import { hotspotsToZones } from "@/lib/heatmap";
import { getSupabase } from "@/lib/supabase";
import { saveAudit } from "@/lib/db/audits";
import type { PlanTier, UXAuditResult } from "@/lib/types";

// MCP + vision + screenshot can be slow
export const maxDuration = 60;

/* ── Auth Helper ─────────────────────────────────────── */

async function authenticateRequest(
  req: Request
): Promise<{ userId: string; keyId: string; plan: PlanTier } | Response> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing Authorization: Bearer uxl_..." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rawKey = authHeader.slice(7).trim();
  const result = await validateApiKey(rawKey);

  if (!result) {
    return new Response(JSON.stringify({ error: "Invalid or revoked API key" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const plan = (result.user.plan || "free") as PlanTier;
  if (plan !== "pro" && plan !== "agency") {
    return new Response(JSON.stringify({ error: "Pro or Agency plan required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return { userId: result.user.id, keyId: result.keyId, plan };
}

/* ── Category label map ──────────────────────────────── */

const CATEGORY_LABELS: Record<string, string> = {
  messageClarity: "Message Clarity",
  cognitiveLoad: "Cognitive Load",
  conversionArch: "Conversion Architecture",
  trustSignals: "Trust Signals",
  contradictions: "Contradictions",
  firstScreen: "First Screen",
};

function formatCategories(categories: UXAuditResult["categories"]): string {
  return Object.entries(categories)
    .map(([key, cat]) => `- **${CATEGORY_LABELS[key] || key}:** ${cat.score}/100`)
    .join("\n");
}

function formatHeuristics(audit: UXAuditResult): string {
  if (!audit.heuristicEvaluation) return "";

  const he = audit.heuristicEvaluation;
  let text = `\n## Heuristic Evaluation — ${he.overallHeuristicScore.toFixed(1)}/10\n\n`;
  text += `| Heuristic | Score |\n|-----------|-------|\n`;
  for (const h of he.heuristics) {
    const emoji = h.score >= 7 ? "✅" : h.score >= 4 ? "⚠️" : "❌";
    text += `| ${emoji} ${h.name} | ${h.score}/10 |\n`;
  }

  // Show top issues for low-scoring heuristics
  const lowScoring = he.heuristics.filter((h) => h.score < 5);
  if (lowScoring.length) {
    text += `\n### Key Issues\n\n`;
    for (const h of lowScoring) {
      text += `**${h.name}** (${h.score}/10):\n`;
      h.issues.forEach((issue) => { text += `- ${issue}\n`; });
    }
  }

  return text;
}

function formatUxStrengths(audit: UXAuditResult): string {
  if (!audit.uxStrengths?.length) return "";
  let text = `\n## ✨ UX Strengths\n\n`;
  audit.uxStrengths.forEach((s, i) => { text += `${i + 1}. ${s}\n`; });
  return text;
}

/* ── Create MCP Server with Tools ────────────────────── */

function createSkillServer(userId: string, keyId: string) {
  const server = new McpServer({
    name: "uxlens",
    version: "1.0.0",
  });

  // ── Tool 1: audit_url ──────────────────────────────
  server.tool(
    "audit_url",
    "Run a comprehensive 10-layer UX audit on a website. Returns overall score, category scores, Nielsen's heuristic evaluation (10 heuristics scored 0-10), professional findings with severity/category/fix, conversion killers, quick wins, strategic fixes, and UX strengths. Audits are performed by a senior UX auditor persona — findings are specific, evidence-based, and commercially aware.",
    { url: z.string().url().describe("The website URL to audit") },
    async ({ url }) => {
      const allowed = await checkMcpRateLimit(keyId, "audit", 20);
      if (!allowed) return { content: [{ type: "text" as const, text: "⏳ Rate limit: max 20 audits/hour. Please wait." }] };

      const normalized = normalizeUrl(url);

      let html: string;
      try {
        html = await fetchPageHTML(normalized);
      } catch {
        return { content: [{ type: "text" as const, text: `❌ Could not reach ${normalized}. The page may block automated requests.` }] };
      }

      const content = extractPageContent(html, normalized);
      if (!hasEnoughContent(content)) {
        return { content: [{ type: "text" as const, text: "❌ Page content too limited to analyze." }] };
      }

      const audit = await generateUXAudit(content);
      if (!audit) {
        return { content: [{ type: "text" as const, text: "❌ AI analysis failed. Try again." }] };
      }

      // Save audit
      let auditId: string | undefined;
      try {
        const id = await saveAudit({ userId, url: normalized, result: audit });
        if (id) auditId = id;
      } catch { /* non-critical */ }

      let text = `# UXLens Audit: ${normalized}\n\n`;
      text += `**Score:** ${audit.overallScore}/100 (${audit.grade})`;
      if (auditId) text += ` | **ID:** ${auditId}`;
      text += `\n\n## Summary\n\n${audit.executiveSummary}\n`;

      text += `\n## Scores\n\n${formatCategories(audit.categories)}\n`;

      if (audit.conversionKillers?.length) {
        text += `\n## 🚨 Conversion Killers\n\n`;
        audit.conversionKillers.forEach((k: string, i: number) => { text += `${i + 1}. ${k}\n`; });
      }
      if (audit.quickWins?.length) {
        text += `\n## ⚡ Quick Wins\n\n`;
        audit.quickWins.forEach((w: string, i: number) => { text += `${i + 1}. ${w}\n`; });
      }
      if (audit.strategicFixes?.length) {
        text += `\n## 🎯 Strategic Fixes\n\n`;
        audit.strategicFixes.forEach((f: string, i: number) => { text += `${i + 1}. ${f}\n`; });
      }

      // Top findings with severity
      const allFindings = audit.sections?.flatMap((s) => s.findings) || [];
      const criticalAndHigh = allFindings.filter((f) => f.severity === "critical" || f.severity === "high");
      if (criticalAndHigh.length) {
        text += `\n## 🔴 Critical & High Severity Findings\n\n`;
        criticalAndHigh.slice(0, 8).forEach((f, i) => {
          text += `${i + 1}. **[${(f.severity || "high").toUpperCase()}]** ${f.title}\n`;
          text += `   ${f.desc}\n`;
          if (f.whyItMatters) text += `   *Why it matters:* ${f.whyItMatters}\n`;
          if (f.recommendedFix) text += `   *Fix:* ${f.recommendedFix}\n`;
          text += `\n`;
        });
      }

      text += formatHeuristics(audit);
      text += formatUxStrengths(audit);

      return { content: [{ type: "text" as const, text }] };
    }
  );

  // ── Tool 2: visual_analysis ────────────────────────
  server.tool(
    "visual_analysis",
    "Capture a screenshot and run AI visual analysis. Returns attention heatmap zones, visual design scores (layout, hierarchy, whitespace, contrast, mobile), and professional findings. Analysis uses eye-tracking principles and senior UX auditor methodology.",
    { url: z.string().url().describe("The website URL to analyze visually") },
    async ({ url }) => {
      const allowed = await checkMcpRateLimit(keyId, "visual", 10);
      if (!allowed) return { content: [{ type: "text" as const, text: "⏳ Rate limit: max 10 visual analyses/hour." }] };

      // Capture screenshot
      let screenshotUrl: string | undefined;
      let pageHeight = 3000;
      let viewportWidth = 1280;

      try {
        const result = await captureScreenshot(url);
        pageHeight = result.pageHeight;
        viewportWidth = result.viewportWidth;

        // Upload to Supabase
        const sb = getSupabase();
        if (sb) {
          const filename = `${Date.now()}-${encodeURIComponent(new URL(url).hostname)}.jpg`;
          const { error } = await sb.storage.from("screenshots").upload(filename, result.buffer, {
            contentType: "image/jpeg",
            cacheControl: "31536000",
          });
          if (!error) {
            const { data } = sb.storage.from("screenshots").getPublicUrl(filename);
            screenshotUrl = data.publicUrl;
          }
        }
      } catch (e) {
        return { content: [{ type: "text" as const, text: `❌ Screenshot failed: ${e instanceof Error ? e.message : "unknown"}` }] };
      }

      if (!screenshotUrl) {
        return { content: [{ type: "text" as const, text: "❌ Screenshot upload failed." }] };
      }

      // Run vision analysis
      const imgRes = await fetch(screenshotUrl, { signal: AbortSignal.timeout(15000) });
      const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
      const base64 = imgBuffer.toString("base64");

      const [hotspots, visAnalysis] = await Promise.all([
        generateVisionHeatmap(base64),
        generateVisualAnalysis(base64),
      ]);

      const zones = hotspotsToZones(hotspots, viewportWidth, pageHeight);

      let text = `# Visual Analysis: ${url}\n\n`;
      text += `**Screenshot:** ${screenshotUrl}\n\n`;

      if (visAnalysis) {
        text += `## Design Scores\n\n`;
        text += `| Metric | Score |\n|--------|-------|\n`;
        text += `| Layout | ${visAnalysis.layoutScore}/100 |\n`;
        text += `| Hierarchy | ${visAnalysis.visualHierarchyScore}/100 |\n`;
        text += `| Whitespace | ${visAnalysis.whitespaceScore}/100 |\n`;
        text += `| Color/Contrast | ${visAnalysis.colorContrastScore}/100 |\n`;
        text += `| Mobile | ${visAnalysis.mobileReadinessScore}/100 |\n`;
        text += `| **Overall** | **${visAnalysis.overallVisualScore}/100** |\n`;

        if (visAnalysis.summary) text += `\n## Summary\n\n${visAnalysis.summary}\n`;

        if (visAnalysis.findings?.length) {
          text += `\n## Findings\n\n`;
          visAnalysis.findings.forEach((f, i) => {
            text += `${i + 1}. **[${f.type.toUpperCase()}]** ${f.title} — ${f.desc}\n`;
          });
        }
      }

      if (zones.length) {
        text += `\n## Attention Zones (${zones.length})\n\n`;
        const sorted = [...zones].sort((a, b) => b.intensity - a.intensity);
        for (const z of sorted.slice(0, 10)) {
          const lvl = z.intensity >= 0.7 ? "HIGH" : z.intensity >= 0.4 ? "MEDIUM" : "LOW";
          text += `- **${z.label}** — ${lvl} (${Math.round(z.intensity * 100)}%)\n`;
        }
      }

      return { content: [{ type: "text" as const, text }] };
    }
  );

  // ── Tool 3: competitor_analysis ────────────────────
  server.tool(
    "competitor_analysis",
    "Compare a website against its top 2 competitors. Returns competitive positioning, category-by-category scoring, score gaps, strengths/weaknesses per competitor, and 5 actionable competitive advantages.",
    { url: z.string().url().describe("Your website URL to compare") },
    async ({ url }) => {
      const allowed = await checkMcpRateLimit(keyId, "competitor", 5);
      if (!allowed) return { content: [{ type: "text" as const, text: "⏳ Rate limit: max 5 competitor analyses/hour." }] };

      // First audit
      const normalized = normalizeUrl(url);
      let html: string;
      try { html = await fetchPageHTML(normalized); } catch {
        return { content: [{ type: "text" as const, text: `❌ Could not reach ${normalized}.` }] };
      }

      const pageContent = extractPageContent(html, normalized);
      const audit = await generateUXAudit(pageContent);
      if (!audit) return { content: [{ type: "text" as const, text: "❌ Audit failed." }] };

      // Identify competitors
      const competitors = await identifyCompetitors(normalized, "", audit.executiveSummary);
      if (!competitors.length) return { content: [{ type: "text" as const, text: "❌ Could not identify competitors." }] };

      // Validate + fetch competitor content
      const compsWithContent: { url: string; name: string; content: ReturnType<typeof extractPageContent> }[] = [];
      for (const comp of competitors) {
        try {
          const cHtml = await fetchPageHTML(comp.url);
          compsWithContent.push({ url: comp.url, name: comp.name, content: extractPageContent(cHtml, comp.url) });
        } catch { /* skip unreachable */ }
      }

      if (!compsWithContent.length) return { content: [{ type: "text" as const, text: "❌ Could not reach competitor sites." }] };

      const analysis = await generateCompetitorComparison(
        normalized, pageContent, { overallScore: audit.overallScore, categories: audit.categories }, compsWithContent
      );

      let text = `# Competitor Benchmarking: ${normalized}\n\n`;
      text += `**Your Score:** ${analysis.userOverallScore}/100\n`;
      text += `**Avg Competitor:** ${analysis.averageCompetitorScore}/100\n`;
      text += `**Gap:** ${analysis.scoreGap > 0 ? "+" : ""}${analysis.scoreGap}\n\n`;
      text += `## Position\n\n${analysis.competitivePosition}\n`;

      if (analysis.competitors?.length) {
        text += `\n## Competitors\n\n`;
        for (const c of analysis.competitors) {
          text += `### ${c.name} (${c.url}) — ${c.estimatedScore}/100\n`;
          if (c.strengths?.length) text += `Strengths: ${c.strengths.join(", ")}\n`;
          if (c.weaknesses?.length) text += `Weaknesses: ${c.weaknesses.join(", ")}\n\n`;
        }
      }

      if (analysis.competitiveAdvantages?.length) {
        text += `## Your Advantages\n\n`;
        analysis.competitiveAdvantages.forEach((a: string, i: number) => { text += `${i + 1}. ${a}\n`; });
      }

      return { content: [{ type: "text" as const, text }] };
    }
  );

  // ── Tool 4: full_audit ─────────────────────────────
  server.tool(
    "full_audit",
    "Complete UXLens analysis: 10-layer professional UX audit + Nielsen's heuristic evaluation + screenshot + AI attention heatmap + visual design analysis. The most comprehensive tool — combines senior auditor methodology with AI vision for a full diagnostic report.",
    { url: z.string().url().describe("The website URL to fully audit") },
    async ({ url }) => {
      const allowed = await checkMcpRateLimit(keyId, "full", 10);
      if (!allowed) return { content: [{ type: "text" as const, text: "⏳ Rate limit reached." }] };

      let text = `# UXLens Full Report: ${url}\n\n`;
      const normalized = normalizeUrl(url);

      // Part 1: Audit
      let html: string;
      try { html = await fetchPageHTML(normalized); } catch {
        return { content: [{ type: "text" as const, text: `❌ Could not reach ${normalized}.` }] };
      }

      const pageContent = extractPageContent(html, normalized);
      if (!hasEnoughContent(pageContent)) {
        return { content: [{ type: "text" as const, text: "❌ Page content too limited." }] };
      }

      const audit = await generateUXAudit(pageContent);
      if (!audit) return { content: [{ type: "text" as const, text: "❌ Audit failed." }] };

      let auditId: string | undefined;
      try {
        const id = await saveAudit({ userId, url: normalized, result: audit });
        if (id) auditId = id;
      } catch { /* non-critical */ }

      text += `## UX Audit — ${audit.overallScore}/100 (${audit.grade})\n\n`;
      text += `${audit.executiveSummary}\n\n`;
      text += `${formatCategories(audit.categories)}\n`;

      if (audit.conversionKillers?.length) {
        text += `\n### Conversion Killers\n`;
        audit.conversionKillers.forEach((k: string, i: number) => { text += `${i + 1}. ${k}\n`; });
      }
      if (audit.quickWins?.length) {
        text += `\n### Quick Wins\n`;
        audit.quickWins.forEach((w: string, i: number) => { text += `${i + 1}. ${w}\n`; });
      }

      // Top findings with severity
      const fullFindings = audit.sections?.flatMap((s) => s.findings) || [];
      const critHigh = fullFindings.filter((f) => f.severity === "critical" || f.severity === "high");
      if (critHigh.length) {
        text += `\n### Critical & High Severity Findings\n`;
        critHigh.slice(0, 6).forEach((f, i) => {
          text += `${i + 1}. **[${(f.severity || "high").toUpperCase()}]** ${f.title} — ${f.desc}`;
          if (f.recommendedFix) text += ` *Fix: ${f.recommendedFix}*`;
          text += `\n`;
        });
      }

      text += formatHeuristics(audit);
      text += formatUxStrengths(audit);

      // Part 2: Visual
      text += `\n---\n\n## Visual Analysis\n\n`;
      try {
        const ss = await captureScreenshot(normalized);
        const sb = getSupabase();
        if (sb) {
          const fname = `${Date.now()}-${encodeURIComponent(new URL(normalized).hostname)}.jpg`;
          const { error } = await sb.storage.from("screenshots").upload(fname, ss.buffer, { contentType: "image/jpeg" });
          if (!error) {
            const { data } = sb.storage.from("screenshots").getPublicUrl(fname);
            text += `**Screenshot:** ${data.publicUrl}\n\n`;

            const imgRes = await fetch(data.publicUrl, { signal: AbortSignal.timeout(15000) });
            const b64 = Buffer.from(await imgRes.arrayBuffer()).toString("base64");
            const [hotspots, vis] = await Promise.all([generateVisionHeatmap(b64), generateVisualAnalysis(b64)]);
            const zones = hotspotsToZones(hotspots, ss.viewportWidth, ss.pageHeight);

            if (vis) {
              text += `| Metric | Score |\n|--------|-------|\n`;
              text += `| Layout | ${vis.layoutScore} | Hierarchy | ${vis.visualHierarchyScore} | Whitespace | ${vis.whitespaceScore} |\n`;
              text += `| Contrast | ${vis.colorContrastScore} | Mobile | ${vis.mobileReadinessScore} | **Overall** | **${vis.overallVisualScore}** |\n\n`;
              if (vis.summary) text += `${vis.summary}\n`;
            }

            if (zones.length) {
              text += `\n### Top Attention Zones\n`;
              [...zones].sort((a, b) => b.intensity - a.intensity).slice(0, 8).forEach((z) => {
                const lvl = z.intensity >= 0.7 ? "HIGH" : z.intensity >= 0.4 ? "MED" : "LOW";
                text += `- **${z.label}** (${lvl})\n`;
              });
            }
          }
        }
      } catch (e) {
        text += `⚠️ Visual analysis unavailable: ${e instanceof Error ? e.message : "error"}\n`;
      }

      return { content: [{ type: "text" as const, text }] };
    }
  );

  return server;
}

/* ── Convert Next.js Request to Node IncomingMessage ── */

function toNodeRequest(req: Request, body: string): IncomingMessage {
  const readable = new Readable();
  readable.push(body);
  readable.push(null);

  const incoming = readable as unknown as IncomingMessage;
  incoming.method = req.method;
  incoming.url = new URL(req.url).pathname;
  incoming.headers = {};
  req.headers.forEach((value, key) => {
    incoming.headers[key.toLowerCase()] = value;
  });

  return incoming;
}

/* ── POST: Handle MCP requests ────────────────────── */

export async function POST(request: Request) {
  // Auth
  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;
  const { userId, keyId } = auth;

  // Read body
  const body = await request.text();

  // Create stateless transport + server
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
    enableJsonResponse: true,
  });

  const server = createSkillServer(userId, keyId);
  await server.connect(transport);

  // Convert to Node request/response and handle
  const nodeReq = toNodeRequest(request, body);

  return new Promise<Response>((resolve) => {
    const chunks: Buffer[] = [];
    let statusCode = 200;
    const responseHeaders: Record<string, string> = {};

    const nodeRes = {
      writeHead(code: number, headers?: Record<string, string>) {
        statusCode = code;
        if (headers) Object.assign(responseHeaders, headers);
        return nodeRes;
      },
      setHeader(name: string, value: string) {
        responseHeaders[name.toLowerCase()] = value;
      },
      getHeader(name: string) {
        return responseHeaders[name.toLowerCase()];
      },
      write(chunk: string | Buffer) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        return true;
      },
      end(chunk?: string | Buffer) {
        if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        const responseBody = Buffer.concat(chunks).toString();
        resolve(new Response(responseBody, {
          status: statusCode,
          headers: responseHeaders,
        }));
      },
      on() { return nodeRes; },
    } as unknown as ServerResponse;

    transport.handleRequest(nodeReq, nodeRes, JSON.parse(body));
  });
}

/* ── GET: Not needed for stateless mode ──────────── */

export async function GET() {
  return new Response(JSON.stringify({
    jsonrpc: "2.0",
    error: { code: -32000, message: "SSE not supported. Use POST for MCP requests." },
    id: null,
  }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
}

/* ── DELETE: Not needed for stateless mode ───────── */

export async function DELETE() {
  return new Response(JSON.stringify({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Stateless server — no sessions to delete." },
    id: null,
  }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
}
