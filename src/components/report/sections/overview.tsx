"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Share2, Check, Link2, Link2Off, Loader2, Search } from "lucide-react";
import { ScoreRing } from "../charts/score-ring";
import { SPRING_HERO, SPRING_CARD } from "../motion";
import { CATEGORY_DEFS, countSeverities, getTopFindings } from "../utils";
import type { UXAuditResult } from "@/lib/types";

interface OverviewProps {
  data: UXAuditResult;
  onNavigate: (section: string) => void;
  screenshotUrl?: string;
  shareToken?: string | null;
  onToggleShare?: () => void;
  shareLoading?: boolean;
  shareCopied?: boolean;
  onCopyShareLink?: () => void;
  isSharedView?: boolean;
  onSwitchToAnnotated?: () => void;
}

export function Overview({
  data, onNavigate, screenshotUrl,
  shareToken, onToggleShare, shareLoading, shareCopied, onCopyShareLink, isSharedView,
  onSwitchToAnnotated,
}: OverviewProps) {
  const [screenshotHover, setScreenshotHover] = useState(false);
  const topFindings = getTopFindings(data.sections, 8);
  const severityCounts = countSeverities(data.sections);
  const totalIssues = Object.values(severityCounts).reduce((a, b) => a + b, 0);

  const raw = data.executiveSummary || "";
  const dotIdx = raw.indexOf(". ");
  const verdict = dotIdx > 0 ? raw.slice(0, dotIdx + 1) : raw.slice(0, 140);

  const cats = CATEGORY_DEFS.map(cat => ({
    ...cat,
    data: data.categories[cat.key as keyof typeof data.categories],
  }));
  const worstCat = [...cats].sort((a, b) => a.data.score - b.data.score)[0];

  return (
    <div className="relative min-h-[700px]">

      {/* ══════════════════════════════════════
          LEFT — Content column
          ══════════════════════════════════════ */}
      <div className="relative z-10 md:max-w-[50%] flex flex-col gap-10">

        {/* Eyebrow + Score hero */}
        <div className="flex flex-col gap-6">
          {data.pageTypeLabel && (
            <motion.p
              className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/25"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05 }}
            >
              {data.pageTypeLabel}
            </motion.p>
          )}

          <motion.div
            className="flex items-center gap-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, ...SPRING_HERO }}
          >
            <ScoreRing score={data.overallScore} size={84} strokeWidth={6} sublabel={data.grade} delay={0.15} />
            <div className="flex-1 min-w-0">
              <p className="text-[15px] text-foreground/70 leading-[1.55]" style={{ textWrap: "pretty" }}>{verdict}</p>
              <div className="flex items-center gap-2 mt-2.5 text-[11px] text-foreground/35 tabular-nums">
                <span className="font-medium text-foreground/50">{totalIssues}</span>
                <span>issue{totalIssues !== 1 ? "s" : ""}</span>
                {worstCat && (
                  <>
                    <span className="w-[3px] h-[3px] rounded-full bg-foreground/15" />
                    <span>Weakest:</span>
                    <span className="text-foreground/50 font-medium">{worstCat.label}</span>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            {onToggleShare && !isSharedView && (
              shareToken ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={onCopyShareLink}
                    className="inline-flex items-center gap-2 text-[12px] font-medium px-3.5 py-2 rounded-xl transition-[opacity,background-color] duration-150 hover:opacity-90"
                    style={{ background: "var(--brand)", color: "white" }}
                  >
                    {shareCopied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                    {shareCopied ? "Copied" : "Share"}
                  </button>
                  <button
                    onClick={onToggleShare}
                    disabled={shareLoading}
                    className="inline-flex items-center p-2 rounded-xl text-foreground/30 hover:text-foreground/60 hover:bg-foreground/[0.04] transition-colors duration-150"
                    aria-label="Revoke share link"
                  >
                    {shareLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2Off className="h-3.5 w-3.5" />}
                  </button>
                </div>
              ) : (
                <button
                  onClick={onToggleShare}
                  disabled={shareLoading}
                  className="inline-flex items-center gap-2 text-[12px] font-medium px-3.5 py-2 rounded-xl transition-[opacity,background-color] duration-150 hover:opacity-90"
                  style={{ background: "var(--brand)", color: "white" }}
                >
                  {shareLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
                  Share
                </button>
              )
            )}
            <button
              onClick={() => onNavigate("findings")}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-foreground/35 hover:text-foreground/65 px-3 py-2 rounded-xl hover:bg-foreground/[0.03] transition-colors duration-150"
            >
              All findings <ArrowRight className="h-3 w-3" />
            </button>
          </motion.div>
        </div>

        {/* Category rings */}
        <motion.div
          className="flex flex-col gap-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, ...SPRING_CARD }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/25">Categories</p>
          <div className="grid grid-cols-3 gap-x-4 gap-y-4">
            {cats.map((cat, i) => (
              <motion.button
                key={cat.key}
                className="flex items-center gap-3 text-left group rounded-xl -mx-2 px-2 py-1.5 hover:bg-foreground/[0.03] transition-colors duration-150"
                onClick={() => onNavigate("diagnostics")}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.32 + i * 0.04, ...SPRING_CARD }}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <ScoreRing score={cat.data.score} size={36} strokeWidth={3} delay={0.35 + i * 0.05} />
                <span className="text-[11.5px] text-foreground/55 group-hover:text-foreground/75 transition-colors leading-[1.3] flex-1">
                  {cat.label}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Top fixes */}
        {topFindings.length > 0 && (
          <motion.div
            className="flex flex-col gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, ...SPRING_CARD }}
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/25">Top fixes</p>
              <span className="text-[10px] tabular-nums text-foreground/25 font-medium">{topFindings.length}</span>
            </div>
            <div className="flex flex-col gap-1">
              {topFindings.map((f, i) => {
                const sev = f.severity || f.impact;
                const dotColor = sev === "critical" || sev === "high" ? "var(--score-low)" : sev === "medium" ? "var(--score-mid)" : "var(--score-high)";
                return (
                  <motion.button
                    key={i}
                    onClick={() => onNavigate("findings")}
                    className="w-full flex items-center gap-3 py-2.5 px-3.5 text-left group rounded-xl"
                    style={{ background: "var(--s2)" }}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 + i * 0.025, duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                    whileHover={{ y: -2, transition: { type: "spring", stiffness: 400, damping: 28 } }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dotColor }} />
                    <span className="text-[12.5px] text-foreground/60 group-hover:text-foreground/85 transition-colors flex-1 truncate">{f.title}</span>
                    {f.estimatedConversionLift && (
                      <span className="text-[10.5px] font-semibold tabular-nums shrink-0" style={{ color: "var(--score-high)" }}>
                        +{f.estimatedConversionLift}
                      </span>
                    )}
                    <ArrowRight className="h-3 w-3 text-foreground/25 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </motion.button>
                );
              })}
            </div>
            {totalIssues > topFindings.length && (
              <button
                onClick={() => onNavigate("findings")}
                className="self-start inline-flex items-center gap-1.5 text-[11.5px] font-semibold transition-opacity hover:opacity-70"
                style={{ color: "var(--brand)" }}
              >
                View all {totalIssues} findings <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* ══════════════════════════════════════
          RIGHT — Screenshot preview (untouched)
          ══════════════════════════════════════ */}
      {screenshotUrl && (
        <motion.div
          className="hidden md:block absolute top-0 bottom-0 right-[-24px] w-[46%]"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, ...SPRING_CARD }}
        >
          <div
            className="relative w-full h-full rounded-l-2xl overflow-hidden cursor-pointer flex flex-col"
            style={{
              boxShadow: "-4px 0 16px rgba(0,0,0,0.06), -12px 0 32px rgba(0,0,0,0.04), 0 0 0 1px var(--border)",
            }}
            onMouseEnter={() => setScreenshotHover(true)}
            onMouseLeave={() => setScreenshotHover(false)}
            onClick={onSwitchToAnnotated}
          >
            {/* Browser chrome */}
            <div className="flex items-center gap-1.5 px-3.5 py-2 shrink-0" style={{ background: "var(--s2)" }}>
              <span className="w-[6px] h-[6px] rounded-full" style={{ background: "var(--foreground)", opacity: 0.08 }} />
              <span className="w-[6px] h-[6px] rounded-full" style={{ background: "var(--foreground)", opacity: 0.08 }} />
              <span className="w-[6px] h-[6px] rounded-full" style={{ background: "var(--foreground)", opacity: 0.08 }} />
              <div className="flex-1 mx-2 h-[18px] rounded-md flex items-center px-2.5" style={{ background: "var(--s3)" }}>
                <span className="text-[8px] text-foreground/10 truncate font-mono">{data.pageTypeLabel || "Page"}</span>
              </div>
            </div>
            {/* Screenshot */}
            <div className="flex-1 relative overflow-hidden" style={{ background: "var(--s3)" }}>
              <motion.img
                layoutId="audit-screenshot"
                src={screenshotUrl}
                alt="Audited page"
                className="absolute inset-0 w-full object-cover object-left-top"
                style={{ height: 800 }}
                transition={{ layout: { type: "spring", stiffness: 200, damping: 0.8 * 2 * Math.sqrt(200) } }}
              />
            </div>
            {/* Hover overlay */}
            <motion.div
              className="absolute inset-0 flex items-center pointer-events-none z-10 pl-8"
              animate={{ opacity: screenshotHover ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              style={{
                background: "linear-gradient(90deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 40%, transparent 70%)",
              }}
            >
              <div className="flex items-center gap-2 text-white/80">
                <Search className="h-4 w-4" />
                <span className="text-[13px] font-medium">Inspect</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
