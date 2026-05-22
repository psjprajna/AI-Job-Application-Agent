# Spec 006 — Stripe Billing & Plan Management

## Status: APPROVED

## Goal
Add a freemium billing layer: Free tier with hard usage limits, Pro tier ($19/mo) with unlimited access via Stripe Checkout. Users manage subscriptions via the Stripe Customer Portal.

---

## Tiers

| Resource         | Free | Pro        |
|------------------|------|------------|
| Resume uploads   | 1    | Unlimited  |
| Job searches/mo  | 5    | Unlimited  |
| Cover letters/mo | 3    | Unlimited  |
| Tailored resumes/mo | 3 | Unlimited  |
| Price            | $0   | $19/month  |

---

## Slice A — DB: Plan + Usage Schema

### Files Touched
- `prisma/schema.prisma`
- `prisma/migrations/` (generated)

### Schema Changes

```prisma
enum Plan {
  FREE
  PRO
}

// Add to User model:
plan                 Plan     @default(FREE)
stripeCustomerId     String?  @unique
stripeSubscriptionId String?  @unique
planExpiresAt        DateTime?
usageCounter         UsageCounter?

// New model:
model UsageCounter {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  resumeUploads   Int      @default(0)
  jobSearches     Int      @default(0)
  coverLetters    Int      @default(0)
  tailoredResumes Int      @default(0)
  resetAt         DateTime @default(now())
  @@map("usage_counters")
}
```

### Acceptance Criteria
- `npx prisma db push` completes without errors
- New User records have `plan: FREE` by default
- UsageCounter is lazily created on first usage check (not required at User creation)
- `planExpiresAt` is nullable; only set when subscription ends

---

## Slice B — Stripe: Checkout + Webhook + Billing Page

### Files Touched
- `app/api/stripe/checkout/route.ts` (NEW)
- `app/api/stripe/webhook/route.ts` (NEW)
- `app/api/stripe/portal/route.ts` (NEW)
- `app/(dashboard)/dashboard/billing/page.tsx` (NEW)

### ENV Vars Required
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### API: POST /api/stripe/checkout
- Auth: require Clerk userId → look up User in DB
- If no stripeCustomerId: create Stripe customer with user email → save to User.stripeCustomerId
- Create Checkout Session: mode=subscription, price=STRIPE_PRO_PRICE_ID, success_url=`/dashboard/billing?success=true`, cancel_url=`/dashboard/billing`
- Return `{ url: session.url }`

### API: POST /api/stripe/webhook
- Verify Stripe signature with `stripe.webhooks.constructEvent`
- Handle events:
  - `checkout.session.completed` → set User.plan=PRO, User.stripeSubscriptionId
  - `customer.subscription.updated` → update plan based on status (active=PRO, past_due/canceled=FREE)
  - `customer.subscription.deleted` → set User.plan=FREE, clear stripeSubscriptionId
- Return 200 for all handled events; 400 for signature errors

### API: POST /api/stripe/portal
- Auth: require Clerk userId → look up User.stripeCustomerId
- Create Customer Portal session → return `{ url: portalSession.url }`

### Page: /dashboard/billing
- Server component: fetch current user plan + UsageCounter from DB
- Show plan badge (FREE / PRO)
- For FREE users: show usage bars (X/Y per resource) + "Upgrade to Pro" button
- For PRO users: show "Pro Plan — Active" badge + "Manage Billing" button
- "Upgrade to Pro" → POST /api/stripe/checkout → redirect to session.url
- "Manage Billing" → POST /api/stripe/portal → redirect to portal.url

### Acceptance Criteria
- Test card `4242 4242 4242 4242` completes checkout; User.plan becomes PRO in DB
- Webhook handler receives event and updates plan
- Pro user sees "Manage Billing" on billing page; portal loads successfully
- Free user sees usage counters and upgrade button

---

## Test Plan
1. Set up Stripe test mode product + price; copy price ID to `.env`
2. Run `stripe listen --forward-to localhost:3000/api/stripe/webhook` for local webhook testing
3. Test checkout: click Upgrade → Stripe hosted page → pay with test card → redirect back → verify DB `plan=PRO`
4. Test portal: Pro user clicks "Manage Billing" → portal loads → cancel subscription → webhook fires → DB `plan=FREE`
5. Test free user billing page: usage bars visible, Upgrade button visible
