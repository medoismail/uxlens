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
 * Checks Clerk userId first (if auth'd), then email, then LemonSqueezy API.
 * Falls back to "free" if no identity or not subscribed.
 */
async function resolveplan(email: string | undefined, clerkUserId?: string): Promise<PlanTier> {
  const r = getRedis();

  // 1. Check by Clerk userId first (fastest path for auth'd users)
  if (clerkUserId && r) {
    const clerkCacheKey = `uxlens:sub:clerk:${clerkUserId}`;
    const cached = await r.get<string>(clerkCacheKey);
    if (cached) return cached as PlanTier;
  }

  if (!email && !clerkUserId) return "free";

  // 2. Check by email in Redis
  if (email && r) {
    const cacheKey = `uxlens:sub:${email.toLowerCase()}`;
    const cached = await r.get<string>(cacheKey);
    if (cached) {
      // Also cache by Clerk userId for faster future lookups
      if (clerkUserId) {
        const clerkCacheKey = `uxlens:sub:clerk:${clerkUserId}`;
        await r.set(clerkCacheKey, cached, { ex: 60 * 60 * 24 * 7 });
      }
      return cached as PlanTier;
    }
  }

  // 3. Check Supabase database (if user is auth'd)
  if (clerkUserId) {
    try {
      const { getUserPlan } = await import("./db/users");
      const dbPlan = await getUserPlan(clerkUserId);
      if (dbPlan !== "free") {
        // Cache in Redis for fast lookups
        if (r) {
          const clerkCacheKey = `uxlens:sub:clerk:${clerkUserId}`;
          await r.set(clerkCacheKey, dbPlan, { ex: 60 * 60 * 24 * 7 });
        }
        return dbPlan;
      }
    } catch {
      // Supabase unavailable, fall through
    }
  }

  // 4. Verify with LemonSqueezy (only if we have email)
  if (email) {
    try {
      const { checkSubscriptionByEmail } = await import("./lemonsqueezy");
      const status = await checkSubscriptionByEmail(email);

      if (r) {
        const cacheKey = `uxlens:sub:${email.toLowerCase()}`;
        await r.set(cacheKey, status.plan, { ex: 3600 }); // Cache 1 hour
        if (clerkUserId) {
          const clerkCacheKey = `uxlens:sub:clerk:${clerkUserId}`;
          await r.set(clerkCacheKey, status.plan, { ex: 60 * 60 * 24 * 7 });
        }
      }

      return status.isActive ? status.plan : "free";
    } catch {
      return "free";
    }
  }

  return "free";
}

/**
 * Check usage server-side. Uses IP for free users, email/clerkUserId for subscribers.
 * If Redis is not configured, allows all requests (dev mode).
 */
export async function checkServerUsage(
  request: Request,
  email?: string,
  clerkUserId?: string
): Promise<UsageCheck> {
  const plan = await resolveplan(email, clerkUserId);
  const limit = PLAN_LIMITS[plan];
  const r = getRedis();

  if (!r) {
    // Redis not configured — only allow in development mode
    if (process.env.NODE_ENV === "development") {
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
    // Production without Redis = deny free users, allow paid (they verified through payment)
    return {
      audit_allowed: plan !== "free",
      reason: plan === "free" ? "Service temporarily unavailable. Please try again shortly." : "",
      plan,
      monthly_limit: limit,
      audits_used: 0,
      audits_remaining: plan === "free" ? 0 : limit,
      upgrade_suggestion: "",
    };
  }

  try {
    const ip = getClientIP(request);
    // Free users tracked by IP, authenticated/subscribers by clerkUserId or email
    const identifier =
      plan === "free"
        ? (clerkUserId || ip)
        : (clerkUserId || email!.toLowerCase());
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
    // Redis error — allow paid users, block free to prevent abuse
    return {
      audit_allowed: plan !== "free",
      reason: plan === "free" ? "Service temporarily unavailable. Please try again shortly." : "",
      plan,
      monthly_limit: limit,
      audits_used: 0,
      audits_remaining: plan === "free" ? 0 : limit,
      upgrade_suggestion: "",
    };
  }
}

/** Increment usage after a successful audit */
export async function incrementServerUsage(
  request: Request,
  email?: string,
  clerkUserId?: string
): Promise<void> {
  try {
    const r = getRedis();
    if (!r) return;

    const plan = await resolveplan(email, clerkUserId);
    const ip = getClientIP(request);
    const identifier =
      plan === "free"
        ? (clerkUserId || ip)
        : (clerkUserId || email!.toLowerCase());
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
