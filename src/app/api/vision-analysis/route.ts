import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";
import { getUserByClerkId, getUserPlan } from "@/lib/db/users";
import { getRedis } from "@/lib/server-usage";
import { generateVisionHeatmap, generateVisualAnalysis } from "@/lib/openai";
import { hotspotsToZones } from "@/lib/heatmap";
import { generateFallbackHeatmapZones } from "@/lib/heatmap";
import type { HeatmapZone, VisualAnalysis, PlanTier } from "@/lib/types";

// Vision analysis can take a while (two parallel GPT-4o vision calls)
export const maxDuration = 60;

/**
 * POST /api/vision-analysis
 * Takes a screenshot URL, sends it to GPT-4o vision for:
 *   1. AI-generated attention heatmap (hotspot coordinates)
 *   2. Visual UX design analysis (5 scores + findings)
 *
 * Plan gating:
 *   - Free: 1 AI vision audit (tracked via Redis), then fallback
 *   - Starter+: Full AI vision on every audit
 */
export async function POST(request: Request) {
  try {
    const { screenshotUrl, auditId, pageHeight, viewportWidth } = await request.json();

    if (!screenshotUrl || typeof screenshotUrl !== "string") {
      return NextResponse.json({ error: "Missing screenshotUrl" }, { status: 400 });
    }

    const effectPageHeight = pageHeight || 3000;
    const effectViewportWidth = viewportWidth || 1280;

    // Rate limit: max 10 vision analyses per IP per hour
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const r = getRedis();
    if (r) {
      const rateKey = `uxlens:vision:${ip}`;
      const count = (await r.get<number>(rateKey)) || 0;
      if (count >= 10) {
        return NextResponse.json(
          { error: "Vision analysis rate limit exceeded" },
          { status: 429 }
        );
      }
      await r.incr(rateKey);
      await r.expire(rateKey, 3600);
    }

    // Auth + plan check for gating
    let clerkUserId: string | undefined;
    let plan: PlanTier = "free";
    try {
      const { userId } = await auth();
      if (userId) {
        clerkUserId = userId;
        plan = await getUserPlan(userId);
      }
    } catch {
      // Anonymous = free
    }

    // Check if free user has already used their 1 free vision audit
    let useAiVision = plan !== "free";
    if (plan === "free") {
      if (r) {
        const freeKey = `uxlens:vision:free:${clerkUserId || ip}`;
        const freeCount = (await r.get<number>(freeKey)) || 0;
        if (freeCount < 1) {
          useAiVision = true;
          await r.incr(freeKey);
          // No expiry — free users get 1 total, not 1 per period
        }
      } else {
        // No Redis = dev mode, allow
        useAiVision = true;
      }
    }

    let heatmapZones: HeatmapZone[];
    let visualAnalysis: VisualAnalysis | undefined;

    if (useAiVision) {
      // Fetch screenshot image and convert to base64
      const imgRes = await fetch(screenshotUrl, {
        signal: AbortSignal.timeout(15000),
      });

      if (!imgRes.ok) {
        throw new Error(`Failed to fetch screenshot: HTTP ${imgRes.status}`);
      }

      const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
      const screenshotBase64 = imgBuffer.toString("base64");

      // Run both vision calls in parallel
      const [hotspots, visAnalysis] = await Promise.all([
        generateVisionHeatmap(screenshotBase64),
        generateVisualAnalysis(screenshotBase64),
      ]);

      // Convert normalized hotspot coordinates to pixel-based zones
      heatmapZones = hotspotsToZones(hotspots, effectViewportWidth, effectPageHeight);
      visualAnalysis = visAnalysis;
    } else {
      // Fallback: rule-based heatmap for free users who've used their 1 free vision audit
      heatmapZones = generateFallbackHeatmapZones(effectPageHeight, 800);
    }

    // Save to Supabase if auditId provided (MUST await)
    if (auditId) {
      try {
        const sb = getSupabase();
        if (sb && clerkUserId) {
          const dbUser = await getUserByClerkId(clerkUserId);
          if (dbUser) {
            const updateData: Record<string, unknown> = {
              heatmap_zones: heatmapZones,
            };
            if (visualAnalysis) {
              updateData.visual_analysis = visualAnalysis;
            }

            await sb
              .from("audits")
              .update(updateData)
              .eq("id", auditId)
              .eq("user_id", dbUser.id);
          }
        }
      } catch (e) {
        console.error("[VisionAnalysis] Failed to save:", e);
      }
    }

    return NextResponse.json({
      heatmapZones,
      visualAnalysis: visualAnalysis || null,
      pageHeight: effectPageHeight,
      viewportWidth: effectViewportWidth,
    });
  } catch (error) {
    console.error("[VisionAnalysis] Error:", error);
    return NextResponse.json(
      { error: "Vision analysis failed" },
      { status: 500 }
    );
  }
}
