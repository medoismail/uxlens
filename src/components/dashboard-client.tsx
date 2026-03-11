"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { FileText, ExternalLink, ChevronLeft, ChevronRight, BarChart3, Crown, ArrowUpRight, Key, Copy, Check, Trash2, Terminal, X, AlertTriangle } from "lucide-react";
import type { PlanTier } from "@/lib/types";

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revoked: boolean;
}

interface AuditItem {
  id: string;
  url: string;
  score: number;
  grade: string;
  screenshotPath: string | null;
  createdAt: string;
}

interface PlanInfo {
  plan: PlanTier;
  planLimit: number;
  features: {
    pdfExport: boolean;
    aiChat: boolean;
    improvements: boolean;
  };
}

function scoreColor(s: number) {
  if (s >= 75) return "var(--score-high)";
  if (s >= 50) return "var(--score-mid)";
  return "var(--score-low)";
}

const PLAN_DISPLAY: Record<string, { label: string; color: string; bg: string; border: string }> = {
  free: { label: "Free", color: "var(--foreground)", bg: "var(--s2)", border: "var(--border)" },
  starter: { label: "Starter", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  pro: { label: "Pro", color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd" },
  agency: { label: "Agency", color: "#db2777", bg: "#fdf2f8", border: "#f9a8d4" },
};

function PlanCard({ planInfo, totalAudits }: { planInfo: PlanInfo; totalAudits: number }) {
  const config = PLAN_DISPLAY[planInfo.plan] || PLAN_DISPLAY.free;
  const usagePercent = planInfo.planLimit > 0
    ? Math.min(100, Math.round((totalAudits / planInfo.planLimit) * 100))
    : 0;
  const isNearLimit = usagePercent >= 80;
  const nextPlan = planInfo.plan === "free" ? "Starter" : planInfo.plan === "starter" ? "Pro" : planInfo.plan === "pro" ? "Agency" : null;

  return (
    <div
      className="rounded-xl border p-4 mb-6"
      style={{ borderColor: config.border, background: config.bg }}
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Plan info */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg grid place-items-center"
            style={{ background: config.color + "18" }}
          >
            <Crown className="w-4 h-4" style={{ color: config.color }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className="text-[13px] font-bold"
                style={{ color: config.color }}
              >
                {config.label} Plan
              </span>
              {planInfo.features.pdfExport && (
                <span className="text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: config.color + "15", color: config.color }}>
                  PDF
                </span>
              )}
              {planInfo.features.aiChat && (
                <span className="text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: config.color + "15", color: config.color }}>
                  AI Chat
                </span>
              )}
            </div>
            <p className="text-[11px] text-foreground/40 mt-0.5">
              {totalAudits} of {planInfo.planLimit} audits this month
            </p>
          </div>
        </div>

        {/* Usage bar + upgrade */}
        <div className="flex items-center gap-4">
          {/* Progress bar */}
          <div className="w-32 hidden sm:block">
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: config.color + "15" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${usagePercent}%`,
                  background: isNearLimit ? "var(--score-low)" : config.color,
                }}
              />
            </div>
            <p className="text-[10px] text-foreground/30 mt-1 text-right">
              {usagePercent}% used
            </p>
          </div>

          {nextPlan && (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1 text-[11px] font-medium px-3 py-1.5 rounded-lg border transition-all hover:opacity-80"
              style={{
                borderColor: "var(--brand-glow)",
                color: "var(--brand)",
                background: "var(--brand-dim)",
              }}
            >
              Upgrade
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function ApiKeysSection() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    try {
      const res = await fetch("/api/keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch {
      // Ignore — user may not have pro plan
    } finally {
      setLoading(false);
    }
  }

  async function generate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Default" }),
      });
      const data = await res.json();
      if (res.ok && data.key) {
        setNewKey(data.key);
        fetchKeys();
      } else {
        alert(data.error || "Failed to generate key");
      }
    } catch {
      alert("Failed to generate key");
    } finally {
      setGenerating(false);
    }
  }

  async function revoke(keyId: string) {
    if (!confirm("Revoke this API key? Any tools using it will stop working.")) return;
    try {
      await fetch("/api/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId }),
      });
      fetchKeys();
    } catch {
      alert("Failed to revoke key");
    }
  }

  function copyToClipboard(text: string, type: "key" | "cmd") {
    navigator.clipboard.writeText(text);
    if (type === "key") {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopiedCmd(true);
      setTimeout(() => setCopiedCmd(false), 2000);
    }
  }

  const activeKeys = keys.filter((k) => !k.revoked);

  // Dynamic install command: include user's key if just generated
  const hasRealKey = !!newKey;
  const installCmd = `claude mcp add --transport http uxlens https://uxlens.pro/api/skill --header "Authorization: Bearer ${hasRealKey ? newKey : "YOUR_API_KEY"}"`;


  return (
    <div
      className="rounded-xl border p-5 mb-6"
      style={{ borderColor: "var(--border)", background: "var(--s1)" }}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="w-8 h-8 rounded-lg grid place-items-center"
          style={{ background: "#16a34a18" }}
        >
          <Key className="w-4 h-4" style={{ color: "#16a34a" }} />
        </div>
        <div>
          <h3 className="text-[13px] font-bold text-foreground">UXLens Skill</h3>
          <p className="text-[11px] text-foreground/40">Use UXLens inside Claude Code and other AI tools</p>
        </div>
      </div>

      {/* Install command */}
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-wider text-foreground/30 mb-1.5 font-medium">Install Command</p>
        <div
          className="flex items-center gap-2 rounded-lg border px-3 py-2"
          style={{ borderColor: "var(--border)", background: "var(--s2)" }}
        >
          <Terminal className="w-3.5 h-3.5 text-foreground/30 shrink-0" />
          <code className="text-[11px] text-foreground/60 flex-1 font-mono truncate">
            {installCmd}
          </code>
          <button
            onClick={() => copyToClipboard(installCmd, "cmd")}
            className="shrink-0 p-1 rounded hover:bg-foreground/5 transition-colors"
            title="Copy command"
          >
            {copiedCmd ? (
              <Check className="w-3.5 h-3.5 text-green-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-foreground/30" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-foreground/25 mt-1">
          {hasRealKey
            ? "Run this in your terminal — your API key is already included"
            : "Generate an API key below, then the command will include it automatically"}
        </p>
      </div>

      {/* New key display */}
      {newKey && (
        <div
          className="rounded-lg border p-3 mb-4"
          style={{ borderColor: "#bbf7d0", background: "#f0fdf4" }}
        >
          <p className="text-[11px] font-medium text-green-800 mb-1.5">
            🔑 Your new API key (shown once — copy it now):
          </p>
          <div className="flex items-center gap-2">
            <code className="text-[12px] font-mono text-green-900 flex-1 break-all">
              {newKey}
            </code>
            <button
              onClick={() => copyToClipboard(newKey, "key")}
              className="shrink-0 p-1.5 rounded-md bg-green-100 hover:bg-green-200 transition-colors"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-700" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-green-700" />
              )}
            </button>
          </div>
          <button
            onClick={() => setNewKey(null)}
            className="text-[10px] text-green-600 hover:text-green-800 mt-2 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Key list */}
      {!loading && activeKeys.length > 0 && (
        <div className="space-y-2 mb-4">
          {activeKeys.map((k) => (
            <div
              key={k.id}
              className="flex items-center justify-between rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border)", background: "var(--s2)" }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <code className="text-[12px] font-mono text-foreground/60">
                  {k.keyPrefix}...
                </code>
                <span className="text-[10px] text-foreground/25">
                  {new Date(k.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                {k.lastUsedAt && (
                  <span className="text-[10px] text-foreground/25">
                    Last used {new Date(k.lastUsedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
              <button
                onClick={() => revoke(k.id)}
                className="p-1.5 rounded hover:bg-red-50 transition-colors group"
                title="Revoke key"
              >
                <Trash2 className="w-3.5 h-3.5 text-foreground/20 group-hover:text-red-500 transition-colors" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={generate}
        disabled={generating || activeKeys.length >= 3}
        className="text-[12px] font-medium px-4 py-2 rounded-lg border transition-all duration-150 hover:opacity-80 disabled:opacity-40"
        style={{
          borderColor: "#bbf7d0",
          color: "#16a34a",
          background: "#f0fdf4",
        }}
      >
        {generating ? "Generating..." : activeKeys.length >= 3 ? "Max 3 keys" : "Generate API Key"}
      </button>
    </div>
  );
}

export function DashboardClient() {
  const [audits, setAudits] = useState<AuditItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AuditItem | null>(null);
  const [deleting, setDeleting] = useState(false);
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
      if (data.plan) {
        setPlanInfo({
          plan: data.plan,
          planLimit: data.planLimit,
          features: data.features,
        });
      }
    } catch {
      setAudits([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAudit(auditId: string) {
    setDeleting(true);
    try {
      const res = await fetch("/api/audits", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId }),
      });
      if (res.ok) {
        setDeleteTarget(null);
        fetchAudits(page);
      } else {
        alert("Failed to delete audit");
      }
    } catch {
      alert("Failed to delete audit");
    } finally {
      setDeleting(false);
    }
  }

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 w-full max-w-[960px] mx-auto px-7 py-10">
        <div className="flex items-center justify-between mb-6">
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

        {/* Plan info card */}
        {planInfo && <PlanCard planInfo={planInfo} totalAudits={total} />}

        {/* API Keys (Pro/Agency only) */}
        {planInfo && (planInfo.plan === "pro" || planInfo.plan === "agency") && (
          <ApiKeysSection />
        )}

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
                  <div
                    key={audit.id}
                    className="group relative rounded-xl border p-4 transition-all duration-200 hover:shadow-elevation-1 hover:border-foreground/15"
                    style={{ borderColor: "var(--border)", background: "var(--s1)" }}
                  >
                    {/* Delete button (top-right, visible on hover) */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(audit); }}
                      className="absolute top-3 right-3 z-10 p-1.5 rounded-lg border opacity-0 group-hover:opacity-100 transition-all duration-150 hover:border-red-200 hover:bg-red-50"
                      style={{ borderColor: "var(--border)", background: "var(--s1)" }}
                      title="Delete audit"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-foreground/30 hover:text-red-500 transition-colors" />
                    </button>

                    <Link href={`/audit/${audit.id}`} className="block">
                      {/* Thumbnail */}
                      {audit.screenshotPath && (
                        <div className="relative rounded-lg overflow-hidden mb-3 border h-28" style={{ borderColor: "var(--border)" }}>
                          <Image
                            src={audit.screenshotPath}
                            alt={`Screenshot of ${domain}`}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover object-top"
                            unoptimized
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
                  </div>
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

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          audit={deleteTarget}
          deleting={deleting}
          onConfirm={() => handleDeleteAudit(deleteTarget.id)}
          onCancel={() => { if (!deleting) setDeleteTarget(null); }}
        />
      )}
    </div>
  );
}

/* ── Delete Confirmation Modal ── */

function DeleteConfirmModal({
  audit,
  deleting,
  onConfirm,
  onCancel,
}: {
  audit: AuditItem;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [input, setInput] = useState("");

  let domain = audit.url;
  try { domain = new URL(audit.url).hostname.replace("www.", ""); } catch {}

  const confirmText = `delete ${domain}`;
  const isMatch = input.trim().toLowerCase() === confirmText.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-xl border p-6 shadow-lg animate-fade-in"
        style={{ background: "var(--s1)", borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          disabled={deleting}
          className="absolute top-4 right-4 text-foreground/30 hover:text-foreground/50 transition-colors disabled:opacity-30"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg grid place-items-center" style={{ background: "oklch(0.55 0.17 20 / 8%)" }}>
            <AlertTriangle className="h-4 w-4" style={{ color: "var(--score-low)" }} />
          </div>
          <h3 className="text-[15px] font-semibold">Delete Audit</h3>
        </div>

        {/* Warning text */}
        <p className="text-[13px] text-foreground/50 leading-relaxed mb-4">
          This will permanently delete the audit for{" "}
          <span className="font-semibold text-foreground/70">{domain}</span>.
          This action cannot be undone.
        </p>

        {/* Confirmation prompt */}
        <p className="text-[12px] text-foreground/40 mb-2.5">
          Type{" "}
          <code className="font-mono text-[12px] px-2 py-0.5 rounded" style={{ background: "var(--s2)", color: "var(--foreground)" }}>
            {confirmText}
          </code>{" "}
          to confirm:
        </p>

        {/* Input */}
        <div
          className="rounded-lg border transition-all duration-200 mb-5"
          style={{ borderColor: isMatch ? "var(--score-low)" : "var(--border)", background: "white" }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={confirmText}
            disabled={deleting}
            autoFocus
            className="h-10 w-full rounded-lg bg-transparent px-4 text-[13px] text-foreground placeholder:text-foreground/20 focus:outline-none font-mono disabled:opacity-50"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 text-[13px] font-medium rounded-lg border transition-all duration-150 hover:border-foreground/20 disabled:opacity-30"
            style={{ borderColor: "var(--border)", background: "var(--s1)" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!isMatch || deleting}
            className="px-4 py-2 text-[13px] font-bold rounded-lg transition-all duration-150 hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
            style={{ background: isMatch ? "var(--score-low)" : "var(--s3)", color: isMatch ? "white" : "var(--foreground)" }}
          >
            {deleting ? "Deleting..." : "Delete Audit"}
          </button>
        </div>
      </div>
    </div>
  );
}
