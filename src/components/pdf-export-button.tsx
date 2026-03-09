"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import type { UXAuditResult } from "@/lib/types";

interface PdfExportButtonProps {
  data: UXAuditResult;
  url: string;
}

export function PdfExportButton({ data, url }: PdfExportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleExport() {
    setIsGenerating(true);

    try {
      // Dynamic import to avoid bundling react-pdf for all users
      const { pdf } = await import("@react-pdf/renderer");
      const { AuditPDF } = await import("@/lib/pdf/audit-pdf");

      const blob = await pdf(<AuditPDF data={data} url={url} />).toBlob();

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
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
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
  );
}
