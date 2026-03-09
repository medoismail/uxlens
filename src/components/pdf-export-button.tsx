"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import type { UXAuditResult, CompetitorAnalysis } from "@/lib/types";

interface PdfExportButtonProps {
  data: UXAuditResult;
  url: string;
  competitorAnalysis?: CompetitorAnalysis;
}

export function PdfExportButton({ data, url, competitorAnalysis }: PdfExportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setIsGenerating(true);
    setError(null);

    try {
      // Dynamic import to avoid bundling react-pdf for all users
      const { pdf } = await import("@react-pdf/renderer");
      const { AuditPDF } = await import("@/lib/pdf/audit-pdf");

      const blob = await pdf(<AuditPDF data={data} url={url} competitorAnalysis={competitorAnalysis} />).toBlob();

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
      setError("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
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
          Generating PDF...
        </>
      ) : (
        <>
          <Download className="h-3.5 w-3.5" />
          Export PDF
        </>
      )}
    </button>
    {error && (
      <p className="text-[11px] mt-1" style={{ color: "var(--score-low, #ef4444)" }}>
        {error}
      </p>
    )}
    </>
  );
}
