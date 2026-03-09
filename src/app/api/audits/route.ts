import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/db/users";
import { getAuditsByUser } from "@/lib/db/audits";

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

    const dbUser = await getUserByClerkId(userId);
    if (!dbUser) {
      return NextResponse.json({ audits: [], total: 0, page });
    }

    const { audits, total } = await getAuditsByUser(dbUser.id, page);

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
      page,
    });
  } catch (error) {
    console.error("Error fetching audits:", error);
    return NextResponse.json({ error: "Failed to fetch audits" }, { status: 500 });
  }
}
