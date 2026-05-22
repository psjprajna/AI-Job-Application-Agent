# Spec 008 — Pricing Section on Landing Page

## Status: APPROVED

## Goal
Add a pricing section to the existing landing page (`app/page.tsx`) between the "How It Works" section and the final CTA. Displays Free vs Pro cards with accurate limits and upgrade CTA.

---

## Slice E — Landing Page Pricing Section

### Files Touched
- `app/page.tsx` (UPDATE — insert pricing section)

### Section Layout

```
PRICING
───────────────────────────────────────────
Choose the plan that fits your job search.

  FREE                    PRO
  ──────────────────      ──────────────────
  $0 / month              $19 / month
  ─────────────           ─────────────────
  ✓ 1 resume upload       ✓ Unlimited resumes
  ✓ 5 job searches/mo     ✓ Unlimited searches
  ✓ 3 cover letters/mo    ✓ Unlimited content gen
  ✓ 3 tailored resumes/mo ✓ Priority support
  ✗ Unlimited access      ✓ Full AI pipeline

  [Get Started →]         [Upgrade to Pro →]
  (links to /sign-up)     (links to /sign-up or
                           /api/stripe/checkout
                           if logged in)
```

### Design Tokens to Use
- Card background: `var(--ja-bg3)` (white in light, dark surface in dark)
- Pro card: accent border `var(--ja-accent)` + accent header background
- Text: `var(--ja-text)` / `var(--ja-text2)`
- Pro badge: `var(--ja-accent)` background
- Checkmarks: `var(--ja-green)` / X marks: `var(--ja-text3)`
- Follows existing landing page section pattern (same padding, heading style as "Features" section)

### Acceptance Criteria
- Pricing section renders between "How It Works" and final CTA
- Free card shows all correct limits
- Pro card highlighted with accent border/color
- "Get Started" → `/sign-up`
- "Upgrade to Pro" → `/sign-up` (for landing page, unauthenticated visitors)
- Responsive: cards stack vertically on mobile, side-by-side on md+
- Dark mode works correctly with design tokens

---

## Test Plan
1. Visual review at localhost:3000 in light + dark mode
2. Check mobile viewport (375px) — cards stack
3. Check desktop (1280px) — cards side by side
4. Click both CTAs — correct routing
