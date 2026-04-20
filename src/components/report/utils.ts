import type { AuditSection, Finding, ConversionKiller, ConversionKillerItem, ActionableItem, ActionItem } from "@/lib/types";

/* ── Score colors ── */

export function scoreColor(s: number) {
  if (s >= 75) return "var(--score-high)";
  if (s >= 50) return "var(--score-mid)";
  return "var(--score-low)";
}

export function heuristicColor(s: number) {
  if (s >= 7) return "var(--score-high)";
  if (s >= 4) return "var(--score-mid)";
  return "var(--score-low)";
}

export function heuristicBg(s: number) {
  if (s >= 7) return "oklch(0.52 0.14 155 / 8%)";
  if (s >= 4) return "oklch(0.58 0.16 75 / 8%)";
  return "oklch(0.55 0.17 20 / 8%)";
}

/* ── Severity ── */

export const SEVERITY_STYLES: Record<string, React.CSSProperties> = {
  critical: { background: "oklch(0.55 0.17 20 / 15%)", color: "var(--score-low)" },
  high: { background: "oklch(0.55 0.17 20 / 10%)", color: "var(--score-low)" },
  medium: { background: "oklch(0.58 0.16 75 / 10%)", color: "var(--score-mid)" },
  low: { background: "oklch(0.52 0.14 155 / 10%)", color: "var(--score-high)" },
};

/* ── Categories ── */

export const CATEGORY_DEFS = [
  { key: "messageClarity", label: "Message Clarity", desc: "How quickly visitors understand your offer" },
  { key: "cognitiveLoad", label: "Cognitive Load", desc: "Mental effort needed to process the page" },
  { key: "conversionArch", label: "Conversion Arch.", desc: "Strength of the path from interest to action" },
  { key: "trustSignals", label: "Trust Signals", desc: "Credibility cues that reduce visitor hesitation" },
  { key: "contradictions", label: "Contradictions", desc: "Consistency between claims and evidence" },
  { key: "firstScreen", label: "First Screen", desc: "Above-the-fold clarity for cold traffic" },
] as const;

/* ── Union type helpers ── */

export function getKillerText(k: ConversionKiller): string {
  return typeof k === "string" ? k : k.title;
}
export function getKillerDetail(k: ConversionKiller): ConversionKillerItem | null {
  return typeof k === "string" ? null : k;
}
export function getActionText(a: ActionableItem): string {
  return typeof a === "string" ? a : a.text;
}
export function getActionDetail(a: ActionableItem): ActionItem | null {
  return typeof a === "string" ? null : a;
}

export function deriveScope(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("a/b") || lower.includes("test") || lower.includes("experiment")) return "A/B Test";
  if (lower.includes("redesign") || lower.includes("rebuild") || lower.includes("overhaul")) return "Redesign";
  if (lower.includes("content") || lower.includes("copy") || lower.includes("write")) return "Content";
  return "Strategic";
}

/* ── Top findings (deduped) ── */

function titleWords(t: string): Set<string> {
  return new Set(t.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 2));
}

function isSimilar(a: string, b: string): boolean {
  const wa = titleWords(a);
  const wb = titleWords(b);
  if (wa.size === 0 || wb.size === 0) return false;
  let overlap = 0;
  for (const w of wa) if (wb.has(w)) overlap++;
  return overlap / Math.min(wa.size, wb.size) >= 0.6;
}

export function getTopFindings(sections: AuditSection[], max = 4): Finding[] {
  const all: Finding[] = [];
  for (const sec of sections) {
    for (const f of sec.findings) {
      if (f.type === "issue" || f.type === "warning") {
        all.push(f);
      }
    }
  }
  const sevOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const impOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  all.sort((a, b) => (sevOrder[a.severity || "medium"] ?? 2) - (sevOrder[b.severity || "medium"] ?? 2) || (impOrder[a.impact] ?? 1) - (impOrder[b.impact] ?? 1));
  const picked: Finding[] = [];
  for (const f of all) {
    if (picked.length >= max) break;
    if (!picked.some(p => isSimilar(p.title, f.title))) picked.push(f);
  }
  return picked;
}

/* ── Severity counter ── */

export function countSeverities(sections: AuditSection[]): Record<string, number> {
  const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const sec of sections) {
    for (const f of sec.findings) {
      const sev = f.severity || (f.impact === "high" ? "high" : f.impact === "medium" ? "medium" : "low");
      if (counts[sev] !== undefined) counts[sev]++;
    }
  }
  return counts;
}

/* ── Sparkline data ── */

const SPARK_PATTERNS = [
  [0.25, 0.50, 1.00, 0.60, 0.80],
  [0.80, 0.55, 0.30, 0.65, 1.00],
  [0.40, 1.00, 0.70, 0.35, 0.55],
  [0.60, 0.40, 0.75, 1.00, 0.50],
  [1.00, 0.65, 0.40, 0.55, 0.30],
  [0.35, 0.70, 0.55, 1.00, 0.75],
];

export function generateSparkData(score: number, index = 0): number[] {
  const s = score / 100;
  return SPARK_PATTERNS[index % SPARK_PATTERNS.length].map(m => Math.min(1, Math.max(0.08, s * m)));
}

/* ── Journey stage colors ── */

export const JOURNEY_STAGE_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  awareness: { bg: "oklch(0.62 0.18 275 / 8%)", color: "oklch(0.62 0.18 275)", label: "Awareness" },
  consideration: { bg: "oklch(0.62 0.14 245 / 8%)", color: "oklch(0.62 0.14 245)", label: "Consideration" },
  evaluation: { bg: "oklch(0.58 0.16 75 / 8%)", color: "oklch(0.58 0.16 75)", label: "Evaluation" },
  conviction: { bg: "oklch(0.62 0.15 160 / 8%)", color: "oklch(0.62 0.15 160)", label: "Conviction" },
  action: { bg: "oklch(0.55 0.17 20 / 8%)", color: "oklch(0.55 0.17 20)", label: "Action" },
};
