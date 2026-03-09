import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { analyzeRequestSchema } from "@/lib/schemas";
import { normalizeUrl } from "@/lib/validate-url";
import { extractPageContent, hasEnoughContent } from "@/lib/extract-page-content";
import { generateUXAudit } from "@/lib/openai";
import { checkServerUsage, incrementServerUsage } from "@/lib/server-usage";
import { getUserByClerkId, upsertUser } from "@/lib/db/users";
import { saveAudit } from "@/lib/db/audits";
import type { AnalysisError } from "@/lib/types";

// Keep generous for Vercel Pro; Hobby caps at 10s regardless
export const maxDuration = 60;

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

    // 1b. Optionally get Clerk userId (won't fail for anonymous users)
    let clerkUserId: string | undefined;
    try {
      const { userId } = await auth();
      if (userId) clerkUserId = userId;
    } catch {
      // Not authenticated — that's fine, continue as anonymous
    }

    // 2. Check server-side usage limits
    const usage = await checkServerUsage(request, email, clerkUserId);
    if (!usage.audit_allowed) {
      return NextResponse.json(
        { success: false, error: usage.reason, code: "USAGE_LIMIT", usage } satisfies AnalysisError,
        { status: 429 }
      );
    }

    // 3. Fetch the target page HTML (tight timeout for Vercel Hobby)
    let html: string;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Upgrade-Insecure-Requests": "1",
        },
        redirect: "follow",
      });

      clearTimeout(timer);

      if (!res.ok) {
        console.error(`[Analyze] HTTP ${res.status} for ${url}`);
        return errorResponse(
          `We couldn't read this page (HTTP ${res.status}).`,
          "FETCH_FAILED"
        );
      }

      html = await res.text();
    } catch (fetchErr) {
      console.error(`[Analyze] Fetch failed for ${url}:`, fetchErr);
      return errorResponse(
        "We couldn't reach this page. It may block automated analysis or be temporarily unavailable.",
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

    // 5. Run AI audit only (screenshot is handled by a separate endpoint)
    const audit = await generateUXAudit(content);

    if (!audit) {
      return errorResponse(
        "We couldn't generate the analysis right now. Please try again.",
        "AI_FAILED",
        500
      );
    }

    // 6. Increment usage after successful audit
    await incrementServerUsage(request, email, clerkUserId);

    // 7. Save audit to Supabase if user is authenticated
    let auditId: string | undefined;
    if (clerkUserId) {
      try {
        let dbUser = await getUserByClerkId(clerkUserId);
        if (!dbUser) {
          const clerkUser = await currentUser();
          if (clerkUser?.emailAddresses?.[0]?.emailAddress) {
            dbUser = await upsertUser(clerkUserId, clerkUser.emailAddresses[0].emailAddress);
          }
        }
        if (dbUser) {
          const id = await saveAudit({
            userId: dbUser.id,
            url,
            result: audit,
          });
          if (id) auditId = id;
        }
      } catch {
        console.error("Failed to save audit to Supabase");
      }
    }

    // 8. Return result — client will call /api/screenshot separately
    return NextResponse.json({
      success: true,
      data: audit,
      url,
      ...(auditId && { auditId }),
    });
  } catch {
    return errorResponse(
      "Something went wrong. Please try again.",
      "PARSE_FAILED",
      500
    );
  }
}
