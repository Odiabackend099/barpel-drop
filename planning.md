# Planning: BE-007, BE-008, SE-007, AF-007, AF-008, BI-012, FE-006, FE-007, FE-008, IN-007

**Date:** 2026-04-07
**Tickets:** BE-007, BE-008, SE-007, AF-007, AF-008, BI-012, FE-006, FE-007, FE-008, IN-007
**Principle:** 3-step — Plan → planning.md → Execute phase by phase

---

## Phase 1 — BE-007: Replace module-level Upstash client in forwarding route

### Problem
`app/api/merchant/forwarding/route.ts` initialises `new Ratelimit(...)` at module level
using `Redis.fromEnv()`. If Upstash env vars are missing the module crashes on import.
The rest of the codebase uses the shared `rateLimit()` helper from `lib/rate-limit.ts`
which is already fail-open and consistent.

### File
- `app/api/merchant/forwarding/route.ts`

### Implementation
- Remove `import { Ratelimit } from "@upstash/ratelimit"`, `import { Redis } from "@upstash/redis"`, and the module-level `ratelimit` const
- Replace the `ratelimit.limit(user.id)` call with `await rateLimit(\`rl:forwarding:${user.id}\`, 10, 60)`
- Add `import { rateLimit } from "@/lib/rate-limit"` at top
- Keep the same fail-open try/catch and 429 response shape

### Constraints
- Must keep same rate limit (10 per 60s per user)
- Must keep fail-open behaviour

### Testing Criteria
- No module-level Redis/Ratelimit instantiation
- Build passes

---

## Phase 2 — BE-008: Standardise IP extraction across routes

### Problem
- `app/api/contact/route.ts:80` uses `x-forwarded-for`
- `app/api/chat/widget/route.ts:129` uses `cf-connecting-ip`
Inconsistent — one works on Vercel (behind Cloudflare), the other doesn't.
`cf-connecting-ip` is the most accurate on Cloudflare; fallback to `x-forwarded-for`.

### Files
- `app/api/contact/route.ts` — update IP extraction

### Implementation
Change contact route from:
```typescript
const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
```
To:
```typescript
const ip = req.headers.get("cf-connecting-ip")
  ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  ?? "unknown";
```

### Constraints
- widget route already correct — only contact needs updating

### Testing Criteria
- `cf-connecting-ip` checked first in contact route
- Build passes

---

## Phase 3 — SE-007: Improve PII phone redaction regex

### Problem
`lib/security.ts:98` — current phone regex:
`/(\+?\d{1,4})\d{4}(\d{4,})/g` misses formats like `(234) 567-8901`, `234.567.8901`,
or international numbers with spaces e.g. `+44 7911 123456`.

### File
- `lib/security.ts` — `redactPii()` function

### Implementation
Add patterns for formatted phone numbers before the existing ones:
```typescript
// Formatted phone numbers: (123) 456-7890, 123-456-7890, 123.456.7890
.replace(/\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}/g, "[PHONE_REDACTED]")
// International with spaces: +44 7911 123 456
.replace(/\+\d{1,3}[\s](\d[\s]?){7,12}/g, "[PHONE_REDACTED]")
```
Keep the existing patterns as additional fallbacks.

### Constraints
- Must not break existing redaction
- Must not over-redact (e.g. dates like 2026.04.07)

### Testing Criteria
- `(234) 567-8901` → `[PHONE_REDACTED]`
- `+44 7911 123456` → `[PHONE_REDACTED]`
- `2026.04.07` → unchanged
- Build passes

---

## Phase 4 — AF-007: Gate Tapfiliate script on cookie consent

### Problem
`app/layout.tsx:63-70` — Tapfiliate tracking script fires for ALL visitors, including EU users.
This violates GDPR — tracking requires consent before firing.

### File
- `app/layout.tsx`

### Implementation
Add `strategy="lazyOnload"` to the Script tag and wrap it with a consent check.
Next.js doesn't have a built-in consent manager, but we can use a simple approach:
change the Script strategy from `"afterInteractive"` to `"lazyOnload"` and add a
`data-cookieconsent="statistics"` attribute. This marks it for consent managers.

More importantly: move `tap('detect')` inside a check for a consent cookie:
```typescript
<Script id="tapfiliate-js" strategy="afterInteractive">
  {`(function(t,a,p){t.TapsAssocId="63365-6bd0a5";t.TapfiliateObject=a;t[a]=t[a]||function(){
(t[a].q=t[a].q||[]).push(arguments)};var s=p.createElement('script');s.async=true;
s.src='https://script.tapfiliate.com/tapfiliate.js';var r=p.getElementsByTagName('script')[0];
r.parentNode.insertBefore(s,r)})(window,'tap',document);
tap('create','63365-6bd0a5',{integration:'javascript'});
if(document.cookie.indexOf('tap_consent=1')>-1){tap('detect');}`}
</Script>
```
This ensures `tap('detect')` (which reads the `?tap_a=` referral param and sets a cookie)
only fires if the user has given consent. The `tap('create')` still fires to initialise
the object, but no tracking data is sent until consent.

### Constraints
- Must not break existing Tapfiliate tracking for users who consent
- `tap('create')` can still fire — it's the `tap('detect')` that reads/sets cookies

### Testing Criteria
- `tap('detect')` only called if `tap_consent=1` cookie present
- Build passes

---

## Phase 5 — AF-008: Add retry + error logging to Tapfiliate conversion

### Problem
`app/api/dodo/webhook/route.ts:156-172` — Tapfiliate `createConversion()` logs errors
but has no retry. If the Tapfiliate API is temporarily down, the commission is lost
with no way to recover.

### File
- `app/api/dodo/webhook/route.ts` — lines 156-172

### Implementation
Wrap the `createConversion` call with the existing `withRetry` utility (already imported
in other routes — check if available in this file, import if not):
```typescript
const result = await withRetry(() => createConversion({
  customer_id: merchantRow?.user_id ?? tx.merchant_id,
  external_id: txRef,
  amount: planAmount,
}), { retries: 3, delayMs: 1000 });
if (!result.ok) {
  console.error("[dodo/webhook] Tapfiliate conversion failed after retries:", result.error,
    { merchant_id: tx.merchant_id, txRef });
}
```

### Constraints
- Must stay inside the existing try/catch — never throw
- Log enough context (merchant_id, txRef) to manually recover if all retries fail

### Testing Criteria
- Conversion retries up to 3 times before logging failure
- Build passes

---

## Phase 6 — BI-012: Verify DODO env var naming consistency

### Finding from research:
- `lib/env.ts` uses `DODO_PAYMENTS_*` (DODO_PAYMENTS_API_KEY, etc.)
- `lib/constants.ts` uses `DODO_PRODUCT_ID_*` (bare DODO_ prefix for product IDs)
- All `process.env.DODO_PAYMENTS_*` calls are consistent in billing routes

### Action
Add the `DODO_PRODUCT_ID_*` vars to `lib/env.ts` serverSchema so they're validated
at startup — currently they fall back to `""` silently if missing.

### File
- `lib/env.ts`

### Implementation
Add to serverSchema:
```typescript
DODO_PRODUCT_ID_STARTER_MONTHLY: z.string().min(1),
DODO_PRODUCT_ID_STARTER_ANNUAL: z.string().min(1),
DODO_PRODUCT_ID_GROWTH_MONTHLY: z.string().min(1),
DODO_PRODUCT_ID_GROWTH_ANNUAL: z.string().min(1),
DODO_PRODUCT_ID_SCALE_MONTHLY: z.string().min(1),
DODO_PRODUCT_ID_SCALE_ANNUAL: z.string().min(1),
```

Wait — adding these as required would break local dev if they're not set.
Make them optional with empty default (matching current constants.ts behaviour):
```typescript
DODO_PRODUCT_ID_STARTER_MONTHLY: z.string().default(""),
DODO_PRODUCT_ID_STARTER_ANNUAL: z.string().default(""),
...
```

### Constraints
- Must not break builds where these are not set

### Testing Criteria
- Build passes
- Ticket marked resolved

---

## Phase 7 — FE-006, FE-007, FE-008: Fix dead href="#" links

### Files
- `app/about/page.tsx:293, 296` — 2 social media links
- `app/data-processing/page.tsx:99` — Subprocessors link
- `app/(marketing)/developer-tools/page.tsx:341` — Developer tools link

### Implementation
Read each file to find the dead links and their context:
- Social media links → replace with real Barpel social URLs or remove the anchor
- Subprocessors link → point to `/privacy` or `/data-processing` (relevant policy page)
- Developer tools link → point to relevant docs or remove

### Constraints
- Do not guess URLs — use placeholders like `/coming-soon` or remove href if no real URL exists

### Testing Criteria
- No `href="#"` in these files
- Build passes

---

## Phase 8 — IN-007: Document Playwright 1-worker constraint

### File
- `playwright.config.ts`

### Implementation
Add a comment above the `workers: 1` config explaining why:
```typescript
// workers: 1 — intentional: Vapi/Shopify sandbox APIs have strict rate limits.
// Running tests in parallel causes 429s and flaky results.
// Do not increase without adding per-test delays or using separate API keys.
workers: 1,
```

### Testing Criteria
- Comment present
- Build passes

---

## Execution Order

1. Phase 1 — BE-007 (swap module-level Ratelimit → shared rateLimit helper)
2. Phase 2 — BE-008 (standardise IP header in contact route)
3. Phase 3 — SE-007 (add formatted phone patterns to PII redaction)
4. Phase 4 — AF-007 (gate tap('detect') on consent cookie)
5. Phase 5 — AF-008 (retry + better logging on Tapfiliate conversion)
6. Phase 6 — BI-012 (add DODO product ID vars to env.ts)
7. Phase 7 — FE-006, FE-007, FE-008 (fix dead href="#" links)
8. Phase 8 — IN-007 (document Playwright worker constraint)
9. Gate — npx next build (zero TS errors required)

---

# Planning: Senior Engineer Fixes — 15 Issues (cron + abandoned cart)

## Phase A — 039_pg_cron_dial_pending.sql (Issues #1, #2, #3)
- #1: Remove `WITH SCHEMA extensions` from CREATE EXTENSION pg_net
- #2: Add cron.unschedule guard before cron.schedule to prevent duplicate jobs on re-run
- #3: Wrap Vault subquery — skip http_get if secret is NULL

## Phase B — dial-pending/route.ts (Issues #5, #6, #7, #8, #9, #10)
- #5: Fix stale comment (every minute → every 15 min via Supabase pg_cron)
- #6: Recoverable failures (no credits, no vapi config) → status `skipped` not `failed`
- #7: Add .order("scheduled_for", ascending: true) before .limit(10)
- #8: Add MAX_ATTEMPTS = 3 guard — permanent fail after 3 attempts
- #9: Move all skip/fail updates before the loop body to avoid partial state
- #10: Replace unsafe cast with typed interface

## Phase C — abandoned-cart/route.ts (Issues #11, #12, #13, #14, #15)
- #11: E164 validate customer_phone before insert
- #12: Strip non-numeric chars before parseFloat on total_price
- #13: Merge two integrations DB queries into one
- #14: Add shipping_address.phone fallback
- #15: Dedup on customer_phone in addition to customer_email
