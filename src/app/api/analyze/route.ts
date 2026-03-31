import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { analyzeRequestSchema } from "@/lib/schemas";
import { normalizeUrl } from "@/lib/validate-url";
import { extractPageContent, hasEnoughContent } from "@/lib/extract-page-content";
import { generateUXAuditStreaming } from "@/lib/openai";
import { fetchPageHTML } from "@/lib/fetch-html";
import { checkServerUsage, incrementServerUsage } from "@/lib/server-usage";
import { getUserByClerkId, upsertUser } from "@/lib/db/users";
import { saveAudit } from "@/lib/db/audits";
import type { AnalysisError, AnalyzeSSEEvent } from "@/lib/types";

// Vercel Pro allows up to 300s; SSE keeps connection alive during streaming
export const maxDuration = 120;

function errorResponse(error: string, code: AnalysisError["code"], status = 400) {
  return NextResponse.json({ success: false, error, code } satisfies AnalysisError, { status });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validate input (pre-stream — returns JSON on failure)
    const parsed = analyzeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        parsed.error.issues[0]?.message || "Invalid URL",
        "INVALID_URL"
      );
    }

    const url = normalizeUrl(parsed.data.url);
    const email = parsed.data.email;

    // 2. Run auth + usage check + HTML fetch IN PARALLEL (pre-stream)
    let clerkUserId: string | undefined;

    const [authResult, html] = await Promise.all([
      (async () => {
        try {
          const { userId } = await auth();
          if (userId) clerkUserId = userId;
        } catch {
          // Anonymous
        }
        return checkServerUsage(request, email, clerkUserId);
      })(),
      fetchPageHTML(url).catch((err) => err as Error),
    ]);

    // Pre-stream errors — return JSON so client distinguishes "never started" from "stream error"
    if (html instanceof Error) {
      console.error(`[Analyze] ${html.message} for ${url}`);
      return errorResponse(
        "We couldn't reach this page. It may block automated requests or be temporarily unavailable.",
        "FETCH_FAILED"
      );
    }

    if (!authResult.audit_allowed) {
      return NextResponse.json(
        { success: false, error: authResult.reason, code: "USAGE_LIMIT", usage: authResult } satisfies AnalysisError,
        { status: 429 }
      );
    }

    // 3. Extract structured content (pre-stream)
    const content = extractPageContent(html, url);

    if (!hasEnoughContent(content)) {
      return errorResponse(
        "The page content was too limited to analyze properly. Try another public landing page URL.",
        "CONTENT_TOO_WEAK"
      );
    }

    // ═══ STREAM STARTS HERE ═══
    // Everything above returns JSON errors. Below, we open an SSE stream
    // that keeps the connection alive during GPT-4o analysis.

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        function send(event: AnalyzeSSEEvent) {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          } catch {
            // Client disconnected — silently ignore
          }
        }

        try {
          // 4. Send metadata immediately (client sees this in ~3s)
          send({
            type: "metadata",
            url,
            title: content.title,
            description: content.metaDescription || "",
            headingsCount: content.headings.length,
            language: content.language,
          });

          // 5. Run AI audit with streaming + progress callbacks
          send({ type: "progress", stage: "structural_decomposition", percent: 3 });

          let audit: Awaited<ReturnType<typeof generateUXAuditStreaming>> | null = null;

          try {
            audit = await generateUXAuditStreaming(content, (percent, stage) => {
              send({ type: "progress", stage, percent });
            });
          } catch (aiErr) {
            console.error("[Analyze-Stream] First attempt failed:", aiErr instanceof Error ? aiErr.message : aiErr);
            // Retry once
            send({ type: "progress", stage: "retrying", percent: 5 });
            try {
              audit = await generateUXAuditStreaming(content, (percent, stage) => {
                send({ type: "progress", stage, percent });
              });
            } catch (retryErr) {
              console.error("[Analyze-Stream] Retry failed:", retryErr instanceof Error ? retryErr.message : retryErr);
            }
          }

          if (!audit) {
            send({ type: "error", error: "We couldn't generate the analysis right now. Please try again.", code: "AI_FAILED" });
            controller.close();
            return;
          }

          // 6. Send complete result
          send({ type: "complete", data: audit, url });

          // 7. Increment usage (fire-and-forget)
          incrementServerUsage(request, email, clerkUserId).catch(() => {});

          // 8. Save to Supabase if authenticated
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
                if (id) {
                  send({ type: "saved", auditId: id });
                }
              }
            } catch {
              console.error("[Analyze-Stream] Failed to save audit to Supabase");
            }
          }

          controller.close();
        } catch (err) {
          console.error("[Analyze-Stream] Unexpected error:", err);
          send({ type: "error", error: "Something went wrong. Please try again.", code: "PARSE_FAILED" });
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[Analyze] Pre-stream error:", err);
    return errorResponse(
      "Something went wrong. Please try again.",
      "PARSE_FAILED",
      500
    );
  }
}
