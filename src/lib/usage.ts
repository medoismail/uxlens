import type { PlanTier, UsageCheck } from "./types";
import { PLAN_LIMITS, RATE_LIMIT_PER_HOUR } from "./types";

const USAGE_KEY = "uxlens_usage";
const HOURLY_KEY = "uxlens_hourly";

interface StoredUsage {
  count: number;
  month: string; // YYYY-MM format for monthly reset
}

interface StoredHourly {
  timestamps: number[]; // Array of audit timestamps within the last hour
}

function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthlyUsage(): StoredUsage {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    if (!raw) return { count: 0, month: getCurrentMonth() };
    const data: StoredUsage = JSON.parse(raw);
    // Reset if month changed
    if (data.month !== getCurrentMonth()) {
      return { count: 0, month: getCurrentMonth() };
    }
    return data;
  } catch {
    return { count: 0, month: getCurrentMonth() };
  }
}

function getHourlyUsage(): number {
  try {
    const raw = localStorage.getItem(HOURLY_KEY);
    if (!raw) return 0;
    const data: StoredHourly = JSON.parse(raw);
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    // Count only timestamps within the last hour
    return data.timestamps.filter((t) => t > oneHourAgo).length;
  } catch {
    return 0;
  }
}

/** Check if the user can run an audit given their plan */
export function checkUsage(plan: PlanTier): UsageCheck {
  const hourlyCount = getHourlyUsage();
  const monthly = getMonthlyUsage();
  const limit = PLAN_LIMITS[plan];

  // Check hourly rate limit
  if (hourlyCount >= RATE_LIMIT_PER_HOUR) {
    return {
      audit_allowed: false,
      reason: "You've reached the hourly rate limit. Please wait a few minutes before trying again.",
      plan,
      monthly_limit: limit,
      audits_used: monthly.count,
      audits_remaining: Math.max(0, limit - monthly.count),
      upgrade_suggestion: "",
    };
  }

  // Check monthly limit
  if (monthly.count >= limit) {
    const nextPlan = plan === "free" ? "Starter" : plan === "starter" ? "Pro" : plan === "pro" ? "Agency" : "";
    return {
      audit_allowed: false,
      reason: `You've used all ${limit} audits for this month.`,
      plan,
      monthly_limit: limit,
      audits_used: monthly.count,
      audits_remaining: 0,
      upgrade_suggestion: nextPlan ? `Upgrade to ${nextPlan} for more audits.` : "You've reached your plan limit for this month.",
    };
  }

  return {
    audit_allowed: true,
    reason: "",
    plan,
    monthly_limit: limit,
    audits_used: monthly.count,
    audits_remaining: limit - monthly.count,
    upgrade_suggestion: "",
  };
}

/** Record a successful audit in usage tracking */
export function incrementUsage(): void {
  // Update monthly
  const monthly = getMonthlyUsage();
  monthly.count += 1;
  localStorage.setItem(USAGE_KEY, JSON.stringify(monthly));

  // Update hourly
  try {
    const raw = localStorage.getItem(HOURLY_KEY);
    const data: StoredHourly = raw ? JSON.parse(raw) : { timestamps: [] };
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    data.timestamps = data.timestamps.filter((t) => t > oneHourAgo);
    data.timestamps.push(Date.now());
    localStorage.setItem(HOURLY_KEY, JSON.stringify(data));
  } catch {
    localStorage.setItem(HOURLY_KEY, JSON.stringify({ timestamps: [Date.now()] }));
  }
}

/** Get current usage stats for display */
export function getUsageStats(plan: PlanTier) {
  const monthly = getMonthlyUsage();
  const limit = PLAN_LIMITS[plan];
  return {
    used: monthly.count,
    limit,
    remaining: Math.max(0, limit - monthly.count),
  };
}
