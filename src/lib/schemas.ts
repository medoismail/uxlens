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

/** Schema for the new multi-role AI audit response */
export const uxAuditSchema = z.object({
  offer_detection: z.object({
    offer_detected: z.string(),
    target_user_guess: z.string(),
    outcome_guess: z.string(),
    confidence: z.number().min(0).max(100),
  }),
  scores: z.object({
    first_screen_clarity: z.number().min(0).max(100),
    cta_strength: z.number().min(0).max(100),
    trust_first_screen: z.number().min(0).max(100),
    message_clarity_score: z.number().min(0).max(100),
    conversion_structure_score: z.number().min(0).max(100),
    confusion_score: z.number().min(0).max(100),
    ux_score: z.number().min(0).max(100),
  }),
  major_issues: z.array(z.string()),
  missing_conversion_elements: z.array(z.string()),
  confusing_phrases: z.array(z.string()),
  hero_rewrite: z.object({
    headline: z.string(),
    subheadline: z.string(),
    cta: z.string(),
  }),
  quick_fixes: z.array(z.string()),
  audit_quality_score: z.number().min(0).max(100),
});

/** API request body schema */
export const analyzeRequestSchema = z.object({
  url: urlSchema,
});
