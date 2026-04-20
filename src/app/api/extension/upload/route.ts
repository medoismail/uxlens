import { NextResponse } from "next/server";
import { resolveClerkUserId } from "@/lib/extension-auth";
import { getRedis } from "@/lib/server-usage";
import { getSupabase } from "@/lib/supabase";
import { randomBytes } from "crypto";

export const maxDuration = 30;

/**
 * POST /api/extension/upload
 *
 * 1. Uploads screenshot directly to Supabase storage (avoids Redis size limits)
 * 2. Stores page content + screenshot URL in Redis with a temp token
 * 3. Returns the token for the loading page
 *
 * Body: { content: ExtractedContent, screenshot?: string (base64) }
 * Response: { token: string }
 */
export async function POST(request: Request) {
  try {
    const clerkUserId = await resolveClerkUserId(request);

    const body = await request.json();
    const { content, screenshot } = body;

    if (!content?.url || !content?.bodyText) {
      return NextResponse.json({ error: "Missing page content" }, { status: 400 });
    }

    const r = getRedis();
    if (!r) {
      return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });
    }

    const token = randomBytes(16).toString("hex");

    // Upload screenshot to Supabase storage immediately (not Redis)
    let screenshotUrl: string | null = null;
    if (screenshot) {
      const sb = getSupabase();
      if (sb) {
        try {
          const clean = screenshot.replace(/^data:image\/\w+;base64,/, "");
          const buffer = Buffer.from(clean, "base64");
          const filename = `ext-${Date.now()}-${token.slice(0, 8)}.jpg`;

          const { error: uploadError } = await sb.storage
            .from("screenshots")
            .upload(filename, buffer, {
              contentType: "image/jpeg",
              cacheControl: "31536000",
            });

          if (!uploadError) {
            const { data: publicUrl } = sb.storage
              .from("screenshots")
              .getPublicUrl(filename);
            screenshotUrl = publicUrl.publicUrl;
          }
        } catch (err) {
          console.error("[Extension Upload] Screenshot upload error:", err);
        }
      }
    }

    // Store only content + screenshotUrl in Redis (small payload)
    const payload = {
      content,
      screenshotUrl,
      clerkUserId: clerkUserId || null,
      createdAt: Date.now(),
    };

    await r.set(`uxlens:ext-audit:${token}`, JSON.stringify(payload), { ex: 600 });

    return NextResponse.json({ token });
  } catch (err) {
    console.error("[Extension Upload] Error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
