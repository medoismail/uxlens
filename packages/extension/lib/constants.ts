// __API_BASE__ is replaced at build time by vite.config.ts define
// Dev build: "http://localhost:3000", Prod build: "https://www.uxlens.pro"
export const API_BASE: string = __API_BASE__;

export const PIPELINE_STAGES = [
  { key: "structural_decomposition", name: "Structural Decomposition", num: "01" },
  { key: "message_clarity", name: "Message Clarity Analysis", num: "02" },
  { key: "cognitive_load", name: "Cognitive Load Scan", num: "03" },
  { key: "conversion_architecture", name: "Conversion Architecture", num: "04" },
  { key: "trust_signals", name: "Trust Signal Inventory", num: "05" },
  { key: "contradiction_detection", name: "Contradiction Detection", num: "06" },
  { key: "first_screen", name: "First-Screen Hypothesis", num: "07" },
  { key: "self_critique", name: "Self-Critique Refinement", num: "08" },
  { key: "synthesis_rewrite", name: "Synthesis & Rewrite Engine", num: "09" },
  { key: "heuristic_evaluation", name: "Heuristic Evaluation", num: "10" },
] as const;

export const STAGE_INDEX: Record<string, number> = Object.fromEntries(
  PIPELINE_STAGES.map((s, i) => [s.key, i])
);

export const PLAN_LIMITS: Record<string, number> = {
  free: 5,
  starter: 50,
  pro: 200,
  agency: 1000,
};
