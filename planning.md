# Fix: past_due_restricted + cancellation_confirmation_at

**Date:** 2026-03-15
**Scope:** 3 files + 1 DB migration

---

## Problem 1 — `past_due_restricted` is a dead state

The dunning cron sets `plan_status = 'past_due_restricted'` at Day 9.
The Vapi webhook only checks `past_due_final`. `past_due_restricted` is never evaluated.
Merchants from Day 9–13 get full, unrestricted AI service — the state machine is broken.

**Fix:** In `app/api/vapi/webhook/route.ts`, after the `past_due_final` block, detect
`past_due_restricted` and append a billing notice to every tool result. Tools still execute
(customer calls are not blocked), but each result gains a notice that the AI incorporates:
`" Note: This support line may be interrupted soon due to a payment issue."`

## Problem 2 — Day 30 FLW cancel retries indefinitely on failure

Current Day 30 block: `updates.plan_status = 'cancelled'` and clears `flw_subscription_id`
regardless of whether FLW API succeeded — local state diverges from FLW on failure.
Without attempt tracking, the cron will re-run the cancel block every day.

**Fix:** Add two columns. Restructure Day 30 block:
- `cancellation_attempted_at` = set on every attempt (throttle — 23h skip window)
- `cancellation_confirmation_at` = set ONLY on FLW HTTP 2xx
- On FLW failure: ONLY set `cancellation_attempted_at`, do NOT change `plan_status` or clear `flw_subscription_id`
- On FLW success: set all three (confirmation + attempted + cancel fields)

---

## Implementation Phases

### Phase 1 — DB Migration
ADD COLUMN `cancellation_attempted_at TIMESTAMPTZ` and `cancellation_confirmation_at TIMESTAMPTZ` on merchants.
Apply via Supabase Management API. Verify 2 new columns exist.

### Phase 2 — Dunning cron fix
`app/api/cron/dunning-check/route.ts`:
1. Add `cancellation_attempted_at` to SELECT
2. Restructure Day 30: skip if within 23h, always set `cancellation_attempted_at`, conditionally set rest on FLW success only
3. Check `flwRes.ok` — not just throw — a 4xx from FLW does NOT throw but IS a failure

### Phase 3 — Vapi webhook fix
`app/api/vapi/webhook/route.ts`:
1. After `past_due_final` guard, set `billingNotice` flag if `past_due_restricted`
2. After results array is built, map over results appending notice if flag is set
3. No early return — tools execute fully

---

## Testing Criteria

1. `npx next build` — zero errors
2. DB: 2 new columns confirmed via Supabase API
3. Dunning cron: `cancellation_attempted_at` set on attempt; FLW failure leaves `plan_status` unchanged
4. Vapi webhook: `past_due_restricted` appends notice, does NOT return early
5. Vapi webhook: `past_due_final` still returns early (no regression)

---

## Devil's Advocate Findings

| # | Bug | Severity | Evidence |
|---|-----|----------|---------|
| 1 | Collapse button at BOTTOM falls outside viewport when sidebar is collapsed | CRITICAL | Playwright click timeout: `element is outside of the viewport` |
| 2 | Sidebar "Top up →" unreachable when collapsed (same cause) | HIGH | Flows from Bug #1 |
| 3 | No best-practice icon — `ChevronUp`/`ChevronDown` wrong for sidebar toggle | MEDIUM | Should be `PanelLeftClose`/`PanelLeftOpen` (industry standard) |

---

## PHASE 1 — Move Sidebar Collapse to Top + Best-Practice Icon

### Problem
The `Collapse sidebar` / `Expand sidebar` button lives at the very bottom of the sidebar in a `border-t` footer section:
- When sidebar is **collapsed** (64px wide), the button is cut off below the viewport → users cannot expand
- Confirmed by Playwright: `element is outside of the viewport` timeout error

### Industry Best Practice
Modern dashboards (Linear, Vercel, Notion, VS Code) place the collapse toggle:
- **In the sidebar header**, top-right of the brand/logo row
- Always visible regardless of scroll position
- Icon: `PanelLeftClose` (expanded → click to close) / `PanelLeftOpen` (collapsed → click to open)
  - These are the lucide icons specifically designed for sidebar toggling
  - `PanelLeftClose` shows a panel with an arrow pointing left (collapse)
  - `PanelLeftOpen` shows a collapsed panel with an arrow pointing right (expand)

### Fix — `components/dashboard/Sidebar.tsx`

**Current layout:**
```
┌──────────────────┐
│ Logo + Brand name│  ← header
│──────────────────│
│ Nav items        │  ← nav
│──────────────────│
│ Credit widget    │
│──────────────────│
│ [Collapse btn] ← │  ← footer (WRONG — outside viewport when collapsed)
│ Powered by...    │
└──────────────────┘
```

**Target layout:**
```
┌──────────────────┐
│ Logo  Brand [⊣]  │  ← header WITH collapse button (always visible)
│──────────────────│
│ Nav items        │
│──────────────────│
│ Credit widget    │
│──────────────────│
│ Powered by...    │  ← footer (no button, just branding text)
└──────────────────┘
```

**Collapsed state:**
```
┌────┐
│Logo│
│[⊢] │  ← expand button in header row, always at top
│────│
│ ⊞  │
│ ☎  │
│ ⚡ │
│ 🎤 │
│ 💳 │
│────│
│ ⚡ │  ← credit icon (Zap)
│────│
│ ···│  ← footer text hidden
└────┘
```

**Changes:**
1. Import `PanelLeftClose`, `PanelLeftOpen` from `lucide-react` — remove `ChevronUp`, `ChevronDown`
2. Move `onToggleCollapse` button INTO the header `<div>` (same row as logo)
3. In **expanded** state: `flex items-center justify-between` — logo+name on left, `PanelLeftClose` button on right
4. In **collapsed** state: logo on top, `PanelLeftOpen` button below logo (still in header area)
5. Remove the entire `{/* Collapse toggle + footer */}` bottom section
6. Keep `Powered by Vapi + Twilio` as a standalone footer paragraph (no button wrapper)

### Files
- `components/dashboard/Sidebar.tsx`

---

## PHASE 2 — Top-Up Flow: Complete Test Payments + Verify Credit Update

### Test Plan

**Test 1 — $29 Starter (Stripe test card: 4242 4242 4242 4242)**
1. Navigate to `/dashboard/billing`
2. Click "Buy Now" on Starter → redirects to `checkout.stripe.com`
3. Fill test card: `4242 4242 4242 4242`, exp `12/34`, CVC `123`
4. Click "Pay" → redirects back to `/dashboard/billing?success=true`
5. Verify: success toast appears, balance updates (+30 min / 1800 sec)
6. Verify: credit bar fills proportionally
7. Verify: navbar CreditBadge updates in real-time
8. Verify: sidebar credit widget updates in real-time (single source of truth)

**Test 2 — $79 Growth** (same card, back button → try again)
**Test 3 — $179 Scale** (same card, back button → try again)

### Single Source of Truth Verification
Both `CreditBadge` (navbar) and the sidebar credit widget use `useCredits()` hook.
`useCredits` has a Supabase Realtime subscription on `credit_transactions`.
After Stripe webhook fires → `addCredits()` → `credit_transactions` insert → Realtime fires → both widgets update.
Verify by checking `hooks/useCredits.ts` for the subscription.

### Files to Verify (read-only)
- `hooks/useCredits.ts` — confirm Realtime subscription exists

---

## Execution Order

1. **Phase 1** — Sidebar collapse relocation (single file, unblocks UX)
2. **Phase 2** — Test payments via Playwright + credit verification
3. **Deploy** — Build + Vercel deploy
4. **Post-deploy** — Playwright verification of all flows

---

## Testing Criteria

- **Phase 1**: Collapse/expand button visible at top in both sidebar states; icon is `PanelLeftClose`/`PanelLeftOpen`; button never falls outside viewport
- **Phase 2**: All 3 plans open Stripe checkout; test payment completes; success toast shows; credit balance increments correctly; both widgets reflect new balance within 3 seconds

---

## What Does NOT Change

- `useMerchant`, `useCredits` hook internals — only visual sidebar changes
- Stripe webhook handler — already correct
- `addCredits` function — already correct
- `CreditBadge` component — already a link (fixed earlier)
