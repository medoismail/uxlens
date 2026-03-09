import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getUserByClerkId } from "@/lib/db/users";
import { getAuditById } from "@/lib/db/audits";
import { AuditViewClient } from "@/components/audit-view-client";

interface AuditPageProps {
  params: Promise<{ id: string }>;
}

export default async function AuditPage({ params }: AuditPageProps) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const dbUser = await getUserByClerkId(userId);
  if (!dbUser) {
    redirect("/dashboard");
  }

  const audit = await getAuditById(id, dbUser.id);
  if (!audit) {
    notFound();
  }

  // Extract pageHeight from heatmap_zones metadata if stored, otherwise null
  const zones = audit.heatmap_zones as Record<string, unknown> | unknown[] | null;
  let pageHeight: number | null = null;
  if (zones && !Array.isArray(zones) && typeof zones === "object" && "pageHeight" in zones) {
    pageHeight = (zones as { pageHeight: number }).pageHeight;
  }

  return (
    <AuditViewClient
      audit={{
        id: audit.id,
        url: audit.url,
        result: audit.result,
        screenshotPath: audit.screenshot_path,
        heatmapZones: audit.heatmap_zones as unknown[],
        pageHeight,
        competitorAnalysis: audit.competitor_analysis || undefined,
        createdAt: audit.created_at,
      }}
      plan={dbUser.plan}
    />
  );
}
