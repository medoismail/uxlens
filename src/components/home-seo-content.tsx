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
} from "lucide-react";

const STEPS = [
  {
    num: "01",
    title: "Paste your URL",
    desc: "Enter any landing page or website URL into the UXLens analyzer. No signup required — your first audit is completely free.",
  },
  {
    num: "02",
    title: "AI runs a 9-layer audit",
    desc: "Our diagnostic engine captures your page and analyzes conversion architecture, trust signals, confusion patterns, cognitive load, and five more critical UX layers.",
  },
  {
    num: "03",
    title: "Get actionable fixes",
    desc: "Receive a prioritized report with specific, implementable recommendations for every issue found — not generic advice, but fixes tailored to your page.",
  },
];

const LAYERS = [
  { icon: MousePointerClick, title: "Conversion Architecture", desc: "How well your page guides visitors toward action and reduces drop-off" },
  { icon: ShieldCheck, title: "Trust Signal Matrix", desc: "Credibility indicators that build or break user confidence and buying intent" },
  { icon: ScanEye, title: "Confusion Detection", desc: "Elements creating cognitive friction, mixed signals, and user hesitation" },
  { icon: Brain, title: "Cognitive Load Score", desc: "Mental effort required to process page content and make a decision" },
  { icon: Layers, title: "Hero Effectiveness", desc: "First-screen impact, value proposition clarity, and above-fold engagement" },
  { icon: LayoutGrid, title: "Visual Hierarchy", desc: "Layout flow, attention distribution, and information architecture patterns" },
  { icon: Gauge, title: "CTA Optimization", desc: "Call-to-action placement, copy strength, and conversion potential analysis" },
  { icon: FileText, title: "Content Clarity", desc: "Message coherence, readability, and alignment between promise and proof" },
  { icon: Smartphone, title: "Mobile Experience", desc: "Responsive design quality, touch interactions, and mobile-specific UX issues" },
];

const FAQS = [
  {
    q: "What is a UX audit and why does it matter?",
    a: "A UX audit is a systematic evaluation of your website's user experience. It identifies usability issues, conversion barriers, and areas where visitors struggle or abandon your page. Regular UX audits help improve conversion rates, reduce bounce rates, and ensure your landing page effectively communicates your value proposition.",
  },
  {
    q: "How does the AI-powered analysis work?",
    a: "UXLens uses a multi-stage diagnostic algorithm that captures your page, analyzes it through 9 specialized layers, runs a self-critique loop to catch contradictions, and synthesizes actionable recommendations. The engine evaluates everything from conversion architecture to trust signals to cognitive load — delivering a comprehensive website analysis in seconds.",
  },
  {
    q: "Is UXLens free to use?",
    a: "Yes! The free plan includes 5 website audits per month. You get your overall UX score, 6 category breakdowns, top 3 conversion killers, and 2 quick wins. For deeper analysis including detailed section audits, trust signal matrix, AI hero rewrites, and strategic fixes, explore our paid plans.",
  },
  {
    q: "What makes UXLens different from other website audit tools?",
    a: "Unlike basic screenshot analyzers or generic checklist tools, UXLens runs a structured 9-layer diagnostic with built-in self-critique and contradiction detection. Each audit delivers specific, actionable fixes tailored to your page — not generic optimization advice that applies to any website.",
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
            9 layers of UX analysis
          </h2>
          <p className="mt-2 text-[12px] text-foreground/40 max-w-md mx-auto leading-relaxed">
            Every audit runs your landing page through nine diagnostic layers — the most comprehensive AI-powered website analysis available.
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

      {/* CTA banner */}
      <section className="max-w-[960px] mx-auto px-7 pb-16">
        <div
          className="rounded-xl border p-8 text-center"
          style={{ background: "var(--brand-dim)", borderColor: "var(--brand-glow)" }}
        >
          <h2 className="text-[20px] font-bold tracking-tight text-foreground mb-2">
            Ready to find your conversion killers?
          </h2>
          <p className="text-[12px] text-foreground/40 mb-5 max-w-md mx-auto leading-relaxed">
            Run your free UX audit now — paste any URL and get your full diagnostic report in under 30 seconds.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-[13px] font-bold transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
            style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
          >
            Start Free Audit
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
      </section>
    </div>
  );
}
