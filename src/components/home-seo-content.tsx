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
} from "lucide-react";

const STEPS = [
  {
    num: "01",
    title: "Paste any website URL",
    desc: "Enter any landing page or website URL into the UXLens analysis tool. No account creation required — your first audit is completely free. Our AI instantly begins capturing and processing your page.",
  },
  {
    num: "02",
    title: "AI runs an instant 9-layer audit",
    desc: "Our diagnostic engine analyzes every reason your page might fail to convert visitors into customers. It examines conversion architecture, trust signals, confusion patterns, cognitive load, and five additional critical UX layers — all in seconds.",
  },
  {
    num: "03",
    title: "Get a full analysis with actionable fixes",
    desc: "Receive a prioritized website analysis report with specific, implementable recommendations for every issue found. Each fix includes what to change and why — not generic optimization advice, but fixes tailored to your page.",
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
    desc: "Find every conversion issue before your next launch. Use our free AI audit tool to instantly analyze your landing page and fix what fails to convert — before spending on ads.",
  },
  {
    icon: PenTool,
    title: "UX Designers & Freelancers",
    desc: "Run a professional website analysis for every client project. UXLens gives you an instant, structured UX audit that saves hours of manual review and strengthens every design recommendation.",
  },
  {
    icon: Briefcase,
    title: "Marketing Teams & Agencies",
    desc: "Audit landing pages at scale with our AI-powered analysis tool. Find conversion killers across your entire website portfolio and deliver measurable improvements to your clients.",
  },
  {
    icon: Users,
    title: "Product Managers",
    desc: "Get data-driven UX insights without waiting for a full research cycle. Our free website audit tool helps you identify and prioritize the page improvements that matter most for conversion.",
  },
];

const FAQS = [
  {
    q: "What is a UX audit and why does it matter for conversion?",
    a: "A UX audit is a systematic evaluation of your website's user experience that helps you find every reason visitors fail to convert. It identifies usability issues, conversion barriers, trust gaps, and areas where users struggle or abandon your page. Regular UX audits using a tool like UXLens help improve conversion rates, reduce bounce rates, and ensure your landing page effectively communicates your value proposition to turn visitors into customers.",
  },
  {
    q: "How does the AI-powered website analysis work?",
    a: "UXLens uses a multi-stage AI diagnostic algorithm to deliver instant website analysis. It captures your page, runs it through 9 specialized audit layers, executes a self-critique loop to catch contradictions, and synthesizes actionable recommendations. The AI engine evaluates everything from conversion architecture to trust signals to cognitive load — delivering a comprehensive, free UX analysis report in seconds, not days.",
  },
  {
    q: "Is UXLens free to use as a UX audit tool?",
    a: "Yes! The free plan includes 5 website audits per month. You get your overall UX score, 6 category breakdowns, top 3 conversion killers, and 2 quick wins — completely free. For deeper analysis including detailed section-by-section audits, the full trust signal matrix, AI hero rewrites, and strategic fixes, explore our affordable paid plans.",
  },
  {
    q: "What makes UXLens different from other website audit tools?",
    a: "Unlike basic screenshot analyzers or generic checklist tools, UXLens runs a structured 9-layer diagnostic with built-in self-critique and contradiction detection powered by AI. Each audit delivers specific, actionable fixes tailored to your page — not generic optimization advice. The tool helps you find every reason your landing page fails to convert, from trust signal gaps to cognitive load issues, with instant analysis results.",
  },
  {
    q: "Can I audit any website or landing page?",
    a: "Yes, UXLens can analyze any publicly accessible website URL. Whether it is a SaaS landing page, an e-commerce product page, a portfolio website, or a marketing campaign page — our AI audit tool provides a thorough analysis of every page you submit. Simply paste your URL and receive your full UX diagnostic report instantly.",
  },
];

export function HomeSEOContent() {
  return (
    <div className="relative z-[1]">
      {/* How It Works */}
      <section className="max-w-[960px] mx-auto px-7 pt-8 pb-16">
        <div className="flex items-center gap-4 mb-10 text-foreground/15 text-[9px] uppercase tracking-[2px]">
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          How it works
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {STEPS.map((step) => (
            <div key={step.num} className="space-y-3">
              <span
                className="inline-block text-[11px] font-mono font-bold px-2 py-0.5 rounded"
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

      {/* 9 Diagnostic Layers */}
      <section className="max-w-[960px] mx-auto px-7 pb-16">
        <div className="text-center mb-10">
          <h2 className="text-[clamp(22px,3vw,32px)] font-bold tracking-[-0.5px] text-foreground">
            9 layers of instant UX analysis
          </h2>
          <p className="mt-2 text-[12px] text-foreground/40 max-w-lg mx-auto leading-relaxed">
            Every free audit runs your landing page through nine diagnostic layers — the most comprehensive AI-powered website analysis tool available. Find every reason your page fails to convert.
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
              <p className="text-[11px] text-foreground/35 leading-relaxed">
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
            Whether you are a solo founder or an agency managing dozens of websites, UXLens is the free AI audit tool that helps you find and fix conversion issues instantly.
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
            Run your free AI-powered UX audit now — paste any website URL and get your full instant analysis report in under 30 seconds.
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
          <p className="text-[11px] text-foreground/25 leading-relaxed text-center">
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
