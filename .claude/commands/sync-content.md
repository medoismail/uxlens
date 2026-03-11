# Sync All Content & Messaging

After any feature addition, upgrade, or version bump, run a full content sync across the entire app. This ensures all user-facing copy, metadata, pricing details, and marketing content reflects the current state of the product.

## Checklist — scan and update ALL of these files:

### Version & Engine References
- `src/components/header.tsx` — version badge (e.g. "v0.6")
- `src/components/footer.tsx` — "Diagnostic Engine vX"
- `src/components/results-report.tsx` — report header "Diagnostic Engine vX"
- `src/lib/pdf/audit-pdf.tsx` — PDF subtitle "Diagnostic Engine vX"

### Layer Count References
- `src/components/hero.tsx` — subheadline ("X-layer AI audit"), algo badges ("X LAYERS")
- `src/components/loading-state.tsx` — subtitle ("X-layer structured audit"), PIPELINE_STEPS array (must match layer count)
- `src/components/url-form.tsx` — action bar text ("full X-layer audit")
- `src/components/home-seo-content.tsx` — STEPS descriptions, PLANS features, FAQS answers, feature section label
- `src/components/landing-mocks.tsx` — "X-Layer UX Audit Report"

### SEO & Metadata
- `src/app/layout.tsx` — metadata.description, openGraph.description, twitter.description, JSON-LD description, JSON-LD featureList, noscript fallback text
- `src/app/manifest.ts` — PWA manifest description

### Pricing & Feature Lists
- `src/components/pricing-client.tsx` — Free tier feature list
- `src/components/home-seo-content.tsx` — PLANS array features for Free/Starter/Pro
- `src/components/pricing-cards.tsx` — Starter/Pro/Agency feature lists (if they exist)

### AI Engine & MCP Skill
- `src/lib/openai.ts` — SYSTEM_PROMPT identity, layer count in buildUserPrompt, layer algorithm steps
- `src/app/api/skill/route.ts` — tool descriptions for audit_url, visual_analysis, competitor_analysis, full_audit

### FAQ Content
- `src/components/home-seo-content.tsx` — FAQS array: ensure answers mention correct layer count, version, and features

## Process:
1. Read each file listed above
2. Identify any outdated references (old version numbers, old layer counts, missing new features)
3. Update all references to match the current product state
4. Grep for any remaining old references across `src/` to catch anything missed
5. Run `npm run build` to verify no errors
6. Commit with a clear message describing what was synced

## Current Product State (update this when things change):
- **Engine Version:** v0.6
- **Layer Count:** 10
- **Layers:** Structural Decomposition, Message Clarity, Cognitive Load, Conversion Architecture, Trust Signals, Contradiction Detection, First-Screen Hypothesis, Self-Critique, Synthesis & Rewrite, Heuristic Evaluation
- **Key Features:** 10-layer diagnostic, Nielsen's heuristic evaluation, AI attention heatmap, visual design analysis, AI chat, competitor analysis, PDF export, per-section rewrites, UX strengths, professional findings (severity/category/fix)
- **Plans:** Free (5/mo), Starter $12 (50/mo), Pro $29 (200/mo), Agency $79 (1000/mo)
