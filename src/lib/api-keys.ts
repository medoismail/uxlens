import { randomBytes, createHash } from "crypto";
import { getSupabase } from "@/lib/supabase";
import type { DbUser } from "@/lib/db/users";

const KEY_PREFIX = "uxl_";
const MAX_KEYS_PER_USER = 3;

export interface ApiKeyInfo {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revoked: boolean;
}

function hashKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

/**
 * Generate a new API key for a user.
 * Returns the raw key (shown once to user) + metadata.
 */
export async function generateApiKey(
  userId: string,
  name = "Default"
): Promise<{ key: string; keyPrefix: string; id: string } | null> {
  const sb = getSupabase();
  if (!sb) return null;

  // Check key count limit
  const { count } = await sb
    .from("api_keys")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("revoked", false);

  if ((count ?? 0) >= MAX_KEYS_PER_USER) {
    throw new Error(`Maximum ${MAX_KEYS_PER_USER} active API keys allowed`);
  }

  // Generate key: uxl_ + 32 hex chars
  const rawSecret = randomBytes(16).toString("hex");
  const rawKey = `${KEY_PREFIX}${rawSecret}`;
  const keyPrefix = rawKey.slice(0, 8);
  const keyHash = hashKey(rawKey);

  const { data, error } = await sb
    .from("api_keys")
    .insert({
      user_id: userId,
      name,
      key_prefix: keyPrefix,
      key_hash: keyHash,
    })
    .select("id")
    .single();

  if (error) {
    console.error("generateApiKey error:", error);
    return null;
  }

  return { key: rawKey, keyPrefix, id: data.id };
}

/**
 * Validate an API key and return the associated user.
 * Also updates `last_used_at` timestamp.
 */
export async function validateApiKey(
  rawKey: string
): Promise<{ user: DbUser; keyId: string } | null> {
  if (!rawKey.startsWith(KEY_PREFIX)) return null;

  const sb = getSupabase();
  if (!sb) return null;

  const keyHash = hashKey(rawKey);

  // Look up key + join user
  const { data: keyRow, error } = await sb
    .from("api_keys")
    .select("id, user_id")
    .eq("key_hash", keyHash)
    .eq("revoked", false)
    .single();

  if (error || !keyRow) return null;

  // Get user record
  const { data: user, error: userError } = await sb
    .from("users")
    .select("*")
    .eq("id", keyRow.user_id)
    .single();

  if (userError || !user) return null;

  // Update last_used_at (fire-and-forget)
  sb.from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRow.id)
    .then(() => {});

  return { user: user as DbUser, keyId: keyRow.id };
}

/**
 * List all API keys for a user (active + revoked).
 */
export async function listApiKeys(userId: string): Promise<ApiKeyInfo[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from("api_keys")
    .select("id, name, key_prefix, created_at, last_used_at, revoked")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    keyPrefix: row.key_prefix,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
    revoked: row.revoked,
  }));
}

/**
 * Revoke an API key (soft delete).
 */
export async function revokeApiKey(
  userId: string,
  keyId: string
): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const { error } = await sb
    .from("api_keys")
    .update({ revoked: true })
    .eq("id", keyId)
    .eq("user_id", userId);

  return !error;
}
