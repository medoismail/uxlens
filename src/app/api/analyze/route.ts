import { NextResponse } from "next/server";
import { analyzeRequestSchema } from "@/lib/schemas";
import { normalizeUrl } from "@/lib/validate-url";
import { extractPageContent, hasEnoughContent } from "@/lib/extract-page-content";
import { generateUXAudit } from "@/lib/openai";
import { checkServerUsage, incrementServerUsage } from "@/lib/server-usage";
import type { AnalysisError } from "@/lib/types";

function errorResponse(error: string, code: AnalysisError["code"], status = 400) {
  return NextResponse.json({ success: false, error, code } satisfies AnalysisError, { status });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validate input
    const parsed = analyzeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        parsed.error.issues[0]?.message || "Invalid URL",
        "INVALID_URL"
      );
    }

    const url = normalizeUrl(parsed.data.url);
    const email = parsed.data.email;

    // 2. Check server-side usage limits
    const usage = await checkServerUsage(request, email);
    if (!usage.audit_allowed) {
      return NextResponse.json(
        { success: false, error: usage.reason, code: "USAGE_LIMIT", usage } satisfies AnalysisError,
        { status: 429 }
      );
    }

    // 3. Fetch the target page HTML
    let html: string;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        redirect: "follow",
      });

      clearTimeout(timeout);

      if (!res.ok) {
        return errorResponse(
          "We couldn't read this page. The server returned an error.",
          "FETCH_FAILED"
        );
      }

      html = await res.text();
    } catch {
      return errorResponse(
        "We couldn't reach this page. It may block automated analysis or be unavailable.",
        "FETCH_FAILED"
      );
    }

    // 4. Extract structured content from HTML
    const content = extractPageContent(html, url);

    if (!hasEnoughContent(content)) {
      return errorResponse(
        "The page content was too limited to analyze properly. Try another public landing page URL.",
        "CONTENT_TOO_WEAK"
      );
    }

    // 5. Generate UX audit via OpenAI
    let audit;
    try {
      audit = await generateUXAudit(content);
    } catch {
      return errorResponse(
        "We couldn't generate the analysis right now. Please try again.",
        "AI_FAILED",
        500
      );
    }

    // 6. Increment usage after successful audit
    await incrementServerUsage(request, email);

    // 7. Return successful result
    return NextResponse.json({
      success: true,
      data: audit,
      url,
    });
  } catch {
    return errorResponse(
      "Something went wrong. Please try again.",
      "PARSE_FAILED",
      500
    );
  }
}
