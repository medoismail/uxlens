import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId, getUserPlan } from "@/lib/db/users";
import { generateApiKey, listApiKeys, revokeApiKey, revealApiKey } from "@/lib/api-keys";

/**
 * GET /api/keys — List the authenticated user's API keys.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plan = await getUserPlan(userId);
    if (plan !== "pro" && plan !== "agency") {
      return NextResponse.json(
        { error: "Pro or Agency plan required" },
        { status: 403 }
      );
    }

    const dbUser = await getUserByClerkId(userId);
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const keys = await listApiKeys(dbUser.id);
    return NextResponse.json({ keys });
  } catch (error) {
    console.error("[API Keys] List error:", error);
    return NextResponse.json({ error: "Failed to list API keys" }, { status: 500 });
  }
}

/**
 * POST /api/keys — Generate a new API key.
 * Only 1 active key allowed per user.
 * Body: { name?: string }
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plan = await getUserPlan(userId);
    if (plan !== "pro" && plan !== "agency") {
      return NextResponse.json(
        { error: "Pro or Agency plan required" },
        { status: 403 }
      );
    }

    const dbUser = await getUserByClerkId(userId);
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const name = body.name || "Default";

    const result = await generateApiKey(dbUser.id, name);
    if (!result) {
      return NextResponse.json({ error: "Failed to generate key" }, { status: 500 });
    }

    return NextResponse.json({
      key: result.key,
      keyPrefix: result.keyPrefix,
      id: result.id,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to generate key";
    const status = msg.includes("already have") ? 400 : 500;
    console.error("[API Keys] Generate error:", error);
    return NextResponse.json({ error: msg }, { status });
  }
}

/**
 * PATCH /api/keys — Reveal the full API key (decrypted).
 * Body: { keyId: string }
 */
export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getUserByClerkId(userId);
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { keyId } = body;

    if (!keyId || typeof keyId !== "string") {
      return NextResponse.json({ error: "Missing keyId" }, { status: 400 });
    }

    const rawKey = await revealApiKey(dbUser.id, keyId);
    if (!rawKey) {
      return NextResponse.json({ error: "Unable to reveal key" }, { status: 404 });
    }

    return NextResponse.json({ key: rawKey });
  } catch (error) {
    console.error("[API Keys] Reveal error:", error);
    return NextResponse.json({ error: "Failed to reveal key" }, { status: 500 });
  }
}

/**
 * DELETE /api/keys — Revoke an API key.
 * Body: { keyId: string }
 */
export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getUserByClerkId(userId);
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { keyId } = body;

    if (!keyId) {
      return NextResponse.json({ error: "Missing keyId" }, { status: 400 });
    }

    const ok = await revokeApiKey(dbUser.id, keyId);
    if (!ok) {
      return NextResponse.json({ error: "Failed to revoke key" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API Keys] Revoke error:", error);
    return NextResponse.json({ error: "Failed to revoke key" }, { status: 500 });
  }
}
