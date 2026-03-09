import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { analyzeRequestSchema } from "@/lib/schemas";
import { normalizeUrl } from "@/lib/validate-url";
import { extractPageContent, hasEnoughContent } from "@/lib/extract-page-content";
import { generateUXAudit } from "@/lib/openai";
import { checkServerUsage, incrementServerUsage } from "@/lib/server-usage";
import { getUserByClerkId, upsertUser } from "@/lib/db/users";
import { saveAudit } from "@/lib/db/audits";
import { getSupabase } from "@/lib/supabase";
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

    // 5. Run screenshot capture and UX audit in parallel
    // Screenshot is non-blocking — if it fails, audit still returns
    let screenshotUrl: string | undefined;
    let heatmapZones: unknown[] | undefined;
    let pageHeight: number | undefined;
    let viewportWidth: number | undefined;

    const [audit, screenshotResult] = await Promise.all([
      // UX audit (required)
      generateUXAudit(content).catch(() => null),
      // Screenshot (optional, non-blocking)
      (async () => {
        try {
          const { captureScreenshot } = await import("@/lib/screenshot");
          const { generateHeatmapZones } = await import("@/lib/heatmap");
          const result = await captureScreenshot(url);
          const zones = generateHeatmapZones(
            result.elements,
            result.pageHeight,
            result.viewportHeight
          );

          // Upload screenshot to Supabase Storage
          const sb = getSupabase();
          if (sb) {
            const filename = `${Date.now()}-${encodeURIComponent(new URL(url).hostname)}.jpg`;
            const { error: uploadError } = await sb.storage
              .from("screenshots")
              .upload(filename, result.buffer, {
                contentType: "image/jpeg",
                cacheControl: "31536000",
              });

            if (!uploadError) {
              const { data: publicUrl } = sb.storage
                .from("screenshots")
                .getPublicUrl(filename);
              return {
                screenshotUrl: publicUrl.publicUrl,
                heatmapZones: zones,
                pageHeight: result.pageHeight,
                viewportWidth: result.viewportWidth,
              };
            }
          }

          return null;
        } catch (e) {
          console.error("Screenshot capture failed (non-blocking):", e);
          return null;
        }
      })(),
    ]);

    if (!audit) {
      return errorResponse(
        "We couldn't generate the analysis right now. Please try again.",
        "AI_FAILED",
        500
      );
    }

    // Extract screenshot data if available
    if (screenshotResult) {
      screenshotUrl = screenshotResult.screenshotUrl;
      heatmapZones = screenshotResult.heatmapZones;
      pageHeight = screenshotResult.pageHeight;
      viewportWidth = screenshotResult.viewportWidth;
    }

    // 6. Increment usage after successful audit
    await incrementServerUsage(request, email, clerkUserId);

    // 7. Save audit to Supabase if user is authenticated
    let auditId: string | undefined;
    if (clerkUserId) {
      try {
        // Try to find user, or lazily create them if Clerk webhook hasn't fired yet
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
            screenshotPath: screenshotUrl,
            heatmapZones,
          });
          if (id) auditId = id;
        }
      } catch {
        // Don't fail the audit if save fails
        console.error("Failed to save audit to Supabase");
      }
    }

    // 8. Return successful result
    return NextResponse.json({
      success: true,
      data: audit,
      url,
      ...(auditId && { auditId }),
      ...(screenshotUrl && { screenshotUrl }),
      ...(heatmapZones && { heatmapZones }),
      ...(pageHeight && { pageHeight }),
      ...(viewportWidth && { viewportWidth }),
    });
  } catch {
    return errorResponse(
      "Something went wrong. Please try again.",
      "PARSE_FAILED",
      500
    );
  }
}
