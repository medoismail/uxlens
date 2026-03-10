import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";
import { getUserByClerkId } from "@/lib/db/users";
import { getRedis } from "@/lib/server-usage";

// Puppeteer screenshot can take a while
export const maxDuration = 60;

/**
 * POST /api/screenshot
 * Captures a full-page screenshot of a URL using Puppeteer.
 * Called by the client AFTER the audit is complete.
 * Heatmap zones are generated separately via /api/vision-analysis.
 */
export async function POST(request: Request) {
  try {
    // Rate limit: max 10 screenshots per IP per hour
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const r = getRedis();
    if (r) {
      const rateKey = `uxlens:screenshot:${ip}`;
      const count = (await r.get<number>(rateKey)) || 0;
      if (count >= 10) {
        return NextResponse.json(
          { error: "Screenshot rate limit exceeded" },
          { status: 429 }
        );
      }
      await r.incr(rateKey);
      await r.expire(rateKey, 3600);
    }

    const { url, auditId } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    // Capture screenshot with Puppeteer
    const { captureScreenshot } = await import("@/lib/screenshot");
    const result = await captureScreenshot(url);

    // Upload to Supabase Storage
    let screenshotUrl: string | undefined;
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
        screenshotUrl = publicUrl.publicUrl;
      } else {
        console.error("Screenshot upload error:", uploadError);
      }
    }

    // If we have an auditId and the user is authenticated, update the audit record
    if (auditId && screenshotUrl) {
      try {
        const { userId } = await auth();
        if (userId && sb) {
          const dbUser = await getUserByClerkId(userId);
          if (dbUser) {
            await sb
              .from("audits")
              .update({ screenshot_path: screenshotUrl })
              .eq("id", auditId)
              .eq("user_id", dbUser.id);
          }
        }
      } catch {
        // Non-critical — screenshot still returned to client
        console.error("Failed to update audit with screenshot");
      }
    }

    return NextResponse.json({
      screenshotUrl,
      pageHeight: result.pageHeight,
      viewportWidth: result.viewportWidth,
    });
  } catch (error) {
    console.error("Screenshot capture failed:", error);
    return NextResponse.json(
      { error: "Screenshot capture failed" },
      { status: 500 }
    );
  }
}
