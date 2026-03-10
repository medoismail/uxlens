import { NextResponse } from "next/server";
import { validateApiKey } from "@/lib/api-keys";
import { getRedis } from "@/lib/server-usage";
import type { DbUser } from "@/lib/db/users";
import type { PlanTier } from "@/lib/types";

interface McpAuthSuccess {
  user: DbUser;
  plan: PlanTier;
  keyId: string;
}

/**
 * Authenticate an MCP API request via Bearer token.
 * Returns the user + plan on success, or a NextResponse error.
 */
export async function authenticateMcpRequest(
  request: Request
): Promise<McpAuthSuccess | NextResponse> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing Authorization header. Use: Bearer uxl_..." },
      { status: 401 }
    );
  }

  const rawKey = authHeader.slice(7).trim();

  if (!rawKey) {
    return NextResponse.json(
      { error: "Empty API key" },
      { status: 401 }
    );
  }

  const result = await validateApiKey(rawKey);

  if (!result) {
    return NextResponse.json(
      { error: "Invalid or revoked API key" },
      { status: 401 }
    );
  }

  const plan = (result.user.plan || "free") as PlanTier;

  // Only pro and agency users can use the MCP skill
  if (plan !== "pro" && plan !== "agency") {
    return NextResponse.json(
      { error: "Pro or Agency plan required to use the UXLens skill" },
      { status: 403 }
    );
  }

  return { user: result.user, plan, keyId: result.keyId };
}

/**
 * Rate limit an MCP request by key ID.
 * Returns true if allowed, false if rate limited.
 */
export async function checkMcpRateLimit(
  keyId: string,
  action: string,
  maxPerHour: number
): Promise<boolean> {
  const r = getRedis();
  if (!r) return true; // No Redis = no rate limiting

  const rateKey = `uxlens:mcp:${action}:${keyId}`;
  const count = (await r.get<number>(rateKey)) || 0;

  if (count >= maxPerHour) return false;

  await r.incr(rateKey);
  await r.expire(rateKey, 3600);
  return true;
}
