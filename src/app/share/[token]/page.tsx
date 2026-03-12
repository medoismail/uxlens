import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAuditByShareToken } from "@/lib/db/audits";
import { getUserById } from "@/lib/db/users";
import { AuditViewClient } from "@/components/audit-view-client";
import type { UXAuditResult } from "@/lib/types";

interface SharedAuditPageProps {
  params: Promise<{ token: string }>;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

export async function generateMetadata({ params }: SharedAuditPageProps): Promise<Metadata> {
  const { token } = await params;
  const audit = await getAuditByShareToken(token);

  if (!audit) {
    return { title: "Audit Not Found" };
  }

  const domain = getDomain(audit.url);
  const result = audit.result as UXAuditResult;
  const score = result?.overallScore ?? 0;
  const grade = result?.grade ?? "";

  const title = `UX Audit — ${domain}`;
  const description = `${domain} scored ${score}/100 (${grade}) on a 10-layer AI UX diagnostic by UXLens. Covers heuristic evaluation, trust signals, conversion architecture, and more.`;

  // Use the screenshot as OG image
  const ogImage = audit.screenshot_path || "https://www.uxlens.pro/og-image.png";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.uxlens.pro/share/${token}`,
      siteName: "UXLens",
      type: "article",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `UX Audit heatmap for ${domain}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function SharedAuditPage({ params }: SharedAuditPageProps) {
  const { token } = await params;

  const audit = await getAuditByShareToken(token);
  if (!audit) {
    notFound();
  }

  // Look up the audit owner's plan so shared view matches their tier
  const owner = await getUserById(audit.user_id);
  const ownerPlan = owner?.plan ?? "free";

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
        competitorAnalysis: audit.competitor_analysis || undefined,
        createdAt: audit.created_at,
      }}
      plan={ownerPlan}
      isSharedView
    />
  );
}
