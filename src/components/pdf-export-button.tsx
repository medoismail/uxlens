"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import type { UXAuditResult, CompetitorAnalysis, HeatmapZone, VisualAnalysis } from "@/lib/types";

/** Quick check for Arabic/Hebrew/Urdu script in the audit data */
const RTL_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0590-\u05FF]/;
function hasNonLatinContent(data: UXAuditResult): boolean {
  const sample = [
    data.executiveSummary,
    data.sections?.[0]?.subtitle,
    data.sections?.[0]?.findings?.[0]?.title,
    data.rewrite?.beforeHeadline,
  ].filter(Boolean).join(" ");
  return RTL_REGEX.test(sample);
}

interface PdfExportButtonProps {
  data: UXAuditResult;
  url: string;
  competitorAnalysis?: CompetitorAnalysis;
  screenshotUrl?: string;
  heatmapZones?: HeatmapZone[];
  pageHeight?: number;
  viewportWidth?: number;
  visualAnalysis?: VisualAnalysis;
}

export function PdfExportButton({
  data, url, competitorAnalysis,
  screenshotUrl, heatmapZones, pageHeight, viewportWidth, visualAnalysis,
}: PdfExportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setIsGenerating(true);
    setError(null);
    setStatusText("Generating PDF...");

    try {
      // If audit has Arabic/RTL content, translate to English first
      let pdfData = data;
      if (hasNonLatinContent(data)) {
        setStatusText("Translating to English...");
        try {
          const res = await fetch("/api/pdf-translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data }),
          });
          if (res.ok) {
            const { data: translated } = await res.json();
            if (translated) pdfData = translated;
          }
        } catch (e) {
          console.warn("Translation failed, using original data:", e);
          // Fall through with original data
        }
        setStatusText("Generating PDF...");
      }

      // Generate heatmap composite image if we have screenshot + zones
      let heatmapImage: string | undefined;
      if (screenshotUrl && heatmapZones && heatmapZones.length > 0) {
        try {
          const { generateHeatmapComposite } = await import("@/lib/heatmap-composite");
          heatmapImage = await generateHeatmapComposite(
            screenshotUrl,
            heatmapZones,
            pageHeight || 3000,
            viewportWidth || 1280
          );
        } catch (e) {
          console.warn("Failed to generate heatmap composite for PDF:", e);
        }
      }

      // Dynamic import to avoid bundling react-pdf for all users
      const { pdf } = await import("@react-pdf/renderer");
      const { AuditPDF } = await import("@/lib/pdf/audit-pdf");

      const blob = await pdf(
        <AuditPDF
          data={pdfData}
          url={url}
          competitorAnalysis={competitorAnalysis}
          heatmapImage={heatmapImage}
          visualAnalysis={visualAnalysis}
        />
      ).toBlob();

      // Trigger download
      let domain = "audit";
      try { domain = new URL(url).hostname.replace("www.", ""); } catch {}
      const filename = `uxlens-audit-${domain}-${new Date().toISOString().slice(0, 10)}.pdf`;

      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("PDF export failed:", err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to generate PDF: ${msg}`);
    } finally {
      setIsGenerating(false);
      setStatusText("");
    }
  }

  return (
    <>
    <button
      onClick={handleExport}
      disabled={isGenerating}
      className="inline-flex items-center gap-2 text-[12px] font-medium px-3.5 py-1.5 rounded-lg border transition-all duration-150 hover:opacity-80 disabled:opacity-50"
      style={{
        borderColor: "var(--brand-glow)",
        color: "var(--brand)",
        background: "var(--brand-dim)",
      }}
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {statusText || "Generating PDF..."}
        </>
      ) : (
        <>
          <Download className="h-3.5 w-3.5" />
          Export PDF
        </>
      )}
    </button>
    {error && (
      <p className="text-[12px] mt-1" style={{ color: "var(--score-low, #ef4444)" }}>
        {error}
      </p>
    )}
    </>
  );
}
