"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Target, AlertTriangle, BarChart3, Lightbulb, User, MessageCircle,
  Plus, Share2, Link2, Link2Off, Check, Loader2, ChevronLeft, ChevronRight, ArrowRight, Lock,
  Sun, Moon,
} from "lucide-react";
import { Overview } from "./sections/overview";
import { Findings } from "./sections/findings";
import { Diagnostics } from "./sections/diagnostics";
import { Fixes } from "./sections/fixes";
import { Context } from "./sections/context";
import { SPRING_TAB, SPRING_NAV, SPRING_ENTRANCE } from "./motion";
import { ScreenshotSection } from "@/components/screenshot-section";
import { ChatWidget } from "@/components/chat-widget";
import { AnnotatedView } from "@/components/annotated-view";
import { PLAN_FEATURES } from "@/lib/types";
import { countSeverities, getTopFindings } from "./utils";
import type {
  UXAuditResult, PlanTier, HeatmapZone, CompetitorAnalysis,
  VisualAnalysis, AnnotationCoordinate,
} from "@/lib/types";

export interface ReportShellProps {
  data: UXAuditResult;
  url: string;
  onReset: () => void;
  onHumanAuditRequested: (url: string, email: string) => void;
  plan: PlanTier;
  auditId?: string;
  screenshotUrl?: string;
  heatmapZones?: HeatmapZone[];
  pageHeight?: number;
  viewportWidth?: number;
  screenshotStatus?: "loading" | "done" | "failed";
  heatmapStatus?: "loading" | "done" | "failed";
  visualAnalysis?: VisualAnalysis;
  visualAnalysisStatus?: "loading" | "done" | "failed";
  annotationCoordinates?: AnnotationCoordinate[];
  annotationStatus?: "loading" | "done" | "failed";
  competitorAnalysis?: CompetitorAnalysis;
  competitorStatus?: "loading" | "done" | "failed" | "locked";
  onManualCompetitors?: (urls: string[]) => void;
  isSharedView?: boolean;
  shareToken?: string | null;
  onToggleShare?: () => void;
  shareLoading?: boolean;
  shareCopied?: boolean;
  onCopyShareLink?: () => void;
}

/* ── Nav section definition ── */

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  badge?: number;
}

export function ReportShell(props: ReportShellProps) {
  const {
    data, url, onReset, plan, auditId,
    screenshotUrl, heatmapZones, pageHeight, viewportWidth,
    screenshotStatus, heatmapStatus, visualAnalysis, visualAnalysisStatus,
    annotationCoordinates, annotationStatus,
    competitorAnalysis, competitorStatus, onManualCompetitors,
    isSharedView, shareToken, onToggleShare, shareLoading, shareCopied, onCopyShareLink,
  } = props;

  const features = PLAN_FEATURES[plan];
  let domain = url;
  try { domain = new URL(url).hostname.replace("www.", ""); } catch {}

  const [activeNav, setActiveNav] = useState("overview");
  const [viewMode, setViewMode] = useState<"report" | "annotated">("report");
  const [annotatedVisible, setAnnotatedVisible] = useState(false);
  const canShowAnnotated = screenshotStatus === "done" && !!screenshotUrl;
  const contentRef = useRef<HTMLDivElement>(null);

  /* ── Build navigation ── */
  const severityCounts = countSeverities(data.sections);
  const totalIssues = data.sections.reduce((sum, s) => sum + s.findings.filter(f => f.type === "issue" || f.type === "warning").length, 0);
  const topFindings = getTopFindings(data.sections);

  const hasPersonas = (data.personaFeedback?.length || 0) > 0;
  const hasContext = hasPersonas || competitorAnalysis || features.competitorAnalysis;

  const navItems: NavItem[] = [
    { id: "overview", label: "Overview", icon: <Target className="h-3.5 w-3.5" />, color: "var(--brand)" },
    { id: "findings", label: "Findings", icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "var(--brand)", badge: totalIssues || undefined },
    { id: "diagnostics", label: "Diagnostics", icon: <BarChart3 className="h-3.5 w-3.5" />, color: "var(--brand)" },
    { id: "fixes", label: "Fixes", icon: <Lightbulb className="h-3.5 w-3.5" />, color: "var(--brand)", badge: (data.quickWins.length + data.strategicFixes.length) || undefined },
    ...(hasContext ? [{ id: "context", label: "Context", icon: <User className="h-3.5 w-3.5" />, color: "var(--brand)" }] : []),
    { id: "ask-ai", label: "Ask AI", icon: <MessageCircle className="h-3.5 w-3.5" />, color: "var(--brand)" },
  ];

  function handleNavigate(section: string) {
    setActiveNav(section);
    if (section === "overview") {
      setAnnotatedVisible(false);
    }
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ── Main report layout ── */
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--background)" }}>
      {/* Toolbar */}
      <Toolbar domain={domain} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar nav — desktop */}
        <nav className="hidden md:flex flex-col w-[200px] shrink-0 px-3 pt-5 pb-3 overflow-y-auto justify-between" style={{ background: "var(--background)" }}>
          {/* Section tabs + new audit at end */}
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200"
                  style={{
                    color: "var(--foreground)",
                    opacity: isActive ? 1 : 0.35,
                    background: isActive ? "var(--s1)" : "transparent",
                    fontWeight: isActive ? 600 : 500,
                  }}
                >
                  <span className="w-5 h-5 grid place-items-center shrink-0">{item.icon}</span>
                  <span className="text-[13px] flex-1">{item.label}</span>
                  {item.badge != null && item.badge > 0 && (
                    <span
                      className="text-[10px] font-semibold tabular-nums min-w-[20px] text-center px-1.5 py-0.5 rounded-lg"
                      style={{
                        background: "var(--s2)",
                        color: "var(--foreground)",
                        opacity: isActive ? 0.5 : 0.3,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* New audit */}
            <button
              onClick={onReset}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 mt-2 hover:bg-foreground/[0.03]"
              style={{ color: "var(--foreground)", opacity: 0.3 }}
            >
              <span className="w-5 h-5 grid place-items-center shrink-0"><Plus className="h-3.5 w-3.5" /></span>
              <span className="text-[13px]">New Audit</span>
            </button>
          </div>

          {/* Bottom — pill theme switch */}
          <div className="pt-4 mt-4 px-3" style={{ borderTop: "1px solid var(--border)" }}>
            <ThemeSwitch />
          </div>
        </nav>

        {/* Mobile tabs */}
        <MobileTabs items={navItems} active={activeNav} onSelect={handleNavigate} />

        {/* Content area */}
        <div ref={contentRef} data-report-content className="flex-1 overflow-y-auto p-4 md:p-6 md:rounded-tl-2xl" style={{ background: "linear-gradient(180deg, var(--s1) 0%, var(--background) 320px)" }}>
          {/* Overview tab — overview + annotated crossfade */}
          {activeNav === "overview" && (
            <div className="relative">
              {/* Overview layer */}
              <motion.div
                animate={{
                  opacity: annotatedVisible ? 0 : 1,
                  scale: annotatedVisible ? 0.98 : 1,
                  filter: annotatedVisible ? "blur(8px)" : "blur(0px)",
                  pointerEvents: annotatedVisible ? "none" as const : "auto" as const,
                }}
                transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
              >
                <Overview
                  data={data}
                  onNavigate={handleNavigate}
                  screenshotUrl={screenshotUrl}
                  shareToken={shareToken}
                  onToggleShare={onToggleShare}
                  shareLoading={shareLoading}
                  shareCopied={shareCopied}
                  onCopyShareLink={onCopyShareLink}
                  isSharedView={isSharedView}
                  onSwitchToAnnotated={canShowAnnotated ? () => setAnnotatedVisible(true) : undefined}
                />
              </motion.div>

              {/* Annotated layer — overlays on top */}
              {canShowAnnotated && (
                <motion.div
                  className="absolute inset-0 -m-4 md:-m-6"
                  animate={{
                    opacity: annotatedVisible ? 1 : 0,
                    pointerEvents: annotatedVisible ? "auto" as const : "none" as const,
                  }}
                  transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
                >
                  {annotatedVisible && (
                    <AnnotatedView
                      data={data}
                      screenshotUrl={screenshotUrl!}
                      heatmapZones={heatmapZones}
                      pageHeight={pageHeight}
                      viewportWidth={viewportWidth}
                      annotationCoordinates={annotationCoordinates}
                      onClose={() => { setAnnotatedVisible(false); contentRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }}
                    />
                  )}
                </motion.div>
              )}
            </div>
          )}

          {/* Other tabs — normal AnimatePresence */}
          {activeNav !== "overview" && (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeNav}
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -6, filter: "blur(2px)" }}
                transition={{
                  ...SPRING_TAB,
                  opacity: { duration: 0.15 },
                  filter: { duration: 0.2 },
                }}
              >
                {activeNav === "ask-ai" && (
                  features.aiChat && auditId && !isSharedView ? (
                    <div className="h-[calc(100vh-120px)] -m-4 md:-m-6">
                      <ChatWidget auditId={auditId} plan={plan} inline />
                    </div>
                  ) : (
                    <AIChatUpsell />
                  )
                )}
                {activeNav === "findings" && <Findings data={data} />}
                {activeNav === "diagnostics" && (
                  <Diagnostics
                    data={data}
                    screenshotUrl={screenshotUrl}
                    heatmapZones={heatmapZones}
                    pageHeight={pageHeight}
                    viewportWidth={viewportWidth}
                    screenshotStatus={screenshotStatus}
                    heatmapStatus={heatmapStatus}
                    visualAnalysis={visualAnalysis}
                    visualAnalysisStatus={visualAnalysisStatus}
                  />
                )}
                {activeNav === "fixes" && <Fixes data={data} plan={plan} />}
                {activeNav === "context" && (
                  <Context
                    data={data}
                    plan={plan}
                    competitorAnalysis={competitorAnalysis}
                    competitorStatus={competitorStatus}
                    onManualCompetitors={onManualCompetitors}
                    isSharedView={isSharedView}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

    </div>
  );
}

/* ══════════════════════════════════
   Toolbar
   ══════════════════════════════════ */

function Toolbar({ domain }: { domain: string }) {
  return (
    <div className="w-full h-12 px-4 flex items-center shrink-0" style={{ background: "var(--background)" }}>
      <div className="flex items-center gap-2.5">
        <Link href="/dashboard" className="shrink-0 transition-opacity hover:opacity-70" aria-label="Back to dashboard">
          <svg width="20" height="20" viewBox="0 0 634 617" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path fillRule="evenodd" clipRule="evenodd" d="M469.152 100.312L380.036 148.394L440.22 149.221C471.143 149.645 501.374 158.434 527.702 174.653L633 239.519L573.18 336.563L486.965 283.453L516.343 335.97C531.437 362.955 538.939 393.522 538.053 424.426L534.508 548.019L420.528 544.752L423.431 443.557L392.624 495.248C376.795 521.809 354.065 543.588 326.849 558.273L218.008 617L163.848 516.688L252.964 468.604L192.781 467.778C161.857 467.354 131.625 458.566 105.296 442.346L0 377.481L59.8199 280.436L146.032 333.546L116.656 281.03C101.562 254.045 94.06 223.478 94.9464 192.574L98.4916 68.981L212.472 72.2475L209.568 173.442L240.376 121.75C256.205 95.1905 278.934 73.4123 306.15 58.7279L414.992 0L469.152 100.312ZM276.138 284.453C267.545 298.872 267.299 316.781 275.494 331.43C283.685 346.073 299.078 355.235 315.855 355.465C332.632 355.695 348.271 346.959 356.861 332.546C365.454 318.127 365.7 300.218 357.506 285.569C349.314 270.925 333.921 261.763 317.144 261.533C300.367 261.303 284.728 270.04 276.138 284.453Z" fill="#4C2CFF" />
          </svg>
        </Link>
        <span className="w-px h-5 shrink-0" style={{ background: "var(--border)" }} />
        <span className="text-[12px] font-medium text-foreground/40">{domain}</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   Mobile Tabs
   ══════════════════════════════════ */

function MobileTabs({ items, active, onSelect }: { items: NavItem[]; active: string; onSelect: (id: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(dir: "left" | "right") {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -120 : 120, behavior: "smooth" });
  }

  return (
    <div className="md:hidden flex items-center w-full shrink-0" style={{ background: "var(--background)", boxShadow: "0 1px 0 var(--border)" }}>
      <button onClick={() => scroll("left")} className="shrink-0 p-1.5 text-foreground/25 hover:text-foreground/50 transition-colors">
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      <div ref={scrollRef} className="flex-1 overflow-x-auto flex items-center gap-1 py-2 px-1 no-scrollbar">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg whitespace-nowrap transition-all shrink-0"
            style={{
              background: active === item.id ? item.color : "var(--s2)",
              color: active === item.id ? "white" : "var(--foreground)",
              opacity: active === item.id ? 1 : 0.5,
            }}
          >
            {item.icon}
            {item.label}
            {item.badge && item.badge > 0 && (
              <span className="text-[9px] font-bold px-1 py-0 rounded" style={{ background: active === item.id ? "rgba(255,255,255,0.2)" : `${item.color}12`, color: active === item.id ? "white" : item.color }}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>
      <button onClick={() => scroll("right")} className="shrink-0 p-1.5 text-foreground/25 hover:text-foreground/50 transition-colors">
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ══════════════════════════════════
   AI Chat Upsell (free/starter users)
   ══════════════════════════════════ */

function AIChatUpsell() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-12 h-12 rounded-2xl grid place-items-center mb-4" style={{ background: "var(--s2)" }}>
        <Lock className="h-5 w-5 text-foreground/25" />
      </div>
      <h3 className="text-[15px] font-semibold text-foreground/60 mb-2">AI Chat Assistant</h3>
      <p className="text-[12px] text-foreground/35 leading-relaxed max-w-[320px] mb-6">
        Ask follow-up questions about your audit, get implementation details, or brainstorm copy alternatives. The AI knows your page inside out.
      </p>
      <Link
        href="/pricing"
        className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold transition-all hover:opacity-90"
        style={{ background: "var(--brand)", color: "white" }}
      >
        Upgrade to Pro <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

/* ══════════════════════════════════
   Theme pill switch
   ══════════════════════════════════ */

function ThemeSwitch() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = useCallback(() => {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("uxlens-theme", next ? "dark" : "light");
    setIsDark(next);
  }, [isDark]);

  return (
    <button
      onClick={toggle}
      className="relative w-full h-[32px] rounded-full flex items-center px-1 transition-colors duration-300"
      style={{ background: "var(--s2)" }}
    >
      {/* Sliding pill */}
      <motion.div
        className="absolute h-[26px] w-[calc(50%-2px)] rounded-full"
        style={{ background: "var(--s1)", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
        animate={{ x: isDark ? "calc(100% + 2px)" : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
      />
      {/* Labels */}
      <span className="relative z-10 flex-1 flex items-center justify-center gap-1.5">
        <Sun className="h-3 w-3" style={{ opacity: isDark ? 0.2 : 0.5 }} />
        <span className="text-[10px] font-medium" style={{ opacity: isDark ? 0.2 : 0.5 }}>Light</span>
      </span>
      <span className="relative z-10 flex-1 flex items-center justify-center gap-1.5">
        <Moon className="h-3 w-3" style={{ opacity: isDark ? 0.5 : 0.2 }} />
        <span className="text-[10px] font-medium" style={{ opacity: isDark ? 0.5 : 0.2 }}>Dark</span>
      </span>
    </button>
  );
}
