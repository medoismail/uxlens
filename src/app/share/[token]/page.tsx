import { notFound } from "next/navigation";
import { getAuditByShareToken } from "@/lib/db/audits";
import { AuditViewClient } from "@/components/audit-view-client";

interface SharedAuditPageProps {
  params: Promise<{ token: string }>;
}

export default async function SharedAuditPage({ params }: SharedAuditPageProps) {
  const { token } = await params;

  const audit = await getAuditByShareToken(token);
  if (!audit) {
    notFound();
  }

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
        visualAnalysis: audit.visual_analysis || undefined,
        competitorAnalysis: undefined, // Hide competitor data in shared view
        createdAt: audit.created_at,
      }}
      plan="free"
      isSharedView
    />
  );
}
