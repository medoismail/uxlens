import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserByClerkId } from "@/lib/db/users";
import { getAuditById, setShareToken } from "@/lib/db/audits";
import crypto from "crypto";

function generateToken(): string {
  return crypto.randomBytes(9).toString("base64url"); // 12 chars, URL-safe
}

export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getUserByClerkId(clerkUserId);
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { auditId } = await request.json();
    if (!auditId) {
      return NextResponse.json({ error: "Missing auditId" }, { status: 400 });
    }

    // Verify ownership
    const audit = await getAuditById(auditId, dbUser.id);
    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // Toggle: if already shared → unshare, otherwise → share
    const newToken = audit.share_token ? null : generateToken();
    const ok = await setShareToken(auditId, dbUser.id, newToken);

    if (!ok) {
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    return NextResponse.json({ shareToken: newToken });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
