<div align="center">

# AI Job Application Agent

**A 5-agent pipeline that finds jobs, ranks them against your resume, and writes the application.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://www.prisma.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## Overview

Job hunting is repetitive: read the post, tweak the resume, draft a cover letter, copy fields into an ATS, repeat. This project automates the loop end-to-end with a chain of small, focused agents — so you spend time interviewing, not formatting.

It is built as a SaaS: a Next.js app with Clerk auth, a Prisma-backed Postgres/SQLite store, Stripe billing (Free + Pro tiers), and metered usage limits.

## The 5-Agent Pipeline

```
 ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐   ┌──────────┐
 │ 1. Resume    │ → │ 2. Job       │ → │ 3. Match &   │ → │ 4. Content       │ → │ 5. Apply │
 │    Parser    │   │    Search    │   │    Rank      │   │    Generator     │   │ (extn)   │
 └──────────────┘   └──────────────┘   └──────────────┘   └──────────────────┘   └──────────┘
   parse PDF /       query boards       embed + score      cover letter +         autofill in
   text resume       (Adzuna, etc.)     fit to resume      tailored resume        browser
```

Each agent has a stable contract so you can swap implementations (different LLM, different job source, different scoring approach) without touching the others.

## Tech Stack

- **Framework** — Next.js 15 (App Router) · React 19
- **Language** — TypeScript 5 (strict)
- **Database** — Prisma 6 (SQLite for dev, Postgres in prod)
- **Auth** — Clerk
- **Payments** — Stripe (Checkout + Customer Portal + webhooks)
- **UI** — Tailwind CSS · Radix UI · Lucide icons
- **AI** — OpenAI SDK (swappable)

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- A [Clerk](https://dashboard.clerk.com) project (free)
- A [Stripe](https://dashboard.stripe.com) account in test mode (only required to exercise billing)
- An OpenAI API key (only required once content-generation agents are wired)

### Setup

```bash
git clone https://github.com/psjprajna/ai-job-application-agent.git
cd ai-job-application-agent
npm install

cp .env.example .env.local
# fill in CLERK_* keys at minimum to run the app
# fill in STRIPE_* keys to exercise billing
# fill in OPENAI_API_KEY once the content agent is implemented

npx prisma db push        # creates ./prisma/dev.db from the schema
npm run dev               # http://localhost:3000
```

### Stripe (optional, for billing)

1. Create a Pro product + recurring price in the Stripe dashboard. Copy the price ID into `STRIPE_PRO_PRICE_ID`.
2. For local webhook testing:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.
3. Test card: `4242 4242 4242 4242`.

## Project Structure

```
.
├── app/                          # Next.js App Router
│   ├── (dashboard)/dashboard/    # Authed dashboard + billing
│   ├── api/                      # Route handlers
│   │   ├── stripe/               # checkout, webhook, portal
│   │   ├── usage/                # GET usage snapshot
│   │   ├── resume/upload/        # → Resume Parser
│   │   ├── jobs/search/          # → Job Search
│   │   └── generate/             # → Content Generator
│   ├── sign-in/ · sign-up/       # Clerk hosted UI
│   ├── layout.tsx · page.tsx     # Root layout + landing page
│   └── globals.css               # Design tokens + Tailwind
├── components/                   # UI: pricing, upgrade modal, feature buttons
├── lib/
│   ├── db.ts                     # Prisma client singleton
│   ├── usage.ts                  # Limits, checkLimit, incrementUsage
│   └── stripe.ts                 # Stripe SDK + customer helper
├── prisma/schema.prisma          # User, UsageCounter, Resume, JobApplication
├── specs/                        # Approved product specs (see below)
└── middleware.ts                 # Clerk route protection
```

## Billing & Usage Limits

| Resource              | Free | Pro       |
| --------------------- | ---- | --------- |
| Resume uploads        | 1    | Unlimited |
| Job searches / month  | 5    | Unlimited |
| Cover letters / month | 3    | Unlimited |
| Tailored resumes / mo | 3    | Unlimited |
| **Price**             | $0   | $19 / mo  |

Limits are enforced **at the API layer** (hard 403 with a `LIMIT_REACHED` payload) and **in the UI** (the `UpgradeModal` opens automatically on 403). Cached cover letters do not count toward the monthly quota. Counters reset on the first request of each calendar month.

## Specs

This project follows a spec-driven workflow. Each feature has an approved spec under `specs/` before code is written.

- **[`specs/006-saas-billing`](specs/006-saas-billing/spec.md)** — Plan enum, UsageCounter model, Stripe Checkout + Customer Portal + webhook, billing page
- **[`specs/007-usage-limits`](specs/007-usage-limits/spec.md)** — API enforcement (`lib/usage.ts`) + UI gating (`UpgradeModal`)
- **[`specs/008-pricing-landing`](specs/008-pricing-landing/spec.md)** — Pricing section on the landing page

## Roadmap

The SaaS shell (auth, billing, usage limits, dashboard, pricing) is wired. The agent implementations are stubs returning `{ status: 'stub' }` — that's the next slice of work.

- [ ] **Resume Parser** — PDF/DOCX → structured profile (skills, roles, dates)
- [ ] **Job Search** — Adzuna + LinkedIn + Greenhouse adapters, dedupe, normalize
- [ ] **Match & Rank** — embeddings + scoring against parsed resume
- [ ] **Content Generator** — cover letters + tailored resumes via OpenAI
- [ ] **Apply** — browser extension (Manifest V3) that consumes generated content and autofills common ATSes
- [ ] **Observability** — request tracing, usage analytics, error reporting
- [ ] **CI** — typecheck + unit tests + Prisma migration check on PR

## Contributing

Open an issue first for anything non-trivial. New features land as a spec under `specs/NNN-name/spec.md` before implementation.

## License

MIT — see [LICENSE](LICENSE).
