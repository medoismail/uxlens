import { NextResponse } from "next/server";
import { fetchPageHTML } from "@/lib/fetch-html";
import { extractPageContent } from "@/lib/extract-page-content";
import { identifyCompetitors, generateCompetitorComparison } from "@/lib/openai";
import { updateCompetitorAnalysis } from "@/lib/db/audits";
import { authenticateMcpRequest, checkMcpRateLimit } from "@/lib/mcp-auth";
import type { CompetitorAnalysis } from "@/lib/types";

export const maxDuration = 60;

/**
 * POST /api/mcp/competitor-analysis
 * API key-authenticated competitor analysis.
 */
export async function POST(request: Request) {
  try {
    // 1. Auth
    const authResult = await authenticateMcpRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user, keyId } = authResult;

    // 2. Rate limit: 5 competitor analyses/hour per key
    const allowed = await checkMcpRateLimit(keyId, "competitor", 5);
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit: max 5 competitor analyses per hour" },
        { status: 429 }
      );
    }

    // 3. Parse
    const body = await request.json();
    const { url, auditId, overallScore, categories, headline, executiveSummary } = body;

    if (!url || !overallScore || !categories) {
      return NextResponse.json(
        { error: "Missing required fields: url, overallScore, categories" },
        { status: 400 }
      );
    }

    // 4. Identify competitors via AI
    const competitorSuggestions = await identifyCompetitors(
      url,
      headline || "",
      executiveSummary || ""
    );

    if (!competitorSuggestions.length) {
      return NextResponse.json(
        { error: "Could not identify competitors for this site" },
        { status: 422 }
      );
    }

    // 5. Validate competitor URLs with HEAD requests
    const validatedCompetitors: typeof competitorSuggestions = [];
    for (const comp of competitorSuggestions) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        const headRes = await fetch(comp.url, {
          method: "HEAD",
          signal: controller.signal,
          redirect: "follow",
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; UXLensBot/1.0; +https://www.uxlens.pro)",
          },
        });
        clearTimeout(timer);
        if (headRes.ok || headRes.status === 405 || headRes.status === 403) {
          validatedCompetitors.push(comp);
        }
      } catch {
        console.warn(`[MCP CompetitorAnalysis] Skipping unreachable: ${comp.url}`);
      }
    }

    if (!validatedCompetitors.length) {
      return NextResponse.json(
        { error: "Could not reach any identified competitor websites" },
        { status: 422 }
      );
    }

    // 6. Fetch competitor HTML in parallel
    const htmlResults = await Promise.allSettled(
      validatedCompetitors.map((c) => fetchPageHTML(c.url))
    );

    const competitorsWithContent: {
      url: string;
      name: string;
      content: ReturnType<typeof extractPageContent>;
    }[] = [];

    htmlResults.forEach((result, i) => {
      if (result.status === "fulfilled") {
        const content = extractPageContent(result.value, validatedCompetitors[i].url);
        competitorsWithContent.push({
          url: validatedCompetitors[i].url,
          name: validatedCompetitors[i].name,
          content,
        });
      }
    });

    if (!competitorsWithContent.length) {
      return NextResponse.json(
        { error: "Could not fetch content from competitor websites" },
        { status: 422 }
      );
    }

    // 7. Fetch user's own page for comparison
    let userContent;
    try {
      const userHtml = await fetchPageHTML(url);
      userContent = extractPageContent(userHtml, url);
    } catch {
      return NextResponse.json(
        { error: "Could not re-fetch your page for comparison" },
        { status: 500 }
      );
    }

    // 8. Run deep competitor comparison
    const analysis: CompetitorAnalysis = await generateCompetitorComparison(
      url,
      userContent,
      { overallScore, categories },
      competitorsWithContent
    );

    // 9. Save if auditId provided
    if (auditId) {
      try {
        await updateCompetitorAnalysis(auditId, user.clerk_id, analysis);
      } catch (e) {
        console.error("[MCP CompetitorAnalysis] Failed to save:", e);
      }
    }

    return NextResponse.json({ success: true, data: analysis });
  } catch (error) {
    console.error("[MCP CompetitorAnalysis] Error:", error);
    return NextResponse.json(
      { error: "Competitor analysis failed" },
      { status: 500 }
    );
  }
}
