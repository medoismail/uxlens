import { getSupabase } from "@/lib/supabase";
import type { UXAuditResult } from "@/lib/types";

export interface DbAudit {
  id: string;
  user_id: string;
  url: string;
  screenshot_path: string | null;
  heatmap_zones: unknown | null;
  result: UXAuditResult;
  created_at: string;
}

/**
 * Save an audit to the database.
 * Returns the audit ID on success, null on failure.
 */
export async function saveAudit(params: {
  userId: string;
  url: string;
  result: UXAuditResult;
  screenshotPath?: string;
  heatmapZones?: unknown;
}): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from("audits")
    .insert({
      user_id: params.userId,
      url: params.url,
      result: params.result,
      screenshot_path: params.screenshotPath || null,
      heatmap_zones: params.heatmapZones || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("saveAudit error:", error);
    return null;
  }

  return data.id;
}

/**
 * Get paginated audits for a user.
 */
export async function getAuditsByUser(
  userId: string,
  page = 1,
  perPage = 12
): Promise<{ audits: DbAudit[]; total: number }> {
  const sb = getSupabase();
  if (!sb) return { audits: [], total: 0 };

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, error, count } = await sb
    .from("audits")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("getAuditsByUser error:", error);
    return { audits: [], total: 0 };
  }

  return { audits: (data || []) as DbAudit[], total: count || 0 };
}

/**
 * Get a single audit by ID. Optionally verify ownership.
 */
export async function getAuditById(
  auditId: string,
  userId?: string
): Promise<DbAudit | null> {
  const sb = getSupabase();
  if (!sb) return null;

  let query = sb.from("audits").select("*").eq("id", auditId);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query.single();

  if (error) return null;
  return data as DbAudit;
}
