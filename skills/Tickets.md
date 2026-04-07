# Barpel Drop AI — Tickets

**Format:** `ID | Priority | Description | File:Line`
**Priorities:** CRITICAL · HIGH · MED · LOW
**Status:** Open unless marked ~~struck through~~

---

## Frontend

| ID | Priority | Description | File |
|----|----------|-------------|------|
| ~~FE-001~~ | ~~CRITICAL~~ | ~~Remove ElevenLabs dead code — legacy voice detection shows migration banner but provider is not approved~~ | ~~`dashboard/voice/page.tsx:94-96, 512-519`~~ ✅ |
| ~~FE-002~~ | ~~CRITICAL~~ | ~~Replace `window.confirm()` for subscription cancel with branded modal — inaccessible on mobile~~ | ~~`dashboard/billing/page.tsx:410-414`~~ ✅ |
| ~~FE-003~~ | ~~HIGH~~ | ~~Replace `window.location.reload()` on provisioning complete with React state update~~ | ~~`dashboard/integrations/page.tsx:88`~~ ✅ |
| ~~FE-004~~ | ~~HIGH~~ | ~~Hardcoded `$3.40/call` labor savings should come from constants/config~~ | ~~`dashboard/page.tsx:183-184`~~ ✅ |
| ~~FE-005~~ | ~~HIGH~~ | ~~Forgot password link points to `href="#"` — not implemented~~ | ~~`(auth)/login/page.tsx:252`~~ ✅ |
| ~~FE-006~~ | ~~MED~~ | ~~Social media links in About page point to `href="#"` (2 instances) | `about/page.tsx:293, 296` |
| ~~FE-007~~ | ~~MED~~ | ~~Subprocessors link in Data Processing page points to `href="#"` | `data-processing/page.tsx:99` |
| ~~FE-008~~ | ~~MED~~ | ~~Developer Tools page has broken `href="#"` link | `developer-tools/page.tsx:341` |
| ~~FE-009~~ | ~~MED~~ | ~~Billing cycle toggle visible to Shopify merchants who manage billing in Shopify Admin~~ | ~~`dashboard/billing/page.tsx:332-365`~~ ✅ |
| ~~FE-010~~ | ~~LOW~~ | ~~Dashboard stats fetch has no error toast on failure — fails silently~~ | ~~`dashboard/page.tsx`~~ ✅ |
| ~~FE-011~~ | ~~LOW~~ | ~~CSV export error in call logs fails silently (only `console.error`)~~ | ~~`dashboard/calls/page.tsx`~~ ✅ |
| ~~FE-012~~ | ~~LOW~~ | ~~Navbar greeting uses `new Date()` — may cause hydration mismatch on SSR~~ | ~~`components/dashboard/Navbar.tsx`~~ ✅ |

---

## Backend

| ID | Priority | Description | File |
|----|----------|-------------|------|
| ~~BE-001~~ | ~~CRITICAL~~ | ~~Remove Flutterwave from dunning-check cron — makes live FLW API calls for a removed provider~~ | ~~`api/cron/dunning-check/route.ts:13-175`~~ ✅ |
| ~~BE-002~~ | ~~HIGH~~ | ~~In-memory rate limit maps for chat endpoints reset on server restart — not distributed across Vercel instances~~ | ~~`api/chat/lead/route.ts`, `api/chat/widget/route.ts`~~ ✅ |
| ~~BE-003~~ | ~~HIGH~~ | ~~NVIDIA LLM URL hardcoded with no fallback or circuit breaker~~ | ~~`api/chat/support/route.ts:181`, `api/chat/widget/route.ts:162`~~ ✅ |
| ~~BE-004~~ | ~~HIGH~~ | ~~Vapi end-of-call report trusts `call.metadata.merchant_id` without independent signature — fallback to assistantId only~~ | ~~`api/vapi/webhook/route.ts:89-99`~~ ✅ |
| ~~BE-005~~ | ~~MED~~ | ~~Caller ID validation code stored plaintext in `merchants.caller_id_validation_code` — should use Vault~~ | ~~`api/caller-id/start/route.ts:119-124`~~ ✅ |
| ~~BE-006~~ | ~~MED~~ | ~~Merchant AI line deletion does not set `provisioning_status = 'suspended'` before cleanup — window where new calls can start~~ | ~~`api/merchant/ai-voice/route.ts:288-366`~~ ✅ |
| ~~BE-007~~ | ~~MED~~ | ~~Rate limiter fails open if Upstash is down — merchants can bypass rate limits | `api/merchant/forwarding/route.ts:39-42` |
| ~~BE-008~~ | ~~MED~~ | ~~Contact form uses `x-forwarded-for` for IP; chat widget uses `cf-connecting-ip` — inconsistent | `api/contact/route.ts:80`, `api/chat/widget/route.ts:129` |
| ~~BE-009~~ | ~~MED~~ | ~~No rate limiting on Vapi webhook handler — repeated tool-calls drain credits without throttle~~ | ~~`api/vapi/webhook/route.ts`~~ ✅ |
| ~~BE-010~~ | ~~LOW~~ | ~~Health check queries only `credit_packages` — use `SELECT 1` for more reliable signal~~ | ~~`api/health/route.ts:16-18`~~ ✅ |
| ~~BE-011~~ | ~~LOW~~ | ~~No request body size limits on most JSON endpoints~~ | ~~Multiple routes~~ ✅ |
| ~~BE-012~~ | ~~LOW~~ | ~~`/api/vapi/call-ended` is deprecated but still deployed — remove or return 410~~ | ~~`api/vapi/call-ended/route.ts`~~ ✅ |

---

## Database

| ID | Priority | Description | File |
|----|----------|-------------|------|
| ~~DB-001~~ | ~~CRITICAL~~ | ~~Drop orphaned Flutterwave columns: `flw_subscription_id`, `flw_plan`, `flw_transaction_id`~~ | ~~`014_flutterwave_billing.sql`~~ ✅ |
| ~~DB-002~~ | ~~CRITICAL~~ | ~~Drop orphaned Paystack columns: `paystack_customer_id`, `paystack_subscription_id`, `paystack_plan`, `paystack_transaction_id`~~ | ~~`024_paystack_billing.sql`~~ ✅ |
| ~~DB-003~~ | ~~HIGH~~ | ~~Two migrations share version number `003` — risk of ordering conflict~~ | ~~`003_add_shop_name.sql`, `003_fix_onboarded_at.sql`~~ ✅ |
| ~~DB-004~~ | ~~HIGH~~ | ~~Missing migration `030` — sequence jumps 029 → 031; document or fill gap~~ | ~~N/A~~ ✅ |
| ~~DB-005~~ | ~~HIGH~~ | ~~Add CHECK constraint to `billing_transactions.provider` limiting to `(dodo, shopify)` — currently TEXT default `'flutterwave'`~~ | ~~`014_flutterwave_billing.sql`~~ ✅ |
| ~~DB-006~~ | ~~MED~~ | ~~`call_logs.vapi_call_id` UNIQUE constraint is global, not scoped to `merchant_id` — vapi_call_id could duplicate across merchants~~ | ~~`009_golden_call_logs.sql`~~ ✅ |
| ~~DB-007~~ | ~~MED~~ | ~~RLS enabled on `webhook_events`, `oauth_states`, `leads` but no policies created — intentional (service role only) — add comment documenting this~~ | ~~`028_rls_hardening.sql`~~ ✅ |
| ~~DB-008~~ | ~~MED~~ | ~~Drop indexes on removed-provider columns: `idx_merchants_flw_sub`, `idx_merchants_paystack_sub`~~ | ~~`015_billing_features.sql`, `021_annual_billing.sql`~~ ✅ |
| ~~DB-009~~ | ~~LOW~~ | ~~`ai_voice_id` default was `ElevenLabs ID` in migration 006 — migration 010 fixed it; verify no merchants still have old ElevenLabs IDs~~ | ~~`006_ai_voice_columns.sql`, `010_provisioning_fixes.sql`~~ ✅ |
| ~~DB-010~~ | ~~LOW~~ | ~~Multiple RLS policy additions across migrations without audit of precedence — document intended policy order~~ | ~~`002_spec_alignment.sql`, `009_golden_call_logs.sql`, `028_rls_hardening.sql`~~ ✅ |
| ~~DB-011~~ | ~~ERROR~~ | ~~RLS not enabled on `webhook_events`, `leads`, `oauth_states` — migration 028 never applied to live DB~~ | ~~`038_security_linter_fixes.sql`~~ ✅ |
| ~~DB-012~~ | ~~WARN~~ | ~~12 public schema functions missing `SET search_path` — mutable search_path is a SECURITY DEFINER injection vector~~ | ~~`038_security_linter_fixes.sql`~~ ✅ |
| DB-013 | WARN | `landing_signups.allow_anon_insert` uses `WITH CHECK (true)` — intentional (anon landing page signups) | No fix needed — intentional |
| DB-014 | WARN | Leaked password protection disabled in Supabase Auth | ⚠️ manual: Austin → Supabase Dashboard → Auth → Settings → enable "Leaked password protection" |
| DB-015 | INFO | `admin_error_log`, `admin_notes`, `dodo_webhook_events` have RLS enabled but no policies — intentional (service role only) | No fix needed — intentional, same pattern as DB-007 |

---

## Authentication

| ID | Priority | Description | File |
|----|----------|-------------|------|
| ~~AU-001~~ | ~~HIGH~~ | ~~Email pre-confirmed on signup (`email_confirm: true`) — no verification loop; signup must be rate-limited to compensate~~ | ~~`api/auth/signup/route.ts:21`~~ ✅ |
| ~~AU-002~~ | ~~HIGH~~ | ~~Auth callback resets `onboarded_at = NULL` without checking if it's already set — could overwrite a completed onboarding~~ | ~~`(auth)/auth/callback/route.ts:45-50`~~ ✅ |
| ~~AU-003~~ | ~~HIGH~~ | ~~No rate limiting on `/api/auth/signup` or `/auth/callback` — brute-force / enumeration possible~~ | ~~`api/auth/signup/route.ts`~~ ✅ |
| ~~AU-004~~ | ~~MED~~ | ~~`next` redirect param in magic link callback not validated against allowlist — open redirect risk~~ | ~~`(auth)/auth/callback/route.ts:16`~~ ✅ |
| ~~AU-005~~ | ~~MED~~ | ~~Shopify `host` param base64-decoded without length check — malformed input causes silent failure~~ | ~~`middleware.ts:96-109`~~ ✅ |
| ~~AU-006~~ | ~~MED~~ | ~~Bearer token accepted without scope validation — could accept refresh tokens~~ | ~~`lib/supabase/auth-guard.ts:22-28`~~ ✅ |
| ~~AU-007~~ | ~~LOW~~ | ~~Login error messages differ by case — allows email enumeration~~ | ~~`(auth)/login/page.tsx:46-51`~~ ✅ |
| ~~AU-008~~ | ~~LOW~~ | ~~Signup merchant race condition — trigger fires between user creation and `onboarded_at` reset~~ | ~~`api/auth/signup/route.ts:31-39`~~ ✅ |

---

## Billing

| ID | Priority | Description | File |
|----|----------|-------------|------|
| ~~BI-001~~ | ~~CRITICAL~~ | ~~Remove all Flutterwave code from dunning-check cron~~ | ✅ |
| ~~BI-002~~ | ~~CRITICAL~~ | ~~Remove all Paystack code from account deletion~~ | ✅ |
| ~~BI-003~~ | ~~CRITICAL~~ | ~~Remove Flutterwave code from account deletion~~ | ✅ |
| ~~BI-004~~ | ~~CRITICAL~~ | ~~Remove `flw_plan` / `flw_subscription_id` from `useCredits` hook state~~ | ✅ |
| ~~BI-005~~ | ~~CRITICAL~~ | ~~Remove `paystack_plan` / `paystack_subscription_id` from `useCredits` hook state~~ | ✅ |
| ~~BI-006~~ | ~~CRITICAL~~ | ~~Remove Flutterwave/Paystack from `billing/info` API route response~~ | ✅ |
| ~~BI-007~~ | ~~CRITICAL~~ | ~~Remove Flutterwave/Paystack column selects from `account/export` route~~ | ✅ |
| ~~BI-008~~ | ~~HIGH~~ | ~~Remove `FLW_SECRET_KEY` and `PAYSTACK_SECRET_KEY` from `lib/env.ts`~~ | ✅ |
| ~~BI-009~~ | ~~HIGH~~ | ~~Remove dunning-check cron comments referencing Flutterwave webhook behavior~~ | ~~`api/cron/dunning-check/route.ts:14-26`~~ ✅ |
| ~~BI-010~~ | ~~HIGH~~ | ~~Remove `flw_plan` fallback from billing source detection~~ | ~~`api/billing/info/route.ts:33-35`~~ ✅ |
| ~~BI-011~~ | ~~MED~~ | ~~Rename `billing_transactions.provider` default from `'flutterwave'` to `'dodo'` after column cleanup~~ | ~~After DB-001/DB-002~~ ✅ |
| ~~BI-012~~ | ~~MED~~ | ~~Verify `DODO_PAYMENTS_*` env vars are consistently used (not `DODO_*`) | `lib/env.ts:62-66` |
| ~~BI-013~~ | ~~LOW~~ | ~~Add deprecation comment near all cleaned-up code noting removal date~~ | ~~All affected files~~ ✅ |


---

## Security

| ID | Priority | Description | File |
|----|----------|-------------|------|
| ~~SE-001~~ | ~~CRITICAL~~ | ~~Product search terms passed to Shopify API without sanitization or per-merchant rate limiting~~ | ~~`api/vapi/webhook/route.ts:422`~~ ✅ |
| ~~SE-002~~ | ~~HIGH~~ | ~~Custom merchant prompts returned verbatim to Vapi — prompt injection if merchant row is compromised~~ | ~~`api/vapi/webhook/route.ts:408-414`~~ ✅ |
| ~~SE-003~~ | ~~HIGH~~ | ~~No rate limiting on Vapi webhook — repeated malicious tool-calls drain credits unthrottled~~ | ~~`api/vapi/webhook/route.ts`~~ ✅ |
| ~~SE-004~~ | ~~HIGH~~ | ~~Order number from Vapi tool-calls sent unfiltered to Shopify API~~ | ~~`api/vapi/webhook/route.ts:42-288`~~ ✅ |
| ~~SE-005~~ | ~~MED~~ | ~~OAuth state can be replayed within 10-min TTL window if state string is leaked~~ | ~~`api/shopify/oauth/callback/route.ts:74-97`~~ ✅ |
| ~~SE-006~~ | ~~MED~~ | ~~Shopify shop/redact compliance webhook uses `shop_domain` as sole identifier — could orphan data if multiple merchants share domain~~ | ~~`api/shopify/webhooks/compliance/route.ts:74-85`~~ ✅ |
| ~~SE-007~~ | ~~MED~~ | ~~PII redaction regex may miss non-standard international phone formats | `lib/security.ts:95-105` |
| ~~SE-008~~ | ~~LOW~~ | ~~BYOC Twilio credentials stored by name — name collisions not prevented across merchants~~ | ~~`api/account/delete/route.ts:177-188`~~ ✅ |
| ~~SE-009~~ | ~~LOW~~ | ~~Remove `STRIPE_*` env vars from `.env.local.example` — Stripe is not an approved provider~~ | ~~`.env.local.example`~~ ✅ |

---

## Infrastructure

| ID | Priority | Description | File |
|----|----------|-------------|------|
| ~~IN-001~~ | ~~CRITICAL~~ | ~~Sentry DSN is empty — error tracking disabled~~ | ~~`.env` (`NEXT_PUBLIC_SENTRY_DSN`)~~ ✅ |
| ~~IN-002~~ | ~~HIGH~~ | ~~No automatic rollback on failed post-deploy health check~~ | ~~`.github/workflows/ci-cd.yml:184-189`~~ ✅ |
| ~~IN-003~~ | ~~HIGH~~ | ~~Failure notification workflow has stub — Slack/email not implemented~~ | ~~`.github/workflows/notify-failure.yml:20`~~ ✅ |
| ~~IN-004~~ | ~~HIGH~~ | ~~Cron routes have no timeout/abort for long-running loops — Vercel function timeout is the only guard~~ | ~~`api/cron/*.ts`~~ ✅ |
| ~~IN-005~~ | ~~MED~~ | ~~Contract tests only run on `main` — PRs don't validate Vapi/Shopify chain~~ | ~~`.github/workflows/ci-cd.yml:113`~~ ✅ |
| IN-006 | MED | Google Analytics ID not configured | `NEXT_PUBLIC_GA_ID` missing |
| ~~IN-007~~ | ~~MED~~ | ~~Playwright tests run with 1 worker — rate limit workaround; document this constraint | `playwright.config.ts:6-9` |
| ~~IN-008~~ | ~~LOW~~ | ~~Bundle analyzer requires manual `ANALYZE=true` flag — not part of CI pipeline~~ | ~~`next.config.mjs:5`~~ ✅ |

---

## Affiliate Program

| ID | Priority | Description | File |
|----|----------|-------------|------|
| ~~AF-001~~ | ~~CRITICAL~~ | ~~Google OAuth signups not tracked in Tapfiliate — `tap('customer', userId)` missing in OAuth flow~~ | ~~`(auth)/signup/SignupContent.tsx:98-115`~~ ✅ |
| ~~AF-002~~ | ~~HIGH~~ | ~~`affiliate_referral_code` and `referred_by_affiliate_id` columns exist but never populated — `?ref=` URL param not extracted on signup~~ | ~~`supabase/migrations/033_affiliate_tracking.sql`~~ ✅ |
| ~~AF-003~~ | ~~HIGH~~ | ~~Affiliate signup page (`/affiliates`) referenced in docs but route does not exist in app~~ | ~~`app/` (missing route)~~ ✅ |
| AF-004 | HIGH | Demo call recordings: 1/5 recorded (`call-4bdc4138.mp4` = WISMO ✅). Still need: return, product, abandoned cart, escalation ⚠️ manual: Austin must record 4 more | `Barpel AI-Affiliate-Marketing/04-onboarding.md:403-415` |
| ~~AF-005~~ | ~~MED~~ | ~~Co-branded landing page for Trevor (`/ecommerce-paradise`) promised but not created~~ | ~~`Barpel AI-Affiliate-Marketing/07-trevor-fenner-partnership.md:268`~~ ✅ |
| ~~AF-006~~ | ~~MED~~ | ~~Commission rate discrepancy: email templates say 30%, program docs say 20% — align~~ | ~~`04-onboarding.md:141-149` vs `01-program-structure.md:26-32`~~ ✅ |
| ~~AF-007~~ | ~~MED~~ | ~~Tapfiliate cookie consent — tracking script fires on all visitors regardless of GDPR consent | `app/layout.tsx` |
| ~~AF-008~~ | ~~MED~~ | ~~Tapfiliate Dodo conversion (`createConversion()`) has no error logging or retry | `api/dodo/webhook/route.ts:156-172` |
| AF-009 | MED | Fraud velocity limit (max 10 signups/day) configured in docs but not verified active in Tapfiliate ⚠️ manual: verify in Tapfiliate dashboard | `Barpel AI-Affiliate-Marketing/05-tracking-analytics.md:241-242` |
| AF-010 | LOW | Tier upgrade (Standard → Gold) is manual in Tapfiliate — no automation ⚠️ manual: platform config | `01-program-structure.md:73-78` |
| AF-011 | LOW | FTC disclosure compliance relies on manual monthly checklist — no automated enforcement ⚠️ manual: process | `05-tracking-analytics.md:260-267` |
