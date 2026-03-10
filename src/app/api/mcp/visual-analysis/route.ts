import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { generateVisionHeatmap, generateVisualAnalysis } from "@/lib/openai";
import { hotspotsToZones } from "@/lib/heatmap";
import { authenticateMcpRequest, checkMcpRateLimit } from "@/lib/mcp-auth";
import type { HeatmapZone, VisualAnalysis } from "@/lib/types";

export const maxDuration = 60;

/**
 * POST /api/mcp/visual-analysis
 * API key-authenticated vision analysis (heatmap + visual scores).
 */
export async function POST(request: Request) {
  try {
    // 1. Auth
    const authResult = await authenticateMcpRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user, keyId } = authResult;

    // 2. Rate limit: 10 vision analyses/hour per key
    const allowed = await checkMcpRateLimit(keyId, "vision", 10);
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit: max 10 visual analyses per hour" },
        { status: 429 }
      );
    }

    // 3. Parse
    const { screenshotUrl, auditId, pageHeight, viewportWidth } = await request.json();
    if (!screenshotUrl || typeof screenshotUrl !== "string") {
      return NextResponse.json({ error: "Missing screenshotUrl" }, { status: 400 });
    }

    const effectPageHeight = pageHeight || 3000;
    const effectViewportWidth = viewportWidth || 1280;

    // 4. Fetch screenshot → base64
    const imgRes = await fetch(screenshotUrl, { signal: AbortSignal.timeout(15000) });
    if (!imgRes.ok) {
      throw new Error(`Failed to fetch screenshot: HTTP ${imgRes.status}`);
    }

    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
    const screenshotBase64 = imgBuffer.toString("base64");

    // 5. Run both vision calls in parallel (Pro+ always get AI vision)
    const [hotspots, visAnalysis] = await Promise.all([
      generateVisionHeatmap(screenshotBase64),
      generateVisualAnalysis(screenshotBase64),
    ]);

    const heatmapZones: HeatmapZone[] = hotspotsToZones(
      hotspots,
      effectViewportWidth,
      effectPageHeight
    );
    const visualAnalysis: VisualAnalysis = visAnalysis;

    // 6. Save to Supabase if auditId provided
    if (auditId) {
      try {
        const sb = getSupabase();
        if (sb) {
          const updateData: Record<string, unknown> = {
            heatmap_zones: heatmapZones,
            visual_analysis: visualAnalysis,
          };

          await sb
            .from("audits")
            .update(updateData)
            .eq("id", auditId)
            .eq("user_id", user.id);
        }
      } catch (e) {
        console.error("[MCP VisionAnalysis] Failed to save:", e);
      }
    }

    return NextResponse.json({
      heatmapZones,
      visualAnalysis,
      pageHeight: effectPageHeight,
      viewportWidth: effectViewportWidth,
    });
  } catch (error) {
    console.error("[MCP VisionAnalysis] Error:", error);
    return NextResponse.json(
      { error: "Vision analysis failed" },
      { status: 500 }
    );
  }
}
