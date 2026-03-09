import { NextResponse } from "next/server";
import { getRedis } from "@/lib/server-usage";
import { getSupabase } from "@/lib/supabase";

/**
 * GET /api/health
 * Quick health check for monitoring. Pings Redis and Supabase.
 */
export async function GET() {
  const checks: Record<string, "ok" | "down" | "not_configured"> = {};

  // Redis
  const r = getRedis();
  if (r) {
    try {
      await r.ping();
      checks.redis = "ok";
    } catch {
      checks.redis = "down";
    }
  } else {
    checks.redis = "not_configured";
  }

  // Supabase
  const sb = getSupabase();
  if (sb) {
    try {
      const { error } = await sb.from("users").select("id").limit(1);
      checks.supabase = error ? "down" : "ok";
    } catch {
      checks.supabase = "down";
    }
  } else {
    checks.supabase = "not_configured";
  }

  // OpenAI — just check env var is set (don't waste API credits)
  checks.openai = process.env.OPENAI_API_KEY ? "ok" : "not_configured";

  const allOk = Object.values(checks).every((v) => v === "ok");

  return NextResponse.json(
    { status: allOk ? "healthy" : "degraded", checks },
    { status: allOk ? 200 : 503 }
  );
}
