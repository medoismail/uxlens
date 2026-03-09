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

// Vercel Pro = 60s; Hobby = 10s max regardless
export const maxDuration = 60;

function errorResponse(error: string, code: AnalysisError["code"], status = 400) {
  return NextResponse.json({ success: false, error, code } satisfies AnalysisError, { status });
}

/**
 * Fetch a page's HTML. Tries simple headers first, falls back to minimal.
 */
async function fetchPageHTML(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        // Simple, honest bot-like headers — no fake Sec-Fetch
        "User-Agent": "Mozilla/5.0 (compatible; UXLensBot/1.0; +https://www.uxlens.pro)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.text();
  } catch (err) {
    clearTimeout(timer);

    // Fallback: try with a Chrome-like User-Agent (no Sec-Fetch headers)
    const controller2 = new AbortController();
    const timer2 = setTimeout(() => controller2.abort(), 5000);

    try {
      const res2 = await fetch(url, {
        signal: controller2.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept: "text/html,*/*",
        },
        redirect: "follow",
      });

      clearTimeout(timer2);

      if (!res2.ok) {
        throw new Error(`HTTP ${res2.status}`);
      }

      return await res2.text();
    } catch (err2) {
      clearTimeout(timer2);
      // Throw the original error for better debugging
      const msg = err instanceof Error ? err.message : "Unknown error";
      const msg2 = err2 instanceof Error ? err2.message : "Unknown error";
      throw new Error(`Fetch failed (attempt 1: ${msg}, attempt 2: ${msg2})`);
    }
  }
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

    // 2. Run auth + usage check + HTML fetch IN PARALLEL to save time
    let clerkUserId: string | undefined;

    const [authResult, html] = await Promise.all([
      // Auth + usage check (runs concurrently with fetch)
      (async () => {
        try {
          const { userId } = await auth();
          if (userId) clerkUserId = userId;
        } catch {
          // Anonymous
        }
        // Usage check (needs auth result)
        return checkServerUsage(request, email, clerkUserId);
      })(),
      // HTML fetch (runs concurrently with auth)
      fetchPageHTML(url).catch((err) => err as Error),
    ]);

    // Check if HTML fetch failed
    if (html instanceof Error) {
      console.error(`[Analyze] ${html.message} for ${url}`);
      return errorResponse(
        "We couldn't reach this page. It may block automated requests or be temporarily unavailable.",
        "FETCH_FAILED"
      );
    }

    // Check usage limits
    if (!authResult.audit_allowed) {
      return NextResponse.json(
        { success: false, error: authResult.reason, code: "USAGE_LIMIT", usage: authResult } satisfies AnalysisError,
        { status: 429 }
      );
    }

    // 3. Extract structured content
    const content = extractPageContent(html, url);

    if (!hasEnoughContent(content)) {
      return errorResponse(
        "The page content was too limited to analyze properly. Try another public landing page URL.",
        "CONTENT_TOO_WEAK"
      );
    }

    // 4. Run AI audit
    const audit = await generateUXAudit(content);

    if (!audit) {
      return errorResponse(
        "We couldn't generate the analysis right now. Please try again.",
        "AI_FAILED",
        500
      );
    }

    // 5. Increment usage (fire-and-forget to save time)
    incrementServerUsage(request, email, clerkUserId).catch(() => {});

    // 6. Save audit to Supabase if authenticated (fire-and-forget)
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

    // 7. Return result
    return NextResponse.json({
      success: true,
      data: audit,
      url,
      ...(auditId && { auditId }),
    });
  } catch (err) {
    console.error("[Analyze] Unexpected error:", err);
    return errorResponse(
      "Something went wrong. Please try again.",
      "PARSE_FAILED",
      500
    );
  }
}
