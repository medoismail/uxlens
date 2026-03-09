"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { FileText, ExternalLink, ChevronLeft, ChevronRight, BarChart3 } from "lucide-react";

interface AuditItem {
  id: string;
  url: string;
  score: number;
  grade: string;
  screenshotPath: string | null;
  createdAt: string;
}

function scoreColor(s: number) {
  if (s >= 75) return "var(--score-high)";
  if (s >= 50) return "var(--score-mid)";
  return "var(--score-low)";
}

export function DashboardClient() {
  const [audits, setAudits] = useState<AuditItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const perPage = 12;

  useEffect(() => {
    fetchAudits(page);
  }, [page]);

  async function fetchAudits(p: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/audits?page=${p}`);
      const data = await res.json();
      setAudits(data.audits || []);
      setTotal(data.total || 0);
    } catch {
      setAudits([]);
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 w-full max-w-[960px] mx-auto px-7 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Your Audits
            </h1>
            <p className="text-[12px] text-foreground/40 mt-1">
              {total} audit{total !== 1 ? "s" : ""} total
            </p>
          </div>
          <Link
            href="/"
            className="text-[12px] font-medium px-4 py-2 rounded-lg transition-all duration-150 hover:opacity-80"
            style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
          >
            New Audit
          </Link>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl border p-4 animate-pulse"
                style={{ borderColor: "var(--border)", background: "var(--s1)" }}
              >
                <div className="h-4 w-3/4 rounded" style={{ background: "var(--s3)" }} />
                <div className="h-3 w-1/2 rounded mt-3" style={{ background: "var(--s3)" }} />
                <div className="h-8 w-16 rounded mt-4" style={{ background: "var(--s3)" }} />
              </div>
            ))}
          </div>
        )}

        {!loading && audits.length === 0 && (
          <div className="text-center py-20">
            <BarChart3 className="h-10 w-10 mx-auto mb-4 text-foreground/15" />
            <h2 className="text-[16px] font-semibold text-foreground/50 mb-2">
              No audits yet
            </h2>
            <p className="text-[12px] text-foreground/30 mb-6 max-w-sm mx-auto">
              Run your first UX audit to see it appear here. All your audits will be saved automatically.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[13px] font-medium px-5 py-2.5 rounded-lg transition-all duration-150 hover:opacity-80"
              style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
            >
              <FileText className="h-3.5 w-3.5" />
              Run First Audit
            </Link>
          </div>
        )}

        {!loading && audits.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {audits.map((audit) => {
                let domain = audit.url;
                try { domain = new URL(audit.url).hostname.replace("www.", ""); } catch {}
                const date = new Date(audit.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                return (
                  <Link
                    key={audit.id}
                    href={`/audit/${audit.id}`}
                    className="group rounded-xl border p-4 transition-all duration-200 hover:shadow-elevation-1 hover:border-foreground/15"
                    style={{ borderColor: "var(--border)", background: "var(--s1)" }}
                  >
                    {/* Thumbnail */}
                    {audit.screenshotPath && (
                      <div className="rounded-lg overflow-hidden mb-3 border" style={{ borderColor: "var(--border)" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={audit.screenshotPath}
                          alt={`Screenshot of ${domain}`}
                          className="w-full h-28 object-cover object-top"
                        />
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-foreground truncate group-hover:text-foreground/80 transition-colors">
                          {domain}
                        </p>
                        <p className="text-[12px] text-foreground/30 mt-0.5">{date}</p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className="text-[18px] font-bold tabular-nums"
                          style={{ color: scoreColor(audit.score) }}
                        >
                          {audit.score}
                        </span>
                        <span
                          className="text-[12px] font-mono px-1.5 py-0.5 rounded"
                          style={{
                            background: `${scoreColor(audit.score)}15`,
                            color: scoreColor(audit.score),
                          }}
                        >
                          {audit.grade}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 mt-3 text-[12px] text-foreground/25 group-hover:text-foreground/40 transition-colors">
                      <ExternalLink className="h-3 w-3" />
                      <span>View full report</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border transition-all disabled:opacity-30"
                  style={{ borderColor: "var(--border)" }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-[12px] text-foreground/40 px-3">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border transition-all disabled:opacity-30"
                  style={{ borderColor: "var(--border)" }}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
