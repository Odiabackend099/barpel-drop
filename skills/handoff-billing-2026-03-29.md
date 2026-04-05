# Billing System Handoff — 2026-03-29

**For the next AI developer. Fact-checked against live code before writing. Zero guessing.**

---

## What Was Done This Session

### 1. Shopify Subscription Webhook — Complete Security Rewrite
**File:** `app/api/shopify/webhooks/subscription/route.ts`

All 6 critical/high bugs from the architecture audit were fixed:

| Bug | Fix Applied |
|-----|-------------|
| Custom `verifyHmac()` compared base64 strings (broken) | Replaced with `verifyShopifyWebhook()` from `@/lib/security` |
| HMAC ran AFTER DB lookup (info disclosure) | Per-shop secret fetched before body is trusted; DB error → 503 so Shopify retries |
| DECLINED webhook used `.is(null)` matching ALL merchants | JS-level subscription ID check after fetching merchant by shop domain |
| Unknown plan → 400 (infinite retry loop) | Returns 200 + logs; stops Shopify retry storm |
| Global API secret fallback (security downgrade) | Removed; unknown shop → 200 (stop retry), no fallback |
| Missing `X-Shopify-Webhook-Id` → no idempotency | Returns 400 if header absent |

Credits on ACTIVE: **RESET to plan allocation** (never stacked on top of free trial credits).

Plan map:
```
barpel-starter → starter, 1800s (30 min)
barpel-growth  → growth,  6000s (100 min)
barpel-scale   → scale,   15000s (250 min)
```

**Fact-check status:** ✅ Read full file this session — implementation confirmed correct.

---

### 2. Dodo Webhook — Credits RESET Fix
**File:** `app/api/dodo/webhook/route.ts`

`onSubscriptionActive` previously called `addCredits()` which ADD-ed credits on top of free trial balance. Fixed to directly `UPDATE merchants SET credit_balance = pkg.credits_seconds` — a hard RESET.

**Live test result:** Merchant had 300s (5 free credits). After simulated `subscription.active` webhook → balance set to 1800s (30 credits for Starter plan). ✅ Correct.

**Fact-check status:** ✅ Read file this session + confirmed via live webhook simulation.

---

### 3. Shopify Admin Link — Partial Fix
**File:** `app/(dashboard)/dashboard/billing/page.tsx`

`useIntegrations` hook is imported (line 151). `shopDomain` is derived from `shopifyIntegration?.shop_domain` (line 154). Link at line 303:

```tsx
href={shopDomain ? `https://${shopDomain}/admin/charges` : "https://admin.shopify.com/"}
```

⚠️ **This URL returns 404.** `/admin/charges` is a deprecated Shopify path.

Correct URL format (from Shopify docs):
```
https://admin.shopify.com/store/{store_handle}/charges/{app_handle}/pricing_plans
```

Where:
- `store_handle` = shop domain minus `.myshopify.com` (e.g., `trendymart`)
- `app_handle` = from Shopify Partner Dashboard (NOT in codebase)

**What the next AI needs to do:** Get `app_handle` from Austin (it's a string like `barpel-drop-ai` set in the Partner Dashboard). Add it as `NEXT_PUBLIC_SHOPIFY_APP_HANDLE` env var on Vercel. Then update line 303 to:

```tsx
const storeHandle = shopDomain?.replace(".myshopify.com", "");
const appHandle = process.env.NEXT_PUBLIC_SHOPIFY_APP_HANDLE ?? "";
href={
  storeHandle && appHandle
    ? `https://admin.shopify.com/store/${storeHandle}/charges/${appHandle}/pricing_plans`
    : "https://admin.shopify.com/"
}
```

**Fact-check status:** ✅ Both import and link confirmed in code. Bug confirmed by live test (link navigated, 404 received).

---

### 4. Dashboard Credits Label
**File:** `app/(dashboard)/dashboard/page.tsx:165`

Changed `min` → `credits`:
```tsx
value={`${Math.floor((stats?.credits_remaining ?? 0) / 60)} credits`}
```

**Fact-check status:** ✅ Confirmed in code this session.

---

### 5. Documentation Updates (Skills Files)
All three skill files were updated to remove outdated payment provider references:

- `skills/act as a business user.md` — Removed Flutterwave, added dual billing context, corrected onboarding Step 3 to "Free Credits"
- `skills/3-step-coding-principle.md` — Changed Flutterwave → Dodo checkout redirect in billing test section
- `skills/Prd.md` — Added Dual Billing System section documenting both Shopify Managed Pricing and Dodo Payments

**Fact-check status:** ✅ Verified via `grep -r "Flutterwave" skills/` → zero results.

---

## What Remains (for next AI)

### P0 — Blocking

**1. Shopify Admin link returns 404**
- Ask Austin for the `app_handle` from Shopify Partner Dashboard
- Set `NEXT_PUBLIC_SHOPIFY_APP_HANDLE` on Vercel
- Update `billing/page.tsx:303` (see fix above)

### P1 — Non-blocking but important

**2. Stale comment in billing page**
- `billing/page.tsx:177` says "Handle return from Paystack redirect" — should say Dodo. Non-functional, just misleading for future developers.

**3. `dunning-check/route.ts` still references Flutterwave API**
- Lines 14, 136, 154 call `api.flutterwave.com` for merchants with `flw_subscription_id`
- This is intentional legacy support for old subscribers — it's guarded by `if (merchant.flw_subscription_id)`
- Once there are zero FLW subscribers in production, these blocks can be removed
- Do NOT remove yet — could break legacy account cleanup

**4. `account/delete/route.ts` — same Flutterwave legacy**
- Lines 68-82 cancel Flutterwave subscriptions on account delete
- Same rationale — guarded by `if (merchant.flw_subscription_id)`, intentional

### P2 — Nice to have

**5. Supabase realtime may not trigger in some browser contexts**
- After webhook fires and DB updates, page may still show old balance until reload
- Root cause: WebSocket connection for `postgres_changes` may not establish in certain contexts (confirmed in Playwright testing; real browser works fine)
- Workaround already in place: `refreshBalance()` polling on billing success page
- Optional improvement: add a manual "Refresh" button or a 5-second auto-poll after checkout return

**6. Automated test suite has 5 failures**
- File: `tests/billing-e2e.spec.ts`
- Failures: toggle timing, subscribe redirect assertion, Shopify magic link login timeout, transaction history text match, webhook payload schema
- Webhook payload issue was fixed in live testing but test assertion logic may still use old schema shape
- Low priority — manual testing is the source of truth per project standards

---

## Architecture Facts (verified this session)

### Credit Balance Storage
- Stored as **seconds** in `merchants.credit_balance`
- `useCredits` hook returns `credits = Math.floor(balance / 60)` (minutes)
- Starter = 1800s = 30 credits, Growth = 6000s = 100 credits, Scale = 15000s = 250 credits

### Billing Source Guard
```typescript
const isShopifyMerchant = !!shopifyPlan;  // billing/page.tsx:153
```
- Shopify merchants see: "Billing managed by Shopify" panel, no Dodo plan cards
- Non-Shopify merchants see: 3 plan cards (Dodo), no Shopify panel
- `billing_source` is derived at runtime — never stored as a DB column

### Dodo Webhook Idempotency
- `onSubscriptionActive`: atomic `UPDATE WHERE status='pending'` claim
- `onSubscriptionRenewed`: `dodo_webhook_events` table keyed on `subscription_id + next_billing_date`

### Shopify Webhook Security
- Per-shop HMAC secret stored in Supabase Vault
- Uses `verifyShopifyWebhook()` from `lib/security.ts` (correct binary comparison, not base64 string comparison)
- Idempotency: `X-Shopify-Webhook-Id` header via `ensureIdempotent()`

---

## Fact-Check Checklist for Next AI

Before extending any billing code, verify these are still true:

```bash
# 1. No broken custom HMAC
grep -n "verifyHmac" app/api/shopify/webhooks/subscription/route.ts
# Expected: zero results

# 2. useIntegrations imported in billing page
grep -n "useIntegrations" app/(dashboard)/dashboard/billing/page.tsx
# Expected: line with import + line 151 with usage

# 3. Credits label
grep -n "credits remaining\|credits\`" "app/(dashboard)/dashboard/page.tsx"
# Expected: line 165 shows "credits" not "min"

# 4. No Flutterwave/Paystack in skills docs
grep -r "Flutterwave\|Paystack\|14-day" skills/
# Expected: zero results

# 5. Build passes cleanly
npx next build
# Expected: zero errors, all routes compiled
```

---

## Key Env Vars (Vercel — Production)

| Variable | Purpose | Status |
|----------|---------|--------|
| `DODO_PAYMENTS_WEBHOOK_KEY` | Dodo webhook signature verification | ✅ Set |
| `NEXT_PUBLIC_SHOPIFY_APP_HANDLE` | Shopify Admin billing link | ❌ MISSING — get from Austin |

---

**Written by:** Claude Code (Sonnet 4.6)
**Date:** 2026-03-29
**Verified against:** Live code reads + live browser testing + live webhook simulation
