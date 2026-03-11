import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getUserByClerkId, upsertUser } from "@/lib/db/users";
import { getAuditsByUser, deleteAudit } from "@/lib/db/audits";
import { getUserUsage } from "@/lib/server-usage";
import { PLAN_LIMITS, PLAN_FEATURES } from "@/lib/types";
import type { PlanTier } from "@/lib/types";

/**
 * GET /api/audits?page=1
 * Returns paginated audit list for the authenticated user.
 */
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

    // Try to find user, or lazily create them if Clerk webhook hasn't fired yet
    let dbUser = await getUserByClerkId(userId);
    if (!dbUser) {
      const clerkUser = await currentUser();
      if (clerkUser?.emailAddresses?.[0]?.emailAddress) {
        dbUser = await upsertUser(userId, clerkUser.emailAddresses[0].emailAddress);
      }
      if (!dbUser) {
        return NextResponse.json({ audits: [], total: 0, page });
      }
    }

    const { audits, total } = await getAuditsByUser(dbUser.id, page);
    const plan = (dbUser.plan || "free") as PlanTier;
    const features = PLAN_FEATURES[plan];

    // Get actual usage from Redis (persists even after audit deletion)
    const { auditsUsed } = await getUserUsage(userId, plan);

    return NextResponse.json({
      audits: audits.map((a) => ({
        id: a.id,
        url: a.url,
        score: (a.result as { overallScore?: number })?.overallScore ?? 0,
        grade: (a.result as { grade?: string })?.grade ?? "N/A",
        screenshotPath: a.screenshot_path,
        createdAt: a.created_at,
      })),
      total,
      auditsUsed,
      page,
      plan,
      planLimit: PLAN_LIMITS[plan],
      features: {
        pdfExport: features.pdfExport,
        aiChat: features.aiChat,
        improvements: features.improvements,
      },
    });
  } catch (error) {
    console.error("Error fetching audits:", error);
    return NextResponse.json({ error: "Failed to fetch audits" }, { status: 500 });
  }
}

/**
 * DELETE /api/audits
 * Permanently deletes an audit owned by the authenticated user.
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
    const { auditId } = body;

    if (!auditId || typeof auditId !== "string") {
      return NextResponse.json({ error: "Missing auditId" }, { status: 400 });
    }

    const ok = await deleteAudit(auditId, dbUser.id);
    if (!ok) {
      return NextResponse.json({ error: "Failed to delete audit" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting audit:", error);
    return NextResponse.json({ error: "Failed to delete audit" }, { status: 500 });
  }
}
