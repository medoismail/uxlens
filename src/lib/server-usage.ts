import { Redis } from "@upstash/redis";
import { PLAN_LIMITS, RATE_LIMIT_PER_HOUR } from "./types";
import type { PlanTier, UsageCheck } from "./types";

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Extract client IP from request headers (works on Vercel) */
function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

/**
 * Resolve the user's plan server-side.
 * If email provided, check subscription cache in Redis (or call LemonSqueezy).
 * Falls back to "free" if no email or not subscribed.
 */
async function resolveplan(email: string | undefined): Promise<PlanTier> {
  if (!email) return "free";

  const r = getRedis();
  if (r) {
    // Check Redis cache first (cached for 1 hour)
    const cacheKey = `uxlens:sub:${email.toLowerCase()}`;
    const cached = await r.get<string>(cacheKey);
    if (cached) return cached as PlanTier;
  }

  // Verify with LemonSqueezy
  try {
    const { checkSubscriptionByEmail } = await import("./lemonsqueezy");
    const status = await checkSubscriptionByEmail(email);

    if (r) {
      const cacheKey = `uxlens:sub:${email.toLowerCase()}`;
      await r.set(cacheKey, status.plan, { ex: 3600 }); // Cache 1 hour
    }

    return status.isActive ? status.plan : "free";
  } catch {
    return "free";
  }
}

/**
 * Check usage server-side. Uses IP for free users, email for subscribers.
 * If Redis is not configured, allows all requests (dev mode).
 */
export async function checkServerUsage(
  request: Request,
  email?: string
): Promise<UsageCheck> {
  const plan = await resolveplan(email);
  const limit = PLAN_LIMITS[plan];
  const r = getRedis();

  if (!r) {
    // Redis not configured — allow all (development mode)
    return {
      audit_allowed: true,
      reason: "",
      plan,
      monthly_limit: limit,
      audits_used: 0,
      audits_remaining: limit,
      upgrade_suggestion: "",
    };
  }

  try {
    const ip = getClientIP(request);
    // Free users tracked by IP, subscribers by email
    const identifier = plan === "free" ? ip : email!.toLowerCase();
    const month = getCurrentMonth();
    const monthlyKey = `uxlens:usage:${identifier}:${month}`;
    const hourlyKey = `uxlens:hourly:${ip}`;

    // Fetch both counts in one pipeline
    const pipeline = r.pipeline();
    pipeline.get(monthlyKey);
    pipeline.get(hourlyKey);
    const [monthlyRaw, hourlyRaw] = await pipeline.exec();

    const monthlyCount = (monthlyRaw as number) || 0;
    const hourlyCount = (hourlyRaw as number) || 0;

    // Check hourly rate limit (applies to everyone)
    if (hourlyCount >= RATE_LIMIT_PER_HOUR) {
      return {
        audit_allowed: false,
        reason: "You've reached the hourly rate limit. Please wait a few minutes.",
        plan,
        monthly_limit: limit,
        audits_used: monthlyCount,
        audits_remaining: Math.max(0, limit - monthlyCount),
        upgrade_suggestion: "",
      };
    }

    // Check monthly limit
    if (monthlyCount >= limit) {
      const nextPlan =
        plan === "free" ? "Starter" :
        plan === "starter" ? "Pro" :
        plan === "pro" ? "Agency" : "";
      return {
        audit_allowed: false,
        reason: `You've used all ${limit} audits for this month.`,
        plan,
        monthly_limit: limit,
        audits_used: monthlyCount,
        audits_remaining: 0,
        upgrade_suggestion: nextPlan
          ? `Upgrade to ${nextPlan} for more audits.`
          : "You've reached your plan limit.",
      };
    }

    return {
      audit_allowed: true,
      reason: "",
      plan,
      monthly_limit: limit,
      audits_used: monthlyCount,
      audits_remaining: limit - monthlyCount,
      upgrade_suggestion: "",
    };
  } catch {
    // Redis error — gracefully allow the request
    return {
      audit_allowed: true,
      reason: "",
      plan,
      monthly_limit: limit,
      audits_used: 0,
      audits_remaining: limit,
      upgrade_suggestion: "",
    };
  }
}

/** Increment usage after a successful audit */
export async function incrementServerUsage(
  request: Request,
  email?: string
): Promise<void> {
  try {
    const r = getRedis();
    if (!r) return;

    const plan = await resolveplan(email);
    const ip = getClientIP(request);
    const identifier = plan === "free" ? ip : email!.toLowerCase();
    const month = getCurrentMonth();
    const monthlyKey = `uxlens:usage:${identifier}:${month}`;
    const hourlyKey = `uxlens:hourly:${ip}`;

    const pipeline = r.pipeline();

    // Increment monthly count (TTL 35 days for auto-cleanup)
    pipeline.incr(monthlyKey);
    pipeline.expire(monthlyKey, 60 * 60 * 24 * 35);

    // Increment hourly count (TTL 1 hour)
    pipeline.incr(hourlyKey);
    pipeline.expire(hourlyKey, 3600);

    await pipeline.exec();
  } catch {
    // Redis error — silently ignore, don't block the user
  }
}
