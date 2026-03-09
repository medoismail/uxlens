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

        // Block non-http(s) schemes
        if (!["http:", "https:"].includes(url.protocol)) return false;

        // Must have a dot (no bare hostnames)
        if (!hostname.includes(".")) return false;

        // Block localhost variants
        if (
          hostname === "localhost" ||
          hostname.endsWith(".localhost") ||
          hostname === "127.0.0.1" ||
          hostname === "0.0.0.0" ||
          hostname === "[::1]"
        ) return false;

        // Block private/reserved IPv4 ranges
        const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
        if (ipv4Match) {
          const [, a, b] = ipv4Match.map(Number);
          if (a === 10) return false;                         // 10.0.0.0/8
          if (a === 172 && b >= 16 && b <= 31) return false;  // 172.16.0.0/12
          if (a === 192 && b === 168) return false;            // 192.168.0.0/16
          if (a === 169 && b === 254) return false;            // 169.254.0.0/16 (link-local / AWS metadata)
          if (a === 127) return false;                         // 127.0.0.0/8
          if (a === 0) return false;                           // 0.0.0.0/8
        }

        // Block IPv6 private ranges
        if (hostname.startsWith("[")) {
          const inner = hostname.slice(1, -1).toLowerCase();
          if (
            inner === "::1" ||
            inner.startsWith("fc") ||
            inner.startsWith("fd") ||
            inner.startsWith("fe80")
          ) return false;
        }

        // Block .internal and .local TLDs
        if (hostname.endsWith(".internal") || hostname.endsWith(".local")) return false;

        return true;
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

/* ── Competitor Analysis Schemas ───────────────────────── */

const competitorCategoryScoresSchema = z.object({
  messageClarity: z.object({ score: z.number().min(0).max(100), note: z.string() }),
  cognitiveLoad: z.object({ score: z.number().min(0).max(100), note: z.string() }),
  conversionArch: z.object({ score: z.number().min(0).max(100), note: z.string() }),
  trustSignals: z.object({ score: z.number().min(0).max(100), note: z.string() }),
  contradictions: z.object({ score: z.number().min(0).max(100), note: z.string() }),
  firstScreen: z.object({ score: z.number().min(0).max(100), note: z.string() }),
});

const competitorProfileSchema = z.object({
  url: z.string(),
  name: z.string(),
  estimatedScore: z.number().min(0).max(100),
  estimatedGrade: z.string(),
  categories: competitorCategoryScoresSchema,
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
});

const categoryComparisonSchema = z.object({
  category: z.string(),
  userScore: z.number().min(0).max(100),
  competitor1Score: z.number().min(0).max(100),
  competitor2Score: z.number().min(0).max(100),
  winner: z.enum(["user", "competitor1", "competitor2"]),
  insight: z.string(),
});

export const competitorAnalysisSchema = z.object({
  competitors: z.array(competitorProfileSchema).min(1).max(2),
  categoryComparisons: z.array(categoryComparisonSchema),
  competitiveAdvantages: z.array(z.string()),
  competitivePosition: z.string(),
  userOverallScore: z.number().min(0).max(100),
  averageCompetitorScore: z.number().min(0).max(100),
  scoreGap: z.number(),
});

export const identifyCompetitorsSchema = z.object({
  competitors: z.array(
    z.object({
      url: z.string().url(),
      name: z.string(),
      reasoning: z.string(),
    })
  ).min(1).max(2),
});
