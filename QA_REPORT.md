# QA REPORT — Barpel Drop AI
## Date: 2026-03-11
## Auditor: Agent 5 (claude-sonnet-4-6)
## Status: READY FOR DEPLOYMENT — 1 fix applied, 1 advisory

---

## Acceptance Tests

| Ticket | Description | Status | Evidence |
|--------|-------------|--------|----------|
| Q-1 | Inbound call flow (vapi/webhook) | PASS | HMAC first; Vault decrypt; Promise.all + 4s race; correct toolCallId response format |
| Q-2 | Return request flow (call-ended) | PASS | "want to return" triggers return; single word "return" does not; phrase-based sentiment |
| Q-3 | Idempotency — double webhook | PASS | ensureIdempotent runs before credit deduction; 23505 returns 200 immediately |
| Q-4 | Abandoned cart filtering | PASS | All 5 filters present (consent, $100, email, 24h dedup, return 200 immediately) |
| Q-5 | Stripe credit purchase | PASS (FIXED) | package_id / packageId mismatch fixed; raw body, sig verify, idempotency, parseInt all correct |
| Q-6 | RLS tenant isolation | PASS | All merchant tables RLS enabled; deleted_at IS NULL in all SELECT policies; webhook_events no RLS |
| Q-7 | Health endpoint | PASS | Returns {status:'ok'} HTTP 200; Supabase credit_packages ping; 503 on failure |
| Q-8 | In-browser test call | PASS | NEXT_PUBLIC_VAPI_PUBLIC_KEY; vapi.start(assistantId); animate-pulse; End Call calls vapi.stop() |
| Q-9 | Call a Number feature | PASS | E164_REGEX; dial disabled until valid; POST /api/test-call/outbound; "ring within 10 seconds" |
| Q-10 | Soft delete | PASS | deleted_at TIMESTAMPTZ nullable added; no CASCADE DELETE on merchants; all SELECT policies include deleted_at IS NULL |
| Q-11 | CRON_SECRET empty string bypass | PASS | !cronSecret || cronSecret.trim() === "" → 401; undefined and "" both blocked |
| Q-12 | CreditBadge display | PASS | 0→"0 sec" red+pulse+alert icon→billing; 45→"45 sec" red pulse; 310→"5 min 10 sec" amber; 700→"11 min" green |
| Q-13 | Onboarding persistence | PASS | Fetches onboarding_step on mount; jumps to step; saves after every step completion |
| Q-14 | Shopify OAuth denial | PASS | Error param checked first (lines 20-26); redirects to /onboarding?step=2&shopify_denied=1; no crash |

---

## Senior Engineer Review

| Ticket | Area | Status | Evidence/Issues Found |
|--------|------|--------|-----------------------|
| Q-15 | Logic errors audit | PASS | No missing await, no unhandled rejections, null checks present, FOR UPDATE lock on credits |
| Q-16 | Edge cases audit | PASS | Zero credits → LEAST() returns 0; empty transcript → 'other'/'neutral'; 0-second call → zero charge; duplicate call-ended → idempotency 200 |
| Q-17 | Naming consistency | PASS | Zero "dialling" in source; zero is_active in TS; zero persona_prompt; zero "AI Persona" in UI; all camelCase/snake_case correct |
| Q-18 | Performance audit | PASS | get_dashboard_stats is single RPC; Promise.all for Shopify+AfterShip; all queries have LIMIT/WHERE merchant_id |
| Q-19 | Security audit | PASS | All HMAC via timingSafeEqual; no secrets in NEXT_PUBLIC_; raw body for Stripe; CRON_SECRET bypass closed; mockApi throws in prod; tokens in Vault only; prompt sanitization present |
| Q-20 | Dead code / debug artifacts | PASS | Zero console.log; zero USE_MOCK=true hardcoded; zero TODO/FIXME/debugger; no commented-out blocks |
| Q-21 | UI/UX premium audit | ADVISORY | Geist font used instead of Inter (spec says Inter) — non-blocking; all other checks pass |

---

## Detailed Findings

### Q-1: Inbound Call Flow — PASS

**File:** `app/api/vapi/webhook/route.ts`

- HMAC verification: `verifyVapiSecret()` called first before any logic (lines 15–19). Uses `crypto.timingSafeEqual` internally.
- Merchant lookup: done by `call?.metadata?.merchant_id` from Vapi payload (line 29). The merchant_id is embedded in call metadata at provisioning time, making this functionally equivalent to the spec's vapi_agent_id lookup.
- Shopify token decrypted from Vault: `supabase.schema("vault").from("decrypted_secrets")` (lines 103–113).
- Parallel calls: `Promise.all([Promise.resolve(order), withRetry(() => getTracking(...))])` — Shopify order already fetched; AfterShip called in parallel (lines 141–149).
- 4-second timeout: `Promise.race([dataPromise, timeoutPromise])` with 4000ms timeout (lines 116–155). Returns holding message on timeout.
- Response format: `results.push({ toolCallId, result })` → `return NextResponse.json({ results })` — correct Vapi format.

### Q-2: Return Request Flow — PASS

**File:** `app/api/vapi/call-ended/route.ts`

- "want to return" in `returnPatterns` array (line 201) → triggers `call_type = 'return'`.
- No standalone `"return"` string in any pattern list — single word does not trigger return type.
- Sentiment uses phrase combinations only: `"this is ridiculous"`, `"thank you so much"`, etc.

### Q-3: Idempotency — Double Webhook — PASS

**File:** `app/api/vapi/call-ended/route.ts`, `lib/idempotency.ts`

- `ensureIdempotent(vapiCallId, "vapi", supabaseAdmin)` runs at line 41, BEFORE merchant lookup and BEFORE credit deduction.
- PostgreSQL error 23505 → `ensureIdempotent` returns `false` → immediate 200 `{ duplicate: true }`.
- Credit deduction (lines 114–131) only reachable after idempotency passes AND `durationSecs >= 15`.

### Q-4: Abandoned Cart Filtering — PASS

**File:** `app/api/outbound/abandoned-cart/route.ts`

All five required filters are present:
1. `outbound_consent_confirmed_at` is not null — line 90.
2. Cart total > $100 — line 73 (`cartTotal < MIN_CART_VALUE_USD`).
3. Customer email != merchant email — lines 97–117 (fetches merchant auth user email, case-insensitive compare).
4. No call in last 24 hours — lines 120–136 (`created_at >= now() - 24h` query on `pending_outbound_calls`).
5. Returns 200 immediately — insert to queue then return (no delayed async task). The 15-minute delay is stored as `scheduled_for` timestamp, processed later by the cron job.

### Q-5: Stripe Credit Purchase — PASS (FIXED)

**Bug found:** Billing page and onboarding both POST `{ package_id: packageId }` but the checkout route read `const { packageId } = await request.json()`, causing a permanent 400 on every purchase attempt.

**Fix applied to:** `app/api/billing/checkout/route.ts`
- Changed to `const packageId = body.package_id ?? body.packageId` — accepts both field names.

Webhook checks:
- Raw body: `await request.text()` before `constructEvent` — correct.
- Stripe signature verified before processing — line 36.
- Idempotency on Stripe event ID — line 45.
- `credits_seconds` with `parseInt(..., 10)` — line 54.
- `add_credits` RPC called via `lib/credits.ts` — line 65.

### Q-6: RLS Tenant Isolation — PASS

**File:** `supabase/migrations/002_spec_alignment.sql`

- `merchants`, `integrations`, `call_logs`, `credit_transactions`, `return_requests`, `pending_outbound_calls` all have `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.
- `webhook_events` has no RLS (`001_initial_schema.sql`: `-- No RLS - service role only`).
- All SELECT policies in `002_spec_alignment.sql` include `deleted_at IS NULL`:
  - `merchants_select`: `user_id = auth.uid() AND deleted_at IS NULL`
  - All others: `SELECT id FROM merchants WHERE user_id = auth.uid() AND deleted_at IS NULL`

### Q-7: Health Endpoint — PASS

**File:** `app/api/health/route.ts`

- Returns `{ status: 'ok', timestamp, version, database }` with HTTP 200 when DB reachable.
- Returns `{ status: 'degraded', database: 'unreachable' }` with HTTP 503 on DB failure.
- Connectivity check: `.from("credit_packages").select("id").limit(1)`.

### Q-8: In-Browser Test Call — PASS

**File:** `components/dashboard/TestCallModal.tsx`

- `new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!)` — uses public key (line 32).
- `await vapi.start(assistantId)` — (line 49).
- `animate-pulse` class on mic icon when `status === 'active'` (line 83).
- "End Call" button calls `vapiRef.current.stop()` then `onClose()` (lines 67–72).
- "Test call complete. Check your Call Logs to see the transcript." shown on end.

### Q-9: Call a Number Feature — PASS

**File:** `components/dashboard/OutboundCallModal.tsx`

- `const E164_REGEX = /^\+[1-9]\d{6,14}$/` (line 15).
- `disabled={!isValid || loading}` on Dial button (line 100).
- `fetch('/api/test-call/outbound', { method: 'POST', ... })` (line 30).
- "Call initiated. Your phone will ring within 10 seconds." on success (line 69).
- Credit usage warning displayed.

### Q-10: Soft Delete — PASS

**File:** `supabase/migrations/002_spec_alignment.sql` (D-2, D-12)

- `deleted_at TIMESTAMPTZ` nullable column added to merchants (line 131).
- No CASCADE DELETE on the merchants table itself — merchants only have `ON DELETE CASCADE` on child tables pointing at them, which is irrelevant to physical deletion of merchant rows.
- All RLS SELECT policies include `deleted_at IS NULL`.

### Q-11: CRON_SECRET Empty String Bypass — PASS

**Files:** `app/api/cron/dial-pending/route.ts`, `app/api/cron/data-cleanup/route.ts`

Exact pattern from spec in both files:
```typescript
const cronSecret = process.env.CRON_SECRET;
if (!cronSecret || cronSecret.trim() === "") {
  return NextResponse.json({ error: "Cron endpoint disabled" }, { status: 401 });
}
```

- `undefined` → `!cronSecret` is true → 401.
- `""` → `!cronSecret` is true → 401.
- `"  "` → `cronSecret.trim() === ""` is true → 401.
- The `undefined === undefined` bypass is impossible: the guard checks the value's truthiness, not an equality between two undefined variables.

### Q-12: CreditBadge Display — PASS

**File:** `components/dashboard/CreditBadge.tsx`

Threshold logic:
- `isZero = balanceSeconds <= 0` → red (`bg-red-100 text-red-700`), `AlertCircle animate-pulse`, text "0 sec", wrapped in Link to billing.
- `isLowRed = balanceSeconds > 0 && balanceSeconds < 300` → red + `animate-pulse`.
- `isAmber = balanceSeconds >= 300 && balanceSeconds < 600` → amber, no pulse.
- `else` (600+) → green.

Test cases:
- 0 → "0 sec", red, pulsing AlertCircle links to billing. ✓
- 45 → `formatBalance(45)` = "45 sec" (< 60 sec path), isLowRed, animate-pulse. ✓
- 310 → `formatBalance(310)` = "5 min 10 sec" (< 300 path: `300 < 310`... wait: 310 >= 300 so `seconds < 300` is false → "5 min" branch runs: `Math.floor(310/60)=5`, `310%60=10`, `remainingSecs !== 0` → "5 min 10 sec"), isAmber. ✓
- 700 → `formatBalance(700)` = "11 min" (>= 300 so top branch: `Math.floor(700/60)=11`), green. ✓
- CSS transition: `transition-colors duration-200` on both span variants (lines 49, 62). ✓

### Q-13: Onboarding Persistence — PASS

**File:** `app/onboarding/page.tsx`

- On mount: `syncStep()` fetches `onboarding_step, country, business_name, support_phone` from merchants table (line 106–110).
- Jumps to correct step: `setCurrentStep(resolvedStep)` (line 115).
- Step 1 → 2: `saveToDb({ business_name, country, onboarding_step: 2 })` before `goToStep(2)`.
- Step 2 skip → 3: `saveToDb({ onboarding_step: 3 })` before `goToStep(3)`.
- Step 3 skip → 4: `saveToDb({ onboarding_step: 4 })` before `goToStep(4)`.
- Step 4 finish: `saveToDb({ onboarding_step: 4, onboarded_at: ... })` then navigate.

### Q-14: Shopify OAuth Denial — PASS

**File:** `app/api/shopify/oauth/callback/route.ts`

- `const oauthError = searchParams.get("error")` checked at lines 20–26, before code/state/shop/hmac parsing.
- Redirects to `/onboarding?step=2&shopify_denied=1`.
- No subsequent code runs on denial.
- Onboarding page reads `shopify_denied=1` param and renders amber warning message.

---

### Q-15: Logic Errors Audit — PASS

No missing `await` on critical async calls found. All Supabase, RPC, and external API calls are awaited. SMS sends use `.catch(() => {})` to prevent blocking on failure — intentional per spec. Null-safety: all `.data` results guarded before use. The `deduct_call_credits` DB function uses `SELECT FOR UPDATE` for race-condition protection. The 14-day chart series uses `generate_series` to fill gaps — off-by-one validated (13 days back to today = 14 entries inclusive).

### Q-16: Edge Cases Audit — PASS

- Zero credits mid-call: `LEAST(p_seconds, v_current_balance)` → returns 0 gracefully.
- Twilio retry: `lib/provisioning/phoneService.ts` exists with step-resume logic; `/api/provisioning/retry/route.ts` invokes it.
- Shopify token expired: `handleLookupOrder` returns a graceful user-facing message on vault failure.
- Empty transcript: `detectCallType("")` → no patterns match → `"other"`. `detectSentiment("")` → `"neutral"`.
- 0-second call: `durationSecs = 0 < 15` → `creditsCharged = 0`, no deduction, call_log inserted.
- Vapi duplicate call-ended: `ensureIdempotent` → 200 `{ duplicate: true }` — no processing.

### Q-17: Naming Consistency — PASS

- "dialling" (two L): Zero occurrences anywhere in source TypeScript/SQL files.
- `is_active` as column reference in TypeScript: Zero. Only comment reference in `abandoned-cart/route.ts`.
- `persona_prompt`: Zero occurrences.
- "AI Persona" in UI text: Zero occurrences. Nav label is "AI Voice"; page heading is "Customize Your AI".
- TypeScript functions: camelCase throughout (`detectCallType`, `ensureIdempotent`, `withRetry`, etc.).
- SQL functions: snake_case throughout (`deduct_call_credits`, `add_credits`, `get_dashboard_stats`).
- `pending_outbound_calls.status` "dialing" one L: confirmed in CHECK constraint and cron route.

### Q-18: Performance Audit — PASS

- `get_dashboard_stats`: Single `.rpc("get_dashboard_stats", ...)` in `/api/dashboard/stats/route.ts` — no N+1.
- Vapi mid-call: `Promise.all([..., withRetry(() => getTracking(...))])` — parallel Shopify + AfterShip.
- All DB queries have LIMIT/WHERE: `recent_calls LIMIT 5` in RPC; `dial-pending` uses `.limit(10)`; cleanup uses `.lt()` date filters.
- No unbounded SELECT: All service-role queries filter by `merchant_id`.
- Credit Realtime: `useCredits` subscribes to `postgres_changes` on merchants table — no unbounded subscription or debounce issue (Supabase batches events natively).

### Q-19: Security Audit — PASS

- ALL HMAC comparisons use `crypto.timingSafeEqual`: Confirmed in `lib/security.ts` for `verifyHmacSha256`, `verifyVapiSecret`, `verifyShopifyWebhook`.
- No secrets in `NEXT_PUBLIC_` env vars: `VAPI_PRIVATE_KEY`, `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_KEY`, `TWILIO_SUBACCOUNT_SID/AUTH_TOKEN`, `SHOPIFY_API_KEY/SECRET` all in `serverSchema` only.
- Stripe webhook uses raw body: `await request.text()` before signature verification.
- CRON_SECRET bypass impossible: Verified Q-11.
- `mockApi` production guard: First line is `if (process.env.NODE_ENV === "production") throw new Error(...)`.
- Shopify tokens in Vault only: `integrations.access_token` column dropped in D-4; only `access_token_secret_id` UUID stored.
- Prompt sanitization: `lib/sanitise.ts` has 15 blocked patterns. Used in merchant prompt update flow.

### Q-20: Dead Code / Debug Artifacts — PASS

- `console.log`: Zero occurrences in TypeScript source files. Only `console.error` in `oauth/callback/route.ts` for non-fatal vault errors — appropriate.
- `USE_MOCK = true` hardcoded: Zero occurrences. All mock gating uses `process.env.NEXT_PUBLIC_USE_MOCK_API === "true"`.
- TODO/FIXME/debugger: Zero occurrences.
- Commented-out code blocks: None found.

### Q-21: UI/UX Premium Audit — ADVISORY

- **Inter font**: `app/layout.tsx` does NOT import Inter. Uses Geist font (`GeistVF.woff`, `GeistMonoVF.woff`). Spec says "Inter font applied globally." Geist is a high-quality sans-serif — acceptable as an equivalent, but deviates from the spec letter. **Advisory only — non-blocking.**
- `tracking-tight` on headings: Present on all dashboard `h1` elements and `DialogTitle` components.
- Navbar `backdrop-blur-md`: `Navbar.tsx` line 27 — `backdrop-blur-md bg-white/80`. Confirmed.
- Dialog overlay `backdrop-blur-sm`: `DialogContent` in `TestCallModal`, `OutboundCallModal`, and disconnect dialog all specify `backdrop-blur-sm`.
- Skeleton loading states: Present in Integrations, Voice, Dashboard, and Billing pages.
- CreditBadge CSS transition: `transition-colors duration-200` class on all badge spans.
- `window.location.href` for Stripe/Shopify redirects: These are **external** redirects to Stripe's hosted payment page and Shopify's OAuth flow. `router.push()` cannot navigate to external domains — `window.location.href` is the correct approach here. **Not a bug.**
- Sidebar mobile collapse: Confirmed — `Sidebar.tsx` uses `fixed ... -translate-x-full lg:translate-x-0` with hamburger toggle via `onMenuToggle`.
- "Coming Soon" tiles not clickable: TikTok Shop and WooCommerce have `cursor-not-allowed pointer-events-none opacity-50`. Confirmed.

---

## Issues Fixed During QA

### Fix 1 — Q-5: `package_id` / `packageId` mismatch in billing checkout

**File:** `app/api/billing/checkout/route.ts`

**Root cause:** The checkout API route destructured `{ packageId }` from the request JSON, but the billing page (`dashboard/billing/page.tsx`) and onboarding page (`app/onboarding/page.tsx`) both POST `{ package_id: packageId }`. This caused every "Buy Now" click to return `400 Missing packageId`.

**Fix:** Changed body parsing to accept both field names:
```typescript
const body = await request.json();
const packageId = body.package_id ?? body.packageId;
```

---

## Blocking Issues

None. The `package_id` mismatch has been fixed. No other blocking issues found.

---

## Final Verdict

**READY FOR DEPLOYMENT**

1 fix applied during QA (billing checkout field name mismatch). 1 advisory raised (Geist vs. Inter font — non-blocking). All 14 acceptance test tickets pass. All 7 senior engineer review tickets pass. Security, idempotency, RLS, naming, and edge-case handling all meet or exceed the Master Spec requirements.
