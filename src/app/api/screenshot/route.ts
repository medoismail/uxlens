import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";
import { getUserByClerkId } from "@/lib/db/users";

// Screenshot capture can take a while with Puppeteer
export const maxDuration = 60;

/**
 * POST /api/screenshot
 * Captures a screenshot of a URL and generates heatmap zones.
 * Called by the client AFTER the audit is complete.
 * Optionally updates the audit record in Supabase with screenshot data.
 */
export async function POST(request: Request) {
  try {
    const { url, auditId } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    // Capture screenshot
    const { captureScreenshot } = await import("@/lib/screenshot");
    const { generateHeatmapZones } = await import("@/lib/heatmap");

    const result = await captureScreenshot(url);
    const heatmapZones = generateHeatmapZones(
      result.elements,
      result.pageHeight,
      result.viewportHeight
    );

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
              .update({
                screenshot_path: screenshotUrl,
                heatmap_zones: heatmapZones,
              })
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
      heatmapZones,
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
