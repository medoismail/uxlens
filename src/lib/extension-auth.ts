import { auth } from "@clerk/nextjs/server";
import { verifyToken } from "@clerk/nextjs/server";
import { getUserByClerkId } from "./db/users";
import type { DbUser } from "./db/users";

/**
 * Resolve the authenticated user from either:
 * 1. Clerk session cookie (normal web requests)
 * 2. Bearer token in Authorization header (extension requests)
 *
 * Returns the Clerk userId or null.
 */
export async function resolveClerkUserId(request: Request): Promise<string | null> {
  // Try standard Clerk session first
  try {
    const { userId } = await auth();
    if (userId) return userId;
  } catch {
    // Not a cookie-based session
  }

  // Try Bearer token (extension sends Clerk session token)
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  if (!token) return null;

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });
    return payload.sub || null;
  } catch {
    return null;
  }
}

/**
 * Resolve the full database user from a request.
 * Works with both cookie-based and Bearer token auth.
 */
export async function resolveDbUser(request: Request): Promise<DbUser | null> {
  const clerkUserId = await resolveClerkUserId(request);
  if (!clerkUserId) return null;
  return getUserByClerkId(clerkUserId);
}
