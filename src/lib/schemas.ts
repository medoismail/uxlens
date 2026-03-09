import { z } from "zod";

/** URL validation schema - only allows public http/https URLs */
export const urlSchema = z
  .string()
  .trim()
  .min(1, "Please enter a URL")
  .refine(
    (val) => {
      try {
        const url = new URL(val.startsWith("http") ? val : `https://${val}`);
        return ["http:", "https:"].includes(url.protocol);
      } catch {
        return false;
      }
    },
    { message: "Please enter a valid URL (e.g. https://example.com)" }
  )
  .refine(
    (val) => {
      try {
        const url = new URL(val.startsWith("http") ? val : `https://${val}`);
        const hostname = url.hostname.toLowerCase();
        return (
          !hostname.includes("localhost") &&
          !hostname.includes("127.0.0.1") &&
          !hostname.includes("0.0.0.0") &&
          !hostname.startsWith("192.168.") &&
          !hostname.startsWith("10.") &&
          hostname.includes(".")
        );
      } catch {
        return false;
      }
    },
    { message: "Only public URLs are supported" }
  );

const findingSchema = z.object({
  type: z.enum(["issue", "warning", "positive"]),
  title: z.string(),
  desc: z.string(),
  impact: z.enum(["high", "medium", "low"]),
});

const sectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  score: z.number().min(0).max(100),
  subtitle: z.string(),
  findings: z.array(findingSchema),
  recommendations: z.array(z.string()),
});

const categoryScoreSchema = z.object({
  score: z.number().min(0).max(100),
  note: z.string(),
});

/** Schema for the 9-Layer Diagnostic Engine response */
export const uxAuditSchema = z.object({
  overallScore: z.number().min(0).max(100),
  grade: z.string(),
  executiveSummary: z.string(),
  conversionKillers: z.array(z.string()),
  quickWins: z.array(z.string()),
  strategicFixes: z.array(z.string()),
  flags: z.array(z.string()),
  categories: z.object({
    messageClarity: categoryScoreSchema,
    cognitiveLoad: categoryScoreSchema,
    conversionArch: categoryScoreSchema,
    trustSignals: categoryScoreSchema,
    contradictions: categoryScoreSchema,
    firstScreen: categoryScoreSchema,
  }),
  sections: z.array(sectionSchema),
  firstScreenAnalysis: z.object({
    immediateUnderstanding: z.string(),
    unansweredQuestion: z.string(),
    dominantEmotion: z.string(),
    exitReason: z.string(),
    clarityConfidence: z.number().min(0).max(100),
  }),
  confusionMap: z.object({
    jargonScore: z.number().min(0).max(100),
    densityScore: z.number().min(0).max(100),
    frictionWords: z.number().min(0).max(100),
    decisionParalysis: z.number().min(0).max(100),
  }),
  trustMatrix: z.array(
    z.object({
      label: z.string(),
      score: z.number().min(0).max(100),
    })
  ),
  rewrite: z.object({
    beforeHeadline: z.string(),
    beforeSubheadline: z.string(),
    beforeCTA: z.string(),
    afterHeadline: z.string(),
    afterSubheadline: z.string(),
    afterCTA: z.string(),
    rewriteRationale: z.string(),
  }),
});

/** API request body schema */
export const analyzeRequestSchema = z.object({
  url: urlSchema,
  email: z.string().email().optional(),
});
