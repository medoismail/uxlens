import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { authenticateMcpRequest, checkMcpRateLimit } from "@/lib/mcp-auth";

export const maxDuration = 60;

/**
 * POST /api/mcp/screenshot
 * API key-authenticated screenshot capture.
 */
export async function POST(request: Request) {
  try {
    // 1. Auth
    const authResult = await authenticateMcpRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { keyId } = authResult;

    // 2. Rate limit: 10 screenshots/hour per key
    const allowed = await checkMcpRateLimit(keyId, "screenshot", 10);
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit: max 10 screenshots per hour" },
        { status: 429 }
      );
    }

    // 3. Parse
    const { url } = await request.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    // 4. Capture screenshot with Puppeteer
    const { captureScreenshot } = await import("@/lib/screenshot");
    const result = await captureScreenshot(url);

    // 5. Upload to Supabase Storage
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
        console.error("[MCP Screenshot] Upload error:", uploadError);
      }
    }

    return NextResponse.json({
      screenshotUrl,
      pageHeight: result.pageHeight,
      viewportWidth: result.viewportWidth,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[MCP Screenshot] Error:", msg);
    return NextResponse.json(
      { error: "Screenshot capture failed", detail: msg },
      { status: 500 }
    );
  }
}
