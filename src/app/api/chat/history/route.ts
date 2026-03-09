import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getUserByClerkId, upsertUser } from "@/lib/db/users";
import { getChatHistory, getChatCredits } from "@/lib/db/chat";
import { PLAN_FEATURES } from "@/lib/types";
import type { PlanTier } from "@/lib/types";

/**
 * GET /api/chat/history?auditId=xxx
 * Returns chat history and remaining credits for an audit.
 */
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const auditId = searchParams.get("auditId");

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!auditId || !UUID_RE.test(auditId)) {
      return NextResponse.json({ error: "Missing or invalid auditId" }, { status: 400 });
    }

    // Get or create Supabase user
    let dbUser = await getUserByClerkId(userId);
    if (!dbUser) {
      const clerkUser = await currentUser();
      if (clerkUser?.emailAddresses?.[0]?.emailAddress) {
        dbUser = await upsertUser(userId, clerkUser.emailAddresses[0].emailAddress);
      }
      if (!dbUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }

    const plan = (dbUser.plan || "free") as PlanTier;
    const features = PLAN_FEATURES[plan];

    if (!features.aiChat) {
      return NextResponse.json({
        messages: [],
        credits: { messages_used: 0, messages_limit: 0 },
        chatEnabled: false,
      });
    }

    const [messages, credits] = await Promise.all([
      getChatHistory(auditId, dbUser.id),
      getChatCredits(dbUser.id, features.chatLimit),
    ]);

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.created_at,
      })),
      credits,
      chatEnabled: true,
    });
  } catch (error) {
    console.error("Chat history error:", error);
    return NextResponse.json({ error: "Failed to fetch chat history" }, { status: 500 });
  }
}
