import { NextResponse } from "next/server";
import { analyzeRequestSchema } from "@/lib/schemas";
import { normalizeUrl } from "@/lib/validate-url";
import { extractPageContent, hasEnoughContent } from "@/lib/extract-page-content";
import { generateUXAudit } from "@/lib/openai";
import { fetchPageHTML } from "@/lib/fetch-html";
import { saveAudit } from "@/lib/db/audits";
import { authenticateMcpRequest, checkMcpRateLimit } from "@/lib/mcp-auth";

export const maxDuration = 120;

/**
 * POST /api/mcp/audit
 * API key-authenticated UX audit. Mirrors /api/analyze.
 */
export async function POST(request: Request) {
  try {
    // 1. Auth
    const authResult = await authenticateMcpRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user, keyId } = authResult;

    // 2. Rate limit: 20 audits/hour per key
    const allowed = await checkMcpRateLimit(keyId, "audit", 20);
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit: max 20 audits per hour" },
        { status: 429 }
      );
    }

    // 3. Parse & validate
    const body = await request.json();
    const parsed = analyzeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid URL" },
        { status: 400 }
      );
    }

    const url = normalizeUrl(parsed.data.url);

    // 4. Fetch HTML
    let html: string;
    try {
      html = await fetchPageHTML(url);
    } catch (e) {
      console.error(`[MCP Audit] Fetch failed for ${url}:`, e);
      return NextResponse.json(
        { error: "Could not reach this page. It may block automated requests." },
        { status: 422 }
      );
    }

    // 5. Extract content
    const content = extractPageContent(html, url);
    if (!hasEnoughContent(content)) {
      return NextResponse.json(
        { error: "Page content too limited to analyze. Try another URL." },
        { status: 422 }
      );
    }

    // 6. Run AI audit
    const audit = await generateUXAudit(content);
    if (!audit) {
      return NextResponse.json(
        { error: "AI analysis failed. Please try again." },
        { status: 500 }
      );
    }

    // 7. Save audit
    let auditId: string | undefined;
    try {
      const id = await saveAudit({
        userId: user.id,
        url,
        result: audit,
      });
      if (id) auditId = id;
    } catch {
      console.error("[MCP Audit] Failed to save audit");
    }

    // 8. Return
    return NextResponse.json({
      success: true,
      data: audit,
      url,
      ...(auditId && { auditId }),
    });
  } catch (error) {
    console.error("[MCP Audit] Error:", error);
    return NextResponse.json(
      { error: "Audit failed unexpectedly" },
      { status: 500 }
    );
  }
}
