"use client";

import Link from "next/link";
import {
  Layers,
  ShieldCheck,
  Brain,
  Gauge,
  MousePointerClick,
  ScanEye,
  LayoutGrid,
  FileText,
  Smartphone,
  ArrowRight,
  Target,
  Users,
  Briefcase,
  PenTool,
  Camera,
  BarChart3,
  MessageSquare,
  Download,
  History,
  LogIn,
} from "lucide-react";

const STEPS = [
  {
    num: "01",
    title: "Paste any website URL",
    desc: "Enter any landing page or website URL into the UXLens analysis tool. No account needed for your first audit — or sign in with Google or GitHub to save every report to your personal dashboard.",
  },
  {
    num: "02",
    title: "AI runs a 9-layer audit with screenshot",
    desc: "Our diagnostic engine captures a full-page screenshot with attention heatmap, then analyzes every reason your page might fail to convert — examining conversion architecture, trust signals, confusion patterns, cognitive load, and five additional critical UX layers.",
  },
  {
    num: "03",
    title: "Get your full report with fixes",
    desc: "Receive a prioritized report with heatmap visualization, conversion killers, trust matrix, and actionable recommendations. Export as PDF, discuss findings with the AI chat assistant, or revisit any audit from your dashboard.",
  },
];

const PLATFORM_FEATURES = [
  {
    icon: Camera,
    title: "Screenshot + Attention Heatmap",
    desc: "Every audit captures a full-page screenshot overlaid with an AI-generated attention heatmap. See exactly where visitors focus — based on F-pattern analysis, CTA placement, and visual hierarchy.",
    tier: "All plans",
  },
  {
    icon: History,
    title: "Audit History Dashboard",
    desc: "Every audit you run is saved to your personal dashboard. Revisit past reports anytime, track improvements over time, and compare audits across different pages.",
    tier: "All plans",
  },
  {
    icon: BarChart3,
    title: "Strategic Fixes & Hero Rewrite",
    desc: "Go beyond diagnostics. Get strategic fixes prioritized by impact, and an AI-optimized rewrite of your hero section — headline, subheadline, and CTA — ready to copy and deploy.",
    tier: "Starter+",
  },
  {
    icon: Download,
    title: "PDF Export",
    desc: "Download your complete audit report as a professionally formatted PDF. Share with your team, attach to client deliverables, or archive for your records.",
    tier: "Starter+",
  },
  {
    icon: MessageSquare,
    title: "AI Chat Assistant",
    desc: "Discuss your audit findings in real-time with an AI assistant that knows your page inside out. Ask follow-up questions, get implementation guidance, or brainstorm improvements.",
    tier: "Pro+",
  },
  {
    icon: LogIn,
    title: "Google & GitHub Sign-In",
    desc: "Create your account in seconds with Google or GitHub. All your audits, chat history, and exports are tied to your account and accessible from any device.",
    tier: "All plans",
  },
];

const LAYERS = [
  { icon: MousePointerClick, title: "Conversion Architecture", desc: "Find every element that guides or blocks visitors from taking action. This analysis identifies drop-off points, friction areas, and conversion path failures on your page." },
  { icon: ShieldCheck, title: "Trust Signal Matrix", desc: "Audit the credibility indicators that build or break user confidence. From social proof to security badges, find reasons visitors hesitate to convert." },
  { icon: ScanEye, title: "Confusion Detection", desc: "Detect mixed signals, contradictory messaging, and unclear navigation that creates cognitive friction and causes user hesitation on your website." },
  { icon: Brain, title: "Cognitive Load Score", desc: "Measure the mental effort required to process your page content and make a decision. High cognitive load is a top reason pages fail to convert." },
  { icon: Layers, title: "Hero Effectiveness", desc: "Analyze first-screen impact, value proposition clarity, and above-fold engagement. The hero section is where most conversion failures begin." },
  { icon: LayoutGrid, title: "Visual Hierarchy", desc: "Evaluate layout flow, attention distribution, and information architecture patterns across your entire website page design." },
  { icon: Gauge, title: "CTA Optimization", desc: "Audit call-to-action placement, copy strength, and conversion potential. A weak CTA is one of the top reasons landing pages fail to convert." },
  { icon: FileText, title: "Content Clarity", desc: "Analyze message coherence, readability, and alignment between your promise and proof. Unclear content is a conversion killer on any website." },
  { icon: Smartphone, title: "Mobile Experience", desc: "Evaluate responsive design quality, touch target sizing, and mobile-specific UX issues that cause visitors to abandon your page on mobile devices." },
];

const USE_CASES = [
  {
    icon: Target,
    title: "Startup Founders",
    desc: "Find every conversion issue before your next launch. Get a screenshot heatmap showing where visitors focus, pinpoint conversion killers, and fix what fails to convert — before spending on ads.",
  },
  {
    icon: PenTool,
    title: "UX Designers & Freelancers",
    desc: "Run professional UX audits for every client project. Export polished PDF reports, discuss findings with the AI assistant, and save every audit to your dashboard for easy access.",
  },
  {
    icon: Briefcase,
    title: "Marketing Teams & Agencies",
    desc: "Audit landing pages at scale with your team. Track all audits in a shared dashboard, export PDF reports for client presentations, and use AI chat to brainstorm optimization strategies.",
  },
  {
    icon: Users,
    title: "Product Managers",
    desc: "Get data-driven UX insights without waiting for a full research cycle. Visualize attention patterns with heatmaps, identify high-impact fixes, and share PDF reports with stakeholders.",
  },
];

const FAQS = [
  {
    q: "What is a UX audit and why does it matter for conversion?",
    a: "A UX audit is a systematic evaluation of your website's user experience that helps you find every reason visitors fail to convert. It identifies usability issues, conversion barriers, trust gaps, and areas where users struggle or abandon your page. UXLens automates this with a 9-layer AI diagnostic, attention heatmap, and actionable recommendations — delivering results in seconds rather than days.",
  },
  {
    q: "How does the AI-powered website analysis work?",
    a: "UXLens captures a full-page screenshot of your URL, generates an attention heatmap from the page layout, then runs the content through 9 specialized audit layers with a self-critique loop to catch contradictions. The result is a comprehensive report with scores, conversion killers, trust matrix, confusion map, and AI-optimized copy suggestions — all generated in under 30 seconds.",
  },
  {
    q: "Is UXLens free to use as a UX audit tool?",
    a: "Yes! The free plan includes 5 audits per month with full scores, screenshot heatmaps, all conversion killers, quick wins, trust matrix, confusion map, and a personal audit dashboard. Paid plans unlock strategic fixes, AI hero rewrites, PDF export, and an AI chat assistant for discussing your audit findings.",
  },
  {
    q: "What does the attention heatmap show?",
    a: "The attention heatmap overlays your page screenshot with color-coded zones showing where visitors are most likely to focus. It uses F-pattern reading analysis, CTA detection, headline placement, and visual weight to predict attention distribution — helping you see if your key messages and buttons are in the right spots.",
  },
  {
    q: "Can I save and revisit my audit reports?",
    a: "Yes. Sign in with Google or GitHub and every audit is automatically saved to your personal dashboard. You can revisit any past report, view the full analysis with heatmap, and track how your pages improve over time. Paid plans also let you export any report as a PDF.",
  },
  {
    q: "What makes UXLens different from other website audit tools?",
    a: "UXLens combines visual analysis (screenshot heatmaps) with a structured 9-layer AI diagnostic and built-in self-critique. Each audit delivers specific fixes tailored to your page, not generic advice. Plus, with a dashboard, PDF export, and AI chat assistant, it is a complete UX audit platform rather than a one-off analysis tool.",
  },
];

export function HomeSEOContent() {
  return (
    <div className="relative z-[1]">
      {/* How It Works */}
      <section className="max-w-[960px] mx-auto px-7 pt-8 pb-16">
        <div className="flex items-center gap-4 mb-10 text-foreground/15 text-[12px] uppercase tracking-[2px]">
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          How it works
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {STEPS.map((step) => (
            <div key={step.num} className="space-y-3">
              <span
                className="inline-block text-[12px] font-mono font-bold px-2 py-0.5 rounded"
                style={{ background: "var(--brand-dim)", color: "var(--brand)" }}
              >
                {step.num}
              </span>
              <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
                {step.title}
              </h3>
              <p className="text-[12px] text-foreground/40 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Features */}
      <section className="max-w-[960px] mx-auto px-7 pb-16">
        <div className="text-center mb-10">
          <h2 className="text-[clamp(22px,3vw,32px)] font-bold tracking-[-0.5px] text-foreground">
            A complete UX audit platform
          </h2>
          <p className="mt-2 text-[12px] text-foreground/40 max-w-lg mx-auto leading-relaxed">
            More than a one-off analysis tool. Screenshot heatmaps, a personal dashboard, PDF reports, and an AI chat assistant to discuss your findings.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PLATFORM_FEATURES.map((feat) => (
            <div
              key={feat.title}
              className="rounded-xl border p-5 transition-all duration-200 hover:shadow-elevation-1"
              style={{ borderColor: "var(--border)", background: "var(--s1)" }}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <feat.icon className="h-4 w-4" style={{ color: "var(--brand)" }} />
                <span
                  className="text-[12px] font-mono px-1.5 py-0.5 rounded tracking-wide"
                  style={{ color: "var(--brand)", background: "var(--brand-dim)", fontSize: "10px" }}
                >
                  {feat.tier}
                </span>
              </div>
              <h3 className="text-[13px] font-semibold text-foreground mb-1.5">
                {feat.title}
              </h3>
              <p className="text-[12px] text-foreground/35 leading-relaxed">
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 9 Diagnostic Layers */}
      <section className="max-w-[960px] mx-auto px-7 pb-16">
        <div className="text-center mb-10">
          <h2 className="text-[clamp(22px,3vw,32px)] font-bold tracking-[-0.5px] text-foreground">
            9 layers of instant UX analysis
          </h2>
          <p className="mt-2 text-[12px] text-foreground/40 max-w-lg mx-auto leading-relaxed">
            Every audit runs your page through nine diagnostic layers — the most comprehensive AI-powered website analysis tool available. Find every reason your page fails to convert.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {LAYERS.map((layer) => (
            <div
              key={layer.title}
              className="rounded-xl border p-4 transition-all duration-200 hover:shadow-elevation-1"
              style={{ borderColor: "var(--border)", background: "var(--s1)" }}
            >
              <layer.icon className="h-4 w-4 mb-3" style={{ color: "var(--brand)" }} />
              <h3 className="text-[13px] font-semibold text-foreground mb-1">
                {layer.title}
              </h3>
              <p className="text-[12px] text-foreground/35 leading-relaxed">
                {layer.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Who is it for */}
      <section className="max-w-[960px] mx-auto px-7 pb-16">
        <div className="text-center mb-10">
          <h2 className="text-[clamp(22px,3vw,32px)] font-bold tracking-[-0.5px] text-foreground">
            Built for teams that ship
          </h2>
          <p className="mt-2 text-[12px] text-foreground/40 max-w-lg mx-auto leading-relaxed">
            Whether you are a solo founder or an agency managing dozens of websites, UXLens gives you heatmaps, AI diagnostics, and a dashboard to find and fix conversion issues fast.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {USE_CASES.map((uc) => (
            <div
              key={uc.title}
              className="rounded-xl border p-5 transition-all duration-200 hover:shadow-elevation-1"
              style={{ borderColor: "var(--border)", background: "var(--s1)" }}
            >
              <uc.icon className="h-4 w-4 mb-3" style={{ color: "var(--brand)" }} />
              <h3 className="text-[14px] font-semibold text-foreground mb-1.5">
                {uc.title}
              </h3>
              <p className="text-[12px] text-foreground/35 leading-relaxed">
                {uc.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="max-w-[960px] mx-auto px-7 pb-16">
        <div
          className="rounded-xl border p-8 text-center"
          style={{ background: "var(--brand-dim)", borderColor: "var(--brand-glow)" }}
        >
          <h2 className="text-[20px] font-bold tracking-tight text-foreground mb-2">
            Ready to find every reason your page fails to convert?
          </h2>
          <p className="text-[12px] text-foreground/40 mb-5 max-w-md mx-auto leading-relaxed">
            Run your AI-powered UX audit now — get a screenshot heatmap, 9-layer diagnostic, and actionable fixes in under 30 seconds.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-[13px] font-bold transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
            style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
          >
            Start Free Website Audit
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-[960px] mx-auto px-7 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-[clamp(22px,3vw,32px)] font-bold tracking-[-0.5px] text-foreground">
            Frequently asked questions
          </h2>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {FAQS.map((faq) => (
            <div key={faq.q}>
              <h3 className="text-[14px] font-semibold text-foreground mb-2">
                {faq.q}
              </h3>
              <p className="text-[12px] text-foreground/40 leading-relaxed">
                {faq.a}
                {faq.q.includes("free") && (
                  <>
                    {" "}
                    <Link
                      href="/pricing"
                      className="underline underline-offset-2 hover:text-foreground/60 transition-colors"
                    >
                      View pricing plans
                    </Link>
                  </>
                )}
              </p>
            </div>
          ))}
        </div>

        {/* Additional context + external link for SEO */}
        <div className="max-w-2xl mx-auto mt-10 pt-8" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-[12px] text-foreground/25 leading-relaxed text-center">
            UXLens applies{" "}
            <a
              href="https://www.nngroup.com/articles/ten-usability-heuristics/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground/40 transition-colors"
            >
              established usability heuristics
            </a>{" "}
            through AI-powered analysis to help you build better websites.{" "}
            <Link
              href="/pricing"
              className="underline underline-offset-2 hover:text-foreground/40 transition-colors"
            >
              Compare plans
            </Link>{" "}
            or{" "}
            <Link
              href="/"
              className="underline underline-offset-2 hover:text-foreground/40 transition-colors"
            >
              start your free website audit
            </Link>{" "}
            today.
          </p>
        </div>
      </section>
    </div>
  );
}
