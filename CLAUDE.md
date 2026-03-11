# UXLens — Project Instructions for Claude

## Project Overview
UXLens is an AI-powered UX audit SaaS platform. It analyzes landing pages using a 10-layer diagnostic engine with Nielsen's heuristic evaluation, AI attention heatmaps, visual design analysis, competitor benchmarking, and AI chat.

**Live:** https://www.uxlens.pro
**Engine Version:** v0.6
**Diagnostic Layers:** 10

## Critical Rule: Content Sync on Feature Changes

**IMPORTANT:** Whenever you add a new feature, change the diagnostic engine, update the layer count, bump the version, or modify the audit output — you MUST also update ALL user-facing content across the app. Do NOT just update the code and forget the marketing copy.

Run `/sync-content` after any feature change to ensure consistency, or manually check these areas:

### Files that reference product capabilities:
- `src/components/hero.tsx` — subheadline, algo badges
- `src/components/loading-state.tsx` — pipeline steps, subtitle
- `src/components/url-form.tsx` — action bar text
- `src/components/header.tsx` — version badge
- `src/components/footer.tsx` — engine version
- `src/components/results-report.tsx` — report header
- `src/components/home-seo-content.tsx` — STEPS, PLANS, FAQS, feature sections
- `src/components/landing-mocks.tsx` — mock report header
- `src/components/pricing-client.tsx` — free tier features
- `src/app/layout.tsx` — all metadata, OG, Twitter, JSON-LD, noscript
- `src/app/manifest.ts` — PWA description
- `src/lib/openai.ts` — SYSTEM_PROMPT, buildUserPrompt
- `src/lib/pdf/audit-pdf.tsx` — PDF subtitle
- `src/app/api/skill/route.ts` — MCP tool descriptions

### Quick grep to verify:
After updating, always run these greps to catch stragglers:
- Search for old version (e.g. "v4" if upgrading from v4)
- Search for old layer count (e.g. "9-layer" or "9 layer")
- Search for removed/renamed features

## Current Product State

| Property | Value |
|----------|-------|
| Engine Version | v0.6 |
| Layer Count | 10 |
| AI Model | GPT-4o |
| Max Tokens | 16,384 |
| Pricing | Free $0 (5/mo), Starter $12 (50/mo), Pro $29 (200/mo), Agency $79 (1000/mo) |

### 10 Diagnostic Layers:
1. Structural Decomposition
2. Message Clarity Analysis (22% weight)
3. Cognitive Load Scan (15%)
4. Conversion Architecture (20%)
5. Trust Signal Inventory (18%)
6. Contradiction Detection (10%)
7. First-Screen Hypothesis (10%)
8. Self-Critique Refinement (5%)
9. Synthesis & Rewrite Engine
10. Nielsen's Heuristic Evaluation

### Key Features:
- 10-layer diagnostic with weighted scoring
- Nielsen's 10 usability heuristics (scored 0-10 each)
- Professional findings with severity (critical/high/medium/low), category, whyItMatters, recommendedFix
- UX Strengths section
- AI attention heatmap (GPT-4o vision)
- Visual design analysis (layout, hierarchy, whitespace, contrast, mobile — each 0-100)
- AI chat assistant (Pro+)
- Competitor analysis with user-provided URLs (Pro+)
- PDF export with heuristic evaluation page
- Per-section AI copy rewrites (text + structure)
- Multi-language support (auto-detects page language)
- MCP skill integration for Claude Code

## Tech Stack
- Next.js 16 (App Router) + TypeScript + React 19
- Tailwind CSS 4, shadcn/ui, lucide-react
- OpenAI GPT-4o (chat + vision)
- Supabase (PostgreSQL + Storage)
- Upstash Redis (rate limiting)
- Clerk (auth) + Gumroad (payments)
- @react-pdf/renderer (Noto Sans for Unicode)
- @modelcontextprotocol/sdk (MCP)

## AI Engine Persona
The SYSTEM_PROMPT in `src/lib/openai.ts` defines a professional UX auditor persona with:
- 5 expert roles (UX Researcher, CRO Strategist, IA Specialist, Heuristic Evaluator, Product Designer)
- 10 evaluation lenses
- Finding quality standards with good/bad examples
- Severity guidelines, behavioral rules, visitor assumptions
- Self-check protocol before finalizing audits

When modifying the AI prompt, maintain the professional auditor tone and never weaken the prompt with generic advice patterns.

## Build & Deploy
```bash
npm run dev          # Development
npm run build        # Production build (always verify before committing)
git push origin main # Auto-deploys to Vercel
```

## Commit Convention
Use descriptive commit messages. Always run `npm run build` before committing to catch type errors.
