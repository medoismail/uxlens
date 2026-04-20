# UXLens - AI-Powered UX Audit Platform

> **Diagnostic Engine v5** | 10-Layer AI Audit | Heuristic Evaluation | Attention Heatmaps | Competitor Analysis

UXLens is a SaaS platform that performs automated, AI-powered UX audits on any landing page. Paste a URL, get a comprehensive 10-layer diagnostic report with scores, heuristic evaluation, AI attention heatmaps, visual design analysis, conversion killers, and actionable fixes — in under 30 seconds.

**Live:** [https://www.uxlens.pro](https://www.uxlens.pro)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [API Routes](#api-routes)
- [Pages](#pages)
- [10-Layer Diagnostic Engine](#10-layer-diagnostic-engine)
- [AI Vision Analysis](#ai-vision-analysis)
- [Heuristic Evaluation](#heuristic-evaluation)
- [Professional Audit Framework](#professional-audit-framework)
- [Competitor Analysis](#competitor-analysis)
- [MCP Integration](#mcp-integration)
- [Subscription Tiers](#subscription-tiers)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Deployment](#deployment)

---

## Features

### Core Audit Engine
- **10-Layer Diagnostic Engine** — Structural decomposition, message clarity, cognitive load, conversion architecture, trust signals, contradiction detection, first-screen analysis, self-critique, synthesis/rewrite, and Nielsen's heuristic evaluation
- **Overall UX Score (0-100)** with letter grade (A-F) and 6 category breakdowns
- **Nielsen's 10 Usability Heuristics** — Each scored 0-10 with detected issues and positive observations
- **Professional Findings** with severity levels (Low/Medium/High/Critical), categories, "Why It Matters" explanations, and recommended fixes
- **UX Strengths** — Positive UX decisions highlighted alongside issues
- **Conversion Killers, Quick Wins, Strategic Fixes** — Prioritized action items

### AI Vision & Visual Analysis
- **AI Attention Heatmap** — GPT-4o vision analyzes screenshots to predict where users look (high/medium/low intensity zones)
- **Visual Design Scoring** — Layout, visual hierarchy, whitespace, color contrast, mobile readiness (each 0-100)
- **Full-Page Screenshots** via Microlink API with Puppeteer fallback

### AI-Powered Features
- **AI Chat Assistant** — Context-aware Q&A about your audit results (Pro+)
- **AI Copy Rewrite** — Headline, subheadline, and CTA rewritten with conversion principles
- **Per-Section Rewrites** — Text rewrites and structure reorganization suggestions for each audit section

### Competitor Analysis (Pro+)
- Auto-identifies 2 competitors by industry
- Supports user-provided competitor URLs
- Category-by-category score comparison
- Competitive positioning summary with strengths/weaknesses
- Score gap visualization

### Export & Integration
- **PDF Export** — Professional reports with all findings, heatmap, heuristic evaluation, competitor analysis
- **MCP Integration** — Claude Code skill for IDE-level UX audits
- **API Keys** — Programmatic access for Pro+ users
- **Audit Dashboard** — History, pagination, individual detail views

### Platform Features
- **Multi-Language Support** — Auto-detects page language, outputs audit in same language
- **Multi-Tier Subscriptions** via LemonSqueezy (Free/Starter/Pro/Agency)
- **PWA Support** — Installable on mobile/desktop
- **SEO Optimized** — JSON-LD structured data, Open Graph, Twitter Cards
- **Security Hardened** — URL validation (blocks private IPs), webhook signature verification, CSRF protection

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16.1.6 (App Router) |
| **Language** | TypeScript 5.x |
| **React** | React 19.2 |
| **Styling** | Tailwind CSS 4, PostCSS 4 |
| **UI Components** | shadcn/ui, Base UI, lucide-react |
| **AI/ML** | OpenAI GPT-4o (chat + vision) |
| **Database** | Supabase (PostgreSQL) |
| **Caching** | Upstash Redis (REST API) |
| **Storage** | Supabase Storage (S3-compatible) |
| **Auth** | Clerk (OAuth + email/password) |
| **Payments** | LemonSqueezy (subscriptions) |
| **Screenshots** | Microlink API + Puppeteer Core fallback |
| **PDF** | @react-pdf/renderer (Noto Sans for Unicode) |
| **MCP** | @modelcontextprotocol/sdk 1.27.1 |
| **Validation** | Zod 4.3 |
| **HTML Parsing** | Cheerio |
| **Deployment** | Vercel (serverless) |

---

## Architecture

```
CLIENT LAYER (Next.js Frontend)
+-- Landing Page (SEO-optimized, rotating text hero)
+-- User Dashboard (Clerk auth-gated, audit history grid)
+-- Audit Detail View (full report, heatmap overlay, AI chat, PDF export)
+-- Pricing Page (LemonSqueezy checkout integration)

API LAYER (Next.js App Router)
+-- Public: /api/analyze, /api/screenshot, /api/vision-analysis
+-- Authenticated: /api/audits, /api/chat, /api/competitor-analysis
+-- MCP/Skill: /api/skill, /api/mcp/* (Bearer token auth)
+-- Webhooks: /api/webhooks/clerk, /api/webhooks/lemonsqueezy

ANALYSIS ENGINE (OpenAI GPT-4o)
+-- 10-Layer Diagnostic Algorithm (structured output with Zod validation)
+-- Vision Analysis (attention hotspots + visual design scores)
+-- Competitor Identification & Comparison
+-- AI Chat (streaming, context-aware)

DATA PERSISTENCE
+-- Supabase PostgreSQL (users, audits, chat_messages, api_keys)
+-- Supabase Storage (screenshots, PDFs)
+-- Upstash Redis (rate limits, plan cache, chat credits)

EXTERNAL SERVICES
+-- Clerk (auth) | LemonSqueezy (payments) | Microlink (screenshots) | Vercel (hosting)
```

### Request Flow: `/api/analyze`
1. User submits URL
2. Auth check + Usage/rate limit check (parallel)
3. Fetch HTML via Microlink API
4. Extract page content with Cheerio (headings, buttons, forms, trust signals, body text)
5. Generate 10-layer audit via OpenAI GPT-4o (structured output, max 12,288 tokens)
6. Capture screenshot + run AI vision analysis (parallel)
7. Generate heatmap zones from hotspots
8. Save to Supabase (fire-and-forget)
9. Return results to client

---

## Project Structure

```
src/
+-- app/                          # Next.js App Router
|   +-- (auth)/                   # Clerk auth routes (sign-in, sign-up)
|   +-- api/                      # Backend API routes
|   |   +-- analyze/              # Main UX audit endpoint
|   |   +-- audits/               # Audit history CRUD
|   |   +-- chat/                 # AI chat assistant + history
|   |   +-- competitor-analysis/  # Competitor benchmarking
|   |   +-- health/               # Health check
|   |   +-- keys/                 # API key management
|   |   +-- mcp/                  # MCP tool endpoints
|   |   +-- screenshot/           # Page screenshot capture
|   |   +-- skill/                # Claude Code skill (MCP server)
|   |   +-- subscription/         # Subscription status
|   |   +-- user/                 # User plan info
|   |   +-- views/                # View counter
|   |   +-- vision-analysis/      # AI vision heatmap
|   |   +-- webhooks/             # Clerk + LemonSqueezy webhooks
|   +-- audit/[id]/               # Individual audit page
|   +-- dashboard/                # User dashboard
|   +-- pricing/                  # Pricing page
|   +-- page.tsx                  # Landing page
|   +-- layout.tsx                # Root layout (fonts, metadata, JSON-LD)
|   +-- manifest.ts               # PWA manifest
|   +-- sitemap.ts                # Dynamic sitemap
|   +-- robots.ts                 # Robots.txt
+-- components/                   # React components
|   +-- ui/                       # shadcn/ui primitives
|   +-- home-client.tsx           # Landing page client logic
|   +-- results-report.tsx        # Full audit report renderer
|   +-- heatmap-overlay.tsx       # Heatmap canvas overlay
|   +-- competitor-section.tsx    # Competitor analysis UI
|   +-- hero.tsx                  # Hero section with rotating text
|   +-- url-form.tsx              # URL input with validation
|   +-- loading-state.tsx         # 10-step pipeline animation
|   +-- pricing-client.tsx        # Pricing page with plans
|   +-- landing-mocks.tsx         # Landing page visual mocks
|   +-- home-seo-content.tsx      # SEO-optimized content sections
+-- hooks/                        # React hooks
|   +-- use-subscription.ts       # Subscription state hook
+-- lib/                          # Core utilities
|   +-- openai.ts                 # OpenAI integration (10-layer engine, vision, competitor)
|   +-- types.ts                  # TypeScript type definitions
|   +-- schemas.ts                # Zod validation schemas
|   +-- extract-page-content.ts   # HTML content extraction
|   +-- fetch-html.ts             # HTML fetching
|   +-- screenshot.ts             # Screenshot capture (Microlink + Puppeteer)
|   +-- heatmap.ts                # Hotspot-to-zone conversion
|   +-- validate-url.ts           # URL normalization
|   +-- supabase.ts               # Supabase client
|   +-- server-usage.ts           # Rate limiting (Redis)
|   +-- api-keys.ts               # API key validation
|   +-- lemonsqueezy.ts           # LemonSqueezy integration
|   +-- db/                       # Database operations
|   |   +-- users.ts              # User CRUD
|   |   +-- audits.ts             # Audit CRUD
|   |   +-- chat.ts               # Chat message storage
|   +-- pdf/                      # PDF generation
|       +-- audit-pdf.tsx         # Full PDF report renderer
+-- packages/mcp-server/          # MCP server package for Claude Code
    +-- src/tools/                # audit, visual, competitor, full-audit tools
    +-- src/client.ts             # API client
    +-- src/index.ts              # MCP server init
```

---

## API Routes

### Core Audit APIs
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/analyze` | POST | Optional (Clerk) | Run 10-layer UX audit on a URL |
| `/api/screenshot` | POST | Optional | Capture full-page screenshot |
| `/api/vision-analysis` | POST | Optional | AI attention heatmap + visual design scores |
| `/api/competitor-analysis` | POST | Required (Clerk) | Benchmark against competitors (Pro+) |

### User APIs
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/audits` | GET | Required | List user's audit history (paginated) |
| `/api/chat` | POST | Required | AI chat on audit context (streaming) |
| `/api/chat/history` | GET | Required | Chat message history per audit |
| `/api/subscription/check` | GET | Required | Check subscription status |
| `/api/user/plan` | GET | Required | Get user's plan tier |
| `/api/keys` | GET/POST/DELETE | Required | Manage API keys (Pro+) |

### MCP / Skill APIs
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/skill` | POST | Bearer token | Claude Code MCP skill endpoint |
| `/api/mcp/audit` | POST | Bearer token | MCP audit tool |
| `/api/mcp/visual-analysis` | POST | Bearer token | MCP vision tool |
| `/api/mcp/screenshot` | POST | Bearer token | MCP screenshot tool |
| `/api/mcp/competitor-analysis` | POST | Bearer token | MCP competitor tool |

### Webhook APIs
| Route | Method | Source | Description |
|-------|--------|--------|-------------|
| `/api/webhooks/clerk` | POST | Clerk | User sync & cascade deletion |
| `/api/webhooks/lemonsqueezy` | POST | LemonSqueezy | Subscription plan updates |

---

## Pages

| Route | Auth | Description |
|-------|------|-------------|
| `/` | No | Landing page with hero, features, FAQ, pricing preview |
| `/dashboard` | Yes | User audit history grid with pagination |
| `/audit/[id]` | Yes | Individual audit detail with full report, heatmap, chat, PDF |
| `/pricing` | No | Plan comparison, checkout links, human audit option |
| `/sign-in` | No | Clerk-hosted sign-in |
| `/sign-up` | No | Clerk-hosted sign-up |

---

## 10-Layer Diagnostic Engine

The core AI analysis engine runs 10 sequential diagnostic layers:

| Layer | Name | What It Does |
|-------|------|-------------|
| 1 | Structural Decomposition | Extracts page sections, hierarchy, element inventory |
| 2 | Message Clarity Analysis | Evaluates headline power, value proposition, semantic precision |
| 3 | Cognitive Load Scan | Measures information density, friction points, mental effort |
| 4 | Conversion Architecture | Audits CTA placement, urgency, specificity, action pathway |
| 5 | Trust Signal Inventory | Catalogues social proof, authority markers, risk reducers |
| 6 | Contradiction Detection | Cross-checks claims for inconsistencies, broken promises |
| 7 | First-Screen Hypothesis | Simulates above-the-fold clarity for cold-traffic visitors |
| 8 | Self-Critique Refinement | Challenges initial findings, eliminates false positives |
| 9 | Synthesis & Rewrite Engine | Generates priorities, optimized copy rewrites |
| 10 | Heuristic Evaluation | Scores all 10 Nielsen usability heuristics |

**Output:** Structured JSON validated with Zod schemas, containing overall score, 6 category scores, section-level findings, conversion killers, quick wins, strategic fixes, heuristic evaluation, UX strengths, and copy rewrites.

---

## AI Vision Analysis

UXLens captures a full-page screenshot and sends it to GPT-4o vision for two parallel analyses:

### Attention Heatmap
- Identifies 3-20 attention hotspots with normalized coordinates
- Each hotspot has intensity (high/medium/low), label, and reason
- Rendered as color-coded overlay (red = high, amber = medium, blue = low)

### Visual Design Scores (each 0-100)
- Layout Score
- Visual Hierarchy Score
- Whitespace Score
- Color & Contrast Score
- Mobile Readiness Score
- Overall Visual Score
- Detailed findings with recommendations

---

## Heuristic Evaluation

Layer 10 evaluates all 10 of Nielsen's usability heuristics:

| ID | Heuristic | Score Range |
|----|-----------|-------------|
| visibility | Visibility of System Status | 0-10 |
| match | Match Between System and Real World | 0-10 |
| control | User Control and Freedom | 0-10 |
| consistency | Consistency and Standards | 0-10 |
| error-prevention | Error Prevention | 0-10 |
| recognition | Recognition Rather Than Recall | 0-10 |
| flexibility | Flexibility and Efficiency of Use | 0-10 |
| aesthetic | Aesthetic and Minimalist Design | 0-10 |
| error-recovery | Help Users Recognize, Diagnose, and Recover from Errors | 0-10 |
| help | Help and Documentation | 0-10 |

Each heuristic includes:
- **Score** (0 = severe violation, 5 = adequate, 10 = exceptional)
- **Issues** (1-3 detected problems)
- **Passes** (0-2 things working well)

---

## Professional Audit Framework

Findings are categorized into 11 professional UX categories:

1. Information Hierarchy
2. UX Microcopy & Messaging
3. CTA Clarity
4. Visual Hierarchy
5. Interaction & Feedback
6. Navigation & Flow
7. Trust & Credibility Signals
8. Accessibility
9. Conversion Optimization
10. Performance & Loading UX
11. Consistency & Design System

Each finding includes:
- **Type:** issue / warning / positive
- **Impact:** high / medium / low
- **Severity:** critical / high / medium / low
- **Category:** Professional category label
- **Why It Matters:** Explanation of UX impact
- **Recommended Fix:** Actionable solution

---

## Competitor Analysis

Available for Pro+ plans:

1. **Auto-Identification:** AI identifies 2 competitors based on page content, industry, and value proposition
2. **Manual Input:** Users can provide specific competitor URLs
3. **Content Extraction:** Fetches and parses competitor pages
4. **Comparison:** GPT-4o generates category-by-category scores for each competitor
5. **Output:** Competitive position summary, score gaps, strengths/weaknesses, actionable advantages

---

## MCP Integration

UXLens includes a Model Context Protocol (MCP) server for Claude Code IDE integration.

### Remote Skill Endpoint
**URL:** `POST /api/skill`
**Auth:** Bearer token (API key from dashboard)

### Tools Available
| Tool | Description |
|------|-------------|
| `audit_url` | Run 10-layer UX audit, returns markdown with scores + heuristics |
| `visual_analysis` | Capture screenshot + AI heatmap + design scores |
| `competitor_analysis` | Benchmark against auto-detected competitors |
| `full_audit` | All-in-one: audit + screenshot + vision + heatmap |

### Local MCP Package
Located at `packages/mcp-server/`, installable as `@uxlens/mcp-server` for stdio-based Claude Code integration.

---

## Subscription Tiers

| Feature | Free | Starter ($12/mo) | Pro ($29/mo) | Agency ($79/mo) |
|---------|------|-----------|-----|--------|
| Audits/month | 5 | 50 | 200 | 1,000 |
| 10-Layer Scores | Yes | Yes | Yes | Yes |
| Heuristic Evaluation | Yes | Yes | Yes | Yes |
| AI Vision Heatmap | 1 free | Unlimited | Unlimited | Unlimited |
| Visual Design Analysis | - | Yes | Yes | Yes |
| Strategic Fixes | - | Yes | Yes | Yes |
| PDF Export | - | Yes | Yes | Yes |
| Competitor Analysis | - | Yes | Yes | Yes |
| AI Chat | - | - | 50 msg/mo | 200 msg/mo |
| API Keys (MCP) | - | - | Yes | Yes |

---

## Database Schema

### Users
```sql
users (id UUID PK, clerk_id VARCHAR UNIQUE, email VARCHAR UNIQUE, plan TEXT DEFAULT 'free', created_at TIMESTAMP)
```

### Audits
```sql
audits (id UUID PK, user_id UUID FK, url VARCHAR, result JSONB, screenshot_path VARCHAR, heatmap_zones JSONB, visual_analysis JSONB, competitor_analysis JSONB, created_at TIMESTAMP)
-- Indexes: (user_id, created_at DESC)
```

### Chat Messages
```sql
chat_messages (id UUID PK, audit_id UUID FK, user_id UUID FK, role TEXT, content TEXT, created_at TIMESTAMP)
-- Index: (audit_id, user_id, created_at)
```

### Chat Credits
```sql
chat_credits (user_id UUID, month VARCHAR 'YYYY-MM', messages_used INT, messages_limit INT, PK(user_id, month))
```

### API Keys
```sql
api_keys (id UUID PK, user_id UUID FK, key_hash VARCHAR UNIQUE, label VARCHAR, created_at TIMESTAMP, last_used TIMESTAMP)
```

---

## Environment Variables

### Required
```env
# AI
OPENAI_API_KEY=sk-...

# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Auth (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
CLERK_WEBHOOK_SECRET=whsec_...

# Caching (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=AX...

# Payments (LemonSqueezy)
LEMONSQUEEZY_API_KEY=eyJ...
LEMONSQUEEZY_STORE_ID=12345
LEMONSQUEEZY_WEBHOOK_SECRET=...
LS_VARIANT_STARTER=...
LS_VARIANT_PRO=...
LS_VARIANT_AGENCY=...
NEXT_PUBLIC_LS_CHECKOUT_STARTER=https://...
NEXT_PUBLIC_LS_CHECKOUT_PRO=https://...
NEXT_PUBLIC_LS_CHECKOUT_AGENCY=https://...
NEXT_PUBLIC_LS_CHECKOUT_HUMAN_AUDIT=https://...
```

### Optional
```env
MICROLINK_API_KEY=...           # Microlink API key for screenshots
NEXT_PUBLIC_GA_ID=G-XXXXXXX     # Google Analytics
```

---

## Getting Started

```bash
# Clone
git clone https://github.com/medoismail/uxlens.git
cd uxlens

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in all required values

# Run Supabase migrations
# (Apply files in supabase/migrations/ to your Supabase instance)

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## Deployment

- **Platform:** Vercel (recommended)
- **Build Command:** `next build`
- **Max Duration:** 60s configured for long-running API routes (analyze, screenshot, MCP)
- **Environment Variables:** Set all required vars in Vercel dashboard
- **Webhooks:** Configure Clerk and LemonSqueezy webhook URLs to point to `/api/webhooks/clerk` and `/api/webhooks/lemonsqueezy`
- **Custom Domain:** `www.uxlens.pro`

### Performance Notes
- Screenshot + vision analysis run in parallel with audit generation
- Audit saving is fire-and-forget (doesn't block response)
- Redis caches plan tier for 7 days to reduce DB queries
- Chat responses use streaming for real-time UX
- PDF generation uses server-side React rendering with Noto Sans for multi-language support

---

## Security

- **URL Validation:** Blocks localhost, private IPs (10.x, 172.16-31.x, 192.168.x), IPv6 local, .internal/.local TLDs
- **Webhook Verification:** HMAC signature verification for Clerk and LemonSqueezy webhooks
- **Auth:** Clerk-managed sessions with JWT verification on protected routes
- **API Keys:** SHA-256 hashed storage, timing-safe comparison
- **Rate Limiting:** Per-IP hourly limits + per-user monthly limits via Redis
- **Content Security:** CSP headers, HSTS, X-Frame-Options, Referrer-Policy

---

*UXLens Diagnostic Engine v5 - Built by Ismail Medi*
