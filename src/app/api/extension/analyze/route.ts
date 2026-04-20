import { NextResponse } from "next/server";
import { generateUXAuditStreaming } from "@/lib/openai";
import { checkServerUsage, incrementServerUsage, getRedis } from "@/lib/server-usage";
import { getUserByClerkId, upsertUser } from "@/lib/db/users";
import { saveAudit } from "@/lib/db/audits";
import { getSupabase } from "@/lib/supabase";
import { currentUser, auth } from "@clerk/nextjs/server";
import type { ExtractedContent, AnalyzeSSEEvent } from "@/lib/types";

export const maxDuration = 120;

/**
 * GET /api/extension/analyze?token=xxx
 *
 * Retrieves pre-uploaded content from Redis (stored by /api/extension/upload),
 * runs the 10-layer AI audit, and streams progress via SSE.
 *
 * Called by the /extension/audit/[token] page (runs in the user's browser,
 * so Clerk cookies are available for auth).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  // Retrieve stored content from Redis
  const r = getRedis();
  if (!r) {
    return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });
  }

  const raw = await r.get<string>(`uxlens:ext-audit:${token}`);
  if (!raw) {
    return NextResponse.json({ error: "Audit data expired or not found" }, { status: 404 });
  }

  // Delete from Redis after reading (one-time use)
  await r.del(`uxlens:ext-audit:${token}`);

  const payload = typeof raw === "string" ? JSON.parse(raw) : raw;
  const content = payload.content as ExtractedContent;
  const screenshotUrl = payload.screenshotUrl as string | null;

  // Resolve auth from Clerk cookies (this runs in the user's browser)
  let clerkUserId: string | undefined;
  try {
    const { userId } = await auth();
    if (userId) clerkUserId = userId;
  } catch {
    // Use the userId stored during upload as fallback
    if (payload.clerkUserId) clerkUserId = payload.clerkUserId;
  }

  // Check usage
  const usageCheck = await checkServerUsage(request, undefined, clerkUserId);
  if (!usageCheck.audit_allowed) {
    return NextResponse.json(
      { error: usageCheck.reason, code: "USAGE_LIMIT", usage: usageCheck },
      { status: 429 }
    );
  }

  // Stream the audit
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      function send(event: AnalyzeSSEEvent) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch { /* disconnected */ }
      }

      try {
        send({
          type: "metadata",
          url: content.url,
          title: content.title,
          description: content.metaDescription || "",
          headingsCount: content.headings.length,
          language: content.language,
        });

        send({ type: "progress", stage: "structural_decomposition", percent: 5 });

        let audit: Awaited<ReturnType<typeof generateUXAuditStreaming>> | null = null;

        try {
          audit = await generateUXAuditStreaming(content, (percent, stage) => {
            send({ type: "progress", stage, percent });
          });
        } catch {
          send({ type: "progress", stage: "retrying", percent: 5 });
          try {
            audit = await generateUXAuditStreaming(content, (percent, stage) => {
              send({ type: "progress", stage, percent });
            });
          } catch { /* failed twice */ }
        }

        if (!audit) {
          send({ type: "error", error: "Analysis failed. Please try again.", code: "AI_FAILED" });
          controller.close();
          return;
        }

        send({ type: "complete", data: audit, url: content.url });
        incrementServerUsage(request, undefined, clerkUserId).catch(() => {});

        // Save audit
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
              const auditId = await saveAudit({
                userId: dbUser.id,
                url: content.url,
                result: audit,
              });
              if (auditId) {
                // Link the pre-uploaded screenshot to the audit record
                if (screenshotUrl) {
                  linkScreenshot(screenshotUrl, auditId, dbUser.id).catch(() => {});
                }
                send({ type: "saved", auditId });
              }
            }
          } catch {
            console.error("[Extension Analyze] Failed to save");
          }
        }

        controller.close();
      } catch (err) {
        console.error("[Extension Analyze] Stream error:", err);
        send({ type: "error", error: "Something went wrong.", code: "PARSE_FAILED" });
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
}

/** Link a pre-uploaded screenshot URL to an audit record */
async function linkScreenshot(screenshotUrl: string, auditId: string, userId: string) {
  const sb = getSupabase();
  if (!sb) return;

  await sb.from("audits")
    .update({ screenshot_path: screenshotUrl })
    .eq("id", auditId)
    .eq("user_id", userId);
}
