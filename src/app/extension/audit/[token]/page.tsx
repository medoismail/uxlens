"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { LoadingState } from "@/components/loading-state";

interface ProgressData {
  stage: string;
  percent: number;
}

interface MetadataData {
  title: string;
  description: string;
  headingsCount: number;
  language?: string;
}

/**
 * /extension/audit/[token]
 *
 * Shows the 10-stage loading animation while the AI audit runs.
 * Streams progress from /api/extension/analyze?token=xxx.
 * On completion, redirects to the full audit page.
 */
export default function ExtensionAuditPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [progress, setProgress] = useState<ProgressData | undefined>();
  const [metadata, setMetadata] = useState<MetadataData | undefined>();
  const [error, setError] = useState<string>("");
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;

    async function runAudit() {
      try {
        const res = await fetch(`/api/extension/analyze?token=${token}`);

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Request failed" }));
          setError(err.error || `HTTP ${res.status}`);
          return;
        }

        if (!res.body) {
          setError("No response stream");
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const event = JSON.parse(jsonStr);

              switch (event.type) {
                case "metadata":
                  setMetadata({
                    title: event.title,
                    description: event.description,
                    headingsCount: event.headingsCount,
                    language: event.language,
                  });
                  break;

                case "progress":
                  setProgress({ stage: event.stage, percent: event.percent });
                  break;

                case "saved":
                  // Redirect to the full audit page
                  router.push(`/audit/${event.auditId}`);
                  return;

                case "complete":
                  // If not saved (user not signed in), wait for saved event
                  // or show completion
                  setProgress({ stage: "complete", percent: 100 });
                  break;

                case "error":
                  setError(event.error);
                  return;
              }
            } catch {
              // Skip malformed
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    }

    runAudit();
  }, [token, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <span className="text-destructive text-xl">!</span>
          </div>
          <h2 className="text-lg font-semibold mb-2">Audit Failed</h2>
          <p className="text-sm text-foreground/40 mb-4">{error}</p>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 text-sm font-medium rounded-lg text-white"
            style={{ background: "var(--brand, #4C2CFF)" }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <LoadingState progress={progress} metadata={metadata} />
    </div>
  );
}
