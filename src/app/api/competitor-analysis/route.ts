import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fetchPageHTML } from "@/lib/fetch-html";
import { extractPageContent } from "@/lib/extract-page-content";
import { identifyCompetitors, generateCompetitorComparison } from "@/lib/openai";
import { getRedis } from "@/lib/server-usage";
import { updateCompetitorAnalysis } from "@/lib/db/audits";
import { PLAN_FEATURES } from "@/lib/types";
import type { PlanTier, CompetitorAnalysis } from "@/lib/types";

export const maxDuration = 120;

function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

/**
 * Simple per-IP rate limit: max 5 competitor analyses per hour.
 * Uses Redis if available, otherwise skips (dev mode).
 */
async function checkCompetitorRateLimit(request: Request): Promise<boolean> {
  const r = getRedis();
  if (!r) return true; // no Redis = dev mode, allow

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip") || "unknown";
  const key = `uxlens:comp-rl:${ip}`;

  try {
    const count = (await r.get<number>(key)) || 0;
    if (count >= 5) return false;

    const pipeline = r.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, 3600);
    await pipeline.exec();
    return true;
  } catch {
    return true; // Redis error = allow
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, auditId, overallScore, categories, headline, executiveSummary, competitorUrls } = body;

    if (!url || !overallScore || !categories) {
      return err("Missing required fields: url, overallScore, categories");
    }

    // 1. Auth check
    let clerkUserId: string | undefined;
    try {
      const { userId } = await auth();
      if (userId) clerkUserId = userId;
    } catch {
      // Anonymous
    }

    if (!clerkUserId) {
      return err("Sign in required for competitor analysis", 401);
    }

    // 2. Plan check — must be Pro or Agency
    let plan: PlanTier = "free";
    try {
      const { getUserPlan } = await import("@/lib/db/users");
      plan = await getUserPlan(clerkUserId);
    } catch {
      // Fall through to Redis
    }

    if (plan === "free") {
      const r = getRedis();
      if (r) {
        try {
          const cached = await r.get<string>(`uxlens:sub:clerk:${clerkUserId}`);
          if (cached) plan = cached as PlanTier;
        } catch {}
      }
    }

    const features = PLAN_FEATURES[plan];
    if (!features.competitorAnalysis) {
      return err("Competitor analysis requires Starter, Pro, or Agency plan", 403);
    }

    // 3. Rate limit: 5/hour/IP
    const allowed = await checkCompetitorRateLimit(request);
    if (!allowed) {
      return err("Rate limit reached. Please wait before running another competitor analysis.", 429);
    }

    // 4. Fetch user's own page content FIRST (needed for both AI identification and comparison)
    let userContent;
    try {
      const userHtml = await fetchPageHTML(url);
      userContent = extractPageContent(userHtml, url);
    } catch (e) {
      console.error("[CompetitorAnalysis] Failed to fetch user page:", url, e);
      return err("Could not fetch your page for comparison", 500);
    }

    // 5. Identify or validate competitors
    let validatedCompetitors: { url: string; name: string; reasoning: string }[];

    // If user provided competitor URLs (Pro+ feature), skip AI identification
    const userProvidedUrls = Array.isArray(competitorUrls)
      ? competitorUrls.filter((u: unknown) => typeof u === "string" && u.trim()).slice(0, 2)
      : [];

    if (userProvidedUrls.length > 0) {
      // Validate user-provided URLs with HEAD requests
      validatedCompetitors = [];
      for (const rawUrl of userProvidedUrls) {
        try {
          const normalizedUrl = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 4000);
          const headRes = await fetch(normalizedUrl, {
            method: "HEAD",
            signal: controller.signal,
            redirect: "follow",
            headers: {
              "User-Agent": "Mozilla/5.0 (compatible; UXLensBot/1.0; +https://www.uxlens.pro)",
            },
          });
          clearTimeout(timer);
          if (headRes.ok || headRes.status === 405 || headRes.status === 403) {
            let name = "Competitor";
            try { name = new URL(normalizedUrl).hostname.replace("www.", ""); } catch {}
            validatedCompetitors.push({
              url: normalizedUrl,
              name,
              reasoning: "User-provided competitor URL",
            });
          }
        } catch {
          console.warn(`[CompetitorAnalysis] Skipping unreachable user URL: ${rawUrl}`);
        }
      }

      if (!validatedCompetitors.length) {
        return err("Could not reach the competitor URLs you provided. Please check they are valid.", 422);
      }
    } else {
      // AI-powered competitor identification with enriched context
      const competitorSuggestions = await identifyCompetitors(
        url,
        headline || "",
        executiveSummary || "",
        {
          metaDescription: userContent.metaDescription,
          subheadings: userContent.subheadings,
          buttons: userContent.buttons,
          title: userContent.title,
        }
      );

      console.log("[CompetitorAnalysis] AI identified competitors:", competitorSuggestions.map(c => c.url));

      if (!competitorSuggestions.length) {
        return err("Could not identify competitors for this site", 422);
      }

      // Validate AI-suggested competitor URLs with HEAD requests (hallucination protection)
      validatedCompetitors = [];
      for (const comp of competitorSuggestions) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 4000);
          const headRes = await fetch(comp.url, {
            method: "HEAD",
            signal: controller.signal,
            redirect: "follow",
            headers: {
              "User-Agent": "Mozilla/5.0 (compatible; UXLensBot/1.0; +https://www.uxlens.pro)",
            },
          });
          clearTimeout(timer);
          if (headRes.ok || headRes.status === 405 || headRes.status === 403) {
            validatedCompetitors.push(comp);
          }
        } catch {
          console.warn(`[CompetitorAnalysis] Skipping unreachable: ${comp.url}`);
        }
      }

      if (!validatedCompetitors.length) {
        return err("Could not reach any identified competitor websites", 422);
      }
    }

    // 6. Fetch competitor HTML in parallel
    const htmlResults = await Promise.allSettled(
      validatedCompetitors.map((c) => fetchPageHTML(c.url))
    );

    const competitorsWithContent: {
      url: string;
      name: string;
      content: ReturnType<typeof extractPageContent> extends infer T ? T : never;
    }[] = [];

    htmlResults.forEach((result, i) => {
      if (result.status === "fulfilled") {
        const content = extractPageContent(result.value, validatedCompetitors[i].url);
        competitorsWithContent.push({
          url: validatedCompetitors[i].url,
          name: validatedCompetitors[i].name,
          content,
        });
      }
    });

    if (!competitorsWithContent.length) {
      return err("Could not fetch content from competitor websites", 422);
    }

    // 7. Run deep competitor comparison via AI
    const analysis: CompetitorAnalysis = await generateCompetitorComparison(
      url,
      userContent,
      { overallScore, categories },
      competitorsWithContent
    );

    // 8. Save to Supabase if auditId provided (must await — Vercel kills function after response)
    if (auditId && clerkUserId) {
      try {
        await updateCompetitorAnalysis(auditId, clerkUserId, analysis);
      } catch (e) {
        console.error("[CompetitorAnalysis] Failed to save:", e);
      }
    }

    // 9. Return result
    return NextResponse.json({ success: true, data: analysis });
  } catch (error) {
    console.error("[CompetitorAnalysis] Unexpected error:", error);
    return err("Something went wrong during competitor analysis. Please try again.", 500);
  }
}
