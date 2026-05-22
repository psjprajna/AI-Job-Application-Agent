# Spec 007 — Usage Limits: API Enforcement + UI Gating

## Status: APPROVED

## Goal
Enforce Free tier limits at the API layer (hard 403) and gate feature buttons in the UI to show an UpgradeModal when limits are hit.

---

## Slice C — Usage Enforcement in APIs

### Files Touched
- `lib/usage.ts` (NEW)
- `app/api/resume/upload/route.ts` (UPDATE)
- `app/api/jobs/search/route.ts` (UPDATE)
- `app/api/generate/cover-letter/route.ts` (UPDATE)
- `app/api/generate/tailored-resume/route.ts` (UPDATE)

### lib/usage.ts

```ts
export const PLAN_LIMITS = {
  FREE: { resumeUploads: 1, jobSearches: 5, coverLetters: 3, tailoredResumes: 3 },
  PRO:  { resumeUploads: Infinity, jobSearches: Infinity, coverLetters: Infinity, tailoredResumes: Infinity },
}

type Resource = keyof typeof PLAN_LIMITS.FREE

// Returns the User+UsageCounter from DB, lazily creating UsageCounter if missing
// Resets counters if resetAt is in a prior month
async function getOrCreateCounter(userId: string): Promise<{ user, counter }>

// Check if user is within limit for resource
// Returns { allowed: boolean, used: number, limit: number, plan: string }
export async function checkLimit(userId: string, resource: Resource)

// Increment the counter for resource by 1
export async function incrementUsage(userId: string, resource: Resource)
```

### Reset Logic
- On every `getOrCreateCounter` call: if `counter.resetAt` month < current month → reset all counters to 0, set `resetAt = now()`

### API Changes (same pattern for all 4 routes)
```ts
// Before running the feature:
const { allowed, used, limit, plan } = await checkLimit(userId, 'jobSearches')
if (!allowed) {
  return NextResponse.json(
    { error: 'LIMIT_REACHED', resource: 'jobSearches', used, limit, plan },
    { status: 403 }
  )
}
// ... run feature ...
await incrementUsage(userId, 'jobSearches')
```

**Note on cover letters:** Only increment on *new* generation (not cache hits). Check `application.coverLetter` — if already cached, serve without incrementing.

### Acceptance Criteria
- Set `usageCounter.jobSearches = 5` in DB → `POST /api/jobs/search` returns 403 `LIMIT_REACHED`
- Set `user.plan = PRO` → same route succeeds regardless of counter
- Cover letter cache hit does NOT increment counter
- Counter resets to 0 on first request of a new month

---

## Slice D — UI Gating + Upgrade Modal

### Files Touched
- `components/upgrade-modal.tsx` (NEW)
- `app/api/usage/route.ts` (NEW)
- `components/job-search-client.tsx` (UPDATE)
- `components/cover-letter-button.tsx` (UPDATE)
- `components/tailored-resume-button.tsx` (UPDATE)

### components/upgrade-modal.tsx
- Radix Dialog (already available via `@radix-ui/react-dialog`)
- Props: `open`, `onClose`, `resource` (string — e.g. "job searches"), `used`, `limit`
- Content: "You've used X/Y job searches this month. Upgrade to Pro for unlimited access."
- CTA: "Upgrade to Pro →" button → POST /api/stripe/checkout → redirect to checkout URL
- Secondary: "Maybe later" → closes modal

### app/api/usage/route.ts
- GET, auth required
- Returns: `{ plan, limits, usage: { resumeUploads, jobSearches, coverLetters, tailoredResumes } }`
- Used by billing page + future usage indicators

### UI Pattern (same for all 3 feature buttons)
```ts
const res = await fetch('/api/jobs/search', { ... })
if (res.status === 403) {
  const { resource, used, limit } = await res.json()
  setLimitHit({ resource, used, limit })  // triggers UpgradeModal
  return
}
```

### Acceptance Criteria
- Trigger 403 via API → UpgradeModal appears with correct resource name + counts
- "Upgrade to Pro" in modal redirects to Stripe Checkout
- Modal works for all 3 feature buttons (job search, cover letter, tailored resume)

---

## Test Plan
1. Set `usageCounter.jobSearches = 5` in DB → run job search → UpgradeModal appears
2. Click "Upgrade to Pro" in modal → Stripe Checkout opens
3. Complete test payment → counters still show but all pass (plan = PRO)
4. Manually set `resetAt` to prior month in DB → trigger any route → verify counters reset to 0
