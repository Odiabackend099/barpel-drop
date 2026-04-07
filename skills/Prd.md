# Barpel Drop AI — Product Requirements Document

## PRD Maintenance Rules

1. Update this file after every feature/fix — one sentence per item
2. Keep it accurate — if code differs from docs, fix the docs
3. No paragraphs — tables and bullet lists only
4. Date every section change
5. Cross-reference `Tickets.md` for known issues

---

## System Overview *(2026-04-06)*

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 14.2.35, App Router, TypeScript | Full-stack web app |
| UI | React 18, Tailwind CSS, Shadcn/ui, Framer Motion | Dashboard + marketing pages |
| Database | Supabase (PostgreSQL + RLS + Vault + Realtime) | All persistent data |
| Auth | Supabase Auth + HTTP-only cookies + SSR middleware | Session management |
| Voice AI | Vapi (native voices only) | AI phone line + call handling |
| Telephony | Twilio | Phone number provisioning + SMS + USSD |
| Billing | Dodo Payments (direct) + Shopify Managed Billing (App Store) | Subscriptions + credits |
| Affiliate | Tapfiliate | Referral tracking + commission payouts |
| Email | Resend | Transactional emails |
| Rate Limiting | Upstash Redis | Per-IP / per-user limits |
| Analytics | PostHog, Sentry, Google Analytics | Events, errors, web traffic |
| Deployment | Vercel (iad1 region) | Hosting + cron jobs |

---

## Frontend *(2026-04-06)*

### Auth Pages

| Page | Route | Status | Notes |
|------|-------|--------|-------|
| Login | `/login` | Working | Email/password, Google OAuth, magic link |
| Signup | `/signup` | Working | Email/password, Google OAuth; Tapfiliate customer tracking on email flow only |
| OAuth Callback | `/auth/callback` | Working | Exchanges code for session; gates on `onboarded_at` |

### Dashboard Pages (all require auth + `onboarded_at`)

| Page | Route | Status | Notes |
|------|-------|--------|-------|
| Home | `/dashboard` | Working | Stats, call volume chart, recent calls; mock fallback via env flag |
| Call Logs | `/dashboard/calls` | Working | Filters, pagination (25/page), CSV export |
| Integrations | `/dashboard/integrations` | Working | Phone line, Shopify OAuth, abandoned cart; hard-refresh on provisioning complete (see FE-003) |
| Voice | `/dashboard/voice` | Working | Vapi native voices only; ElevenLabs legacy detection present — see FE-001 |
| Settings | `/dashboard/settings` | Working | Profile, password reset, notification toggles (4), data export, account deletion |
| Billing | `/dashboard/billing` | Working | Dodo + Shopify only; `window.confirm()` for cancel — see FE-002 |
| Billing Success | `/dashboard/billing/success` | Working | Post-Dodo payment confirmation with Realtime fallback |
| Persona | `/dashboard/persona` | Redirect | Redirects to `/dashboard/voice` |

### Onboarding

| Page | Route | Status | Notes |
|------|-------|--------|-------|
| Onboarding | `/onboarding` | Working | 5 steps: Store → Connect → Credits → Live → Forward; confetti on complete |

### Marketing Pages

| Page | Route | Status |
|------|-------|--------|
| Homepage | `/` | Working |
| Features | `/features` | Working |
| Pricing | `/pricing` | Working |
| How It Works | `/how-it-works` | Working |
| Integrations | `/integrations` | Working |
| Blog | `/blog` | Working |
| Blog Post | `/blog/[slug]` | Working |
| About | `/about` | Working |
| Contact | `/contact` | Working |
| FAQ | `/faq` | Working |
| Careers | `/careers` | Working |
| Partners | `/partners` | Working |
| Press Kit | `/press-kit` | Working |
| Customer Stories | `/customer-stories` | Working |
| Help Center | `/help-center` | Working |
| Developer Tools | `/developer-tools` | Working |
| API Documentation | `/api-documentation` | Working |
| Privacy Policy | `/privacy` | Working |
| Terms of Service | `/terms` | Working |
| Cookie Policy | `/cookies` | Working |
| Data Processing | `/data-processing` | Working |
| Offline | `/offline` | Working |

### Solution Pages

| Page | Route | Status |
|------|-------|--------|
| Shopify Stores | `/solutions/shopify-stores` | Working |
| Dropshippers | `/solutions/dropshippers` | Working |
| Amazon Sellers | `/solutions/amazon-sellers` | Working |
| TikTok Shop | `/solutions/tiktok-shop` | Working |

### Case Studies

| Page | Route | Status |
|------|-------|--------|
| Dropship Direct | `/case-studies/dropship-direct` | Working |
| GlobalGoods | `/case-studies/globalgoods` | Working |
| ShopMax Pro | `/case-studies/shopmax-pro` | Working |
| TrendyMart | `/case-studies/trendymart` | Working |

### Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useMerchant` | `hooks/useMerchant.ts` | Merchant profile, AI voice updates, Realtime subscription |
| `useCallLogs` | `hooks/useCallLogs.ts` | Call history with filters, pagination, debounced search |
| `useCredits` | `hooks/useCredits.ts` | Credit balance, plan info, transactions, Realtime updates |
| `useIntegrations` | `hooks/useIntegrations.ts` | Shopify + other integrations, polling fallback |

---

## Backend *(2026-04-06)*

### API Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/signup` | No | Create merchant account (admin API, email pre-confirmed) |
| POST | `/api/auth/welcome` | No | Fire-and-forget welcome email |
| GET | `/api/merchant/profile` | Yes | Return authenticated merchant profile |
| PATCH | `/api/merchant/update` | Yes | Update business name, country, notification preferences |
| PATCH | `/api/merchant/ai-voice` | Yes | Update AI voice settings, sync to Vapi |
| DELETE | `/api/merchant/ai-voice` | Yes | Remove AI phone line and Vapi assistant |
| POST | `/api/merchant/forwarding` | Yes | Save call forwarding preferences |
| GET | `/api/calls/list` | Yes | Paginated call logs with filters |
| GET | `/api/calls/export` | Yes | Export call logs as CSV |
| GET | `/api/calls/[id]` | Yes | Single call detail |
| GET | `/api/dashboard/stats` | Yes | All dashboard metrics in one RPC call |
| POST | `/api/vapi/webhook` | HMAC | Vapi tool-calls and end-of-call-report |
| POST | `/api/vapi/call-ended` | HMAC | Deprecated — moved to `/api/vapi/webhook` |
| POST | `/api/vapi/outbound` | Yes | Trigger outbound call from merchant's AI line |
| POST | `/api/outbound/abandoned-cart` | HMAC | Shopify checkout/create webhook, queue recovery call |
| POST | `/api/outbound/order-completed` | HMAC | Shopify orders/create webhook, cancel pending recovery |
| POST | `/api/test-call/outbound` | Yes | Place test outbound call (requires 2 min credits) |
| POST | `/api/test-call/browser` | Yes | Return Vapi assistant ID for browser WebRTC test |
| POST | `/api/provisioning/byoc` | Yes | BYOC provisioning with merchant's Twilio credentials |
| POST | `/api/provisioning/retry` | Yes | Retry failed provisioning |
| POST | `/api/onboarding/complete` | Yes | Mark onboarding done, trigger provisioning |
| GET | `/api/integrations/list` | Yes | List merchant integrations |
| POST | `/api/integrations/consent` | Yes | Set/revoke outbound consent |
| POST | `/api/integrations/disconnect` | Yes | Disconnect integration, clean Vault secrets |
| GET | `/api/integrations/cart-stats` | Yes | Abandoned cart stats (30 days) |
| GET | `/api/shopify/oauth/start` | Yes | Initiate Shopify OAuth (managed or custom app) |
| GET | `/api/shopify/oauth/callback` | HMAC | Exchange code for token, store in Vault, register webhooks |
| POST | `/api/shopify/webhooks/compliance` | HMAC | Shopify GDPR compliance webhooks |
| POST | `/api/shopify/webhooks/subscription` | HMAC (per-shop) | Shopify subscription lifecycle events |
| POST | `/api/billing/dodo/initiate` | Yes | Create pending transaction, return Dodo checkout URL |
| POST | `/api/billing/dodo/checkout` | Internal | Call Dodo API to create hosted checkout session |
| POST | `/api/billing/dodo/cancel` | Yes | Cancel Dodo subscription (ownership verified) |
| POST | `/api/billing/dodo/customer-portal` | Yes | Return Dodo customer portal URL |
| POST | `/api/dodo/webhook` | Std Webhooks | Handle Dodo subscription lifecycle events |
| GET | `/api/credits/balance` | Yes | Current credit balance |
| GET | `/api/credits/transactions` | Yes | Credit transaction history |
| GET | `/api/credits/usage-chart` | Yes | 30-day usage chart data |
| GET | `/api/billing/info` | Yes | Billing summary (plan, status, next renewal) |
| POST | `/api/chat/support` | Yes | Support chat via NVIDIA LLM |
| POST | `/api/chat/lead` | No | Capture prospect lead from chat widget |
| POST | `/api/chat/widget` | No | Public sales chat via NVIDIA LLM |
| POST | `/api/chat/transcribe` | No | Audio transcription via Deepgram (10 MB max) |
| POST | `/api/caller-id/start` | Yes | Request Twilio caller ID verification call |
| POST | `/api/caller-id/verify` | Yes | Verify caller ID code |
| POST | `/api/caller-id/status` | HMAC | Twilio StatusCallback webhook |
| POST | `/api/support` | Yes | Submit support ticket (rate-limited) |
| POST | `/api/contact` | No | Public contact form (IP rate-limited) |
| GET | `/api/health` | No | Database health check |
| POST | `/api/notifications/password-changed` | Yes | Send password change security notification |
| GET | `/api/account/export` | Yes | ZIP export of account data |
| DELETE | `/api/account/delete` | Yes | Full account deletion with cleanup sequence |
| GET | `/api/cron/dial-pending` | Cron Secret | Initiate pending outbound calls |
| GET | `/api/cron/data-cleanup` | Cron Secret | Nightly data retention cleanup |
| GET | `/api/cron/activation-check` | Cron Secret | Email merchants 3+ days post-onboarding with zero calls |
| GET | `/api/cron/dunning-check` | Cron Secret | Manage overdue subscription states |

---

## Database *(2026-04-06)*

Schema managed via 33 Supabase migrations. Read from live migrations — do not assume.

### Tables

| Table | Key Columns | RLS | Notes |
|-------|-------------|-----|-------|
| `merchants` | id, user_id, business_name, credit_balance (seconds), country, plan, provisioning_status, onboarded_at, deleted_at | Yes | Core tenant; soft delete via `deleted_at` |
| `integrations` | id, merchant_id, platform, shop_domain, access_token_secret_id (Vault UUID), webhook_secret_vault_id (Vault UUID), connection_active | Yes | OAuth tokens stored in Vault only |
| `call_logs` | id, merchant_id, vapi_call_id, started_at, ended_at, duration_seconds, transcript, sentiment, call_type, credits_charged, tool_results (JSONB), recording_url | Yes | Single source of truth for all calls |
| `credit_transactions` | id, merchant_id, type, amount (signed seconds), balance_after, call_log_id | Yes | Immutable audit ledger |
| `credit_packages` | id, name, credits_seconds, price_usd_cents, is_active, valid_from, valid_until | Yes | Public read; plan definitions |
| `billing_transactions` | id, merchant_id, tx_ref (unique), provider (dodo/shopify), plan, amount, status, billing_cycle, created_at | Yes | Payment audit trail |
| `pending_outbound_calls` | id, merchant_id, customer_phone, cart_value_usd, scheduled_for, status, attempt_count, shopify_checkout_token (unique) | Yes | Abandoned cart recovery queue |
| `webhook_events` | id, event_id (unique), source, processed_at | Yes (admin only) | Idempotency dedup table |
| `dodo_webhook_events` | id, webhook_id (unique), created_at | Yes (admin only) | Dodo subscription renewal idempotency |
| `oauth_states` | state (PK), merchant_id, shop_domain, app_type, created_at | Yes (admin only) | Database-backed CSRF nonce (10-min TTL) |
| `return_requests` | id, merchant_id, call_log_id, order_number, reason, status | Yes | Return/refund requests via AI calls |
| `leads` | id, name, email, company, source_url, utm_source, status, created_at | Yes (admin only) | Marketing contact form submissions |

> **Note:** `merchants` table still contains orphaned `flw_*` and `paystack_*` columns from removed providers — see DB-001, DB-002 in Tickets.md.

### RPC Functions

| Function | Purpose |
|----------|---------|
| `deduct_call_credits(merchant_id, seconds, call_log_id)` | Atomically deduct credits; allows partial; no exception on insufficient balance |
| `add_credits(merchant_id, seconds, payment_intent_id)` | Atomically add purchased credits |
| `get_dashboard_stats(merchant_id, date_from, date_to)` | Single round-trip for all dashboard metrics |
| `vault_read_secret_by_id(id)` | Decrypt Vault secret by UUID |
| `vault_delete_secret_by_id(id)` | Delete Vault secret by UUID |
| `vault_delete_secret_by_name(name)` | Delete Vault secret by name (BYOC credentials) |
| `handle_new_user()` | Trigger: create `merchants` row on `auth.users` INSERT; grants 300s free credits |
| `update_updated_at()` | Trigger: update `call_logs.updated_at` on UPDATE |

### Vault Secret Patterns

| Pattern | Purpose |
|---------|---------|
| `shopify_{platform}_{merchant_id}_access_token` | Shopify OAuth token |
| `shopify_{platform}_{merchant_id}_webhook_secret` | Per-shop Shopify webhook HMAC secret |
| `twilio_byoc_sid_{merchant_id}` | BYOC Twilio Account SID |
| `twilio_byoc_token_{merchant_id}` | BYOC Twilio Auth Token |

---

## Authentication *(2026-04-06)*

### Auth Flows

| Flow | Entry | Method | Notes |
|------|-------|--------|-------|
| Email/Password Signup | `POST /api/auth/signup` | Supabase admin API | Email pre-confirmed (no verification loop) |
| Email/Password Login | Client `auth.signInWithPassword` | Supabase | Standard |
| Google OAuth | Client `auth.signInWithOAuth` | Supabase | Redirects to `/auth/callback` |
| Magic Link | Client `auth.signInWithOtp` | Supabase | Passwordless |
| OAuth Callback | `GET /auth/callback?code=` | `exchangeCodeForSession` | Sets `onboarded_at=NULL` if `onboarding_step < 4` |
| Shopify App-Load | Middleware detects `hmac+host` params | Redirect to OAuth start | Re-initiates OAuth on app re-entry |

### Middleware Protection

| Route | Requirement | On Fail |
|-------|-------------|---------|
| `/dashboard/*` | Auth + `onboarded_at IS NOT NULL` | → `/login` or `/onboarding` |
| `/onboarding` | Auth | → `/login` |
| `/login`, `/signup` | Unauthenticated | → `/dashboard` or `/onboarding` |
| Webhooks, crons, health | Excluded from middleware | HMAC / Cron Secret instead |

### Auth Guard (`lib/supabase/auth-guard.ts`)
- `getAuthUser()` tries cookie session first, then `Authorization: Bearer` header
- Returns `{user, error}` — never throws
- Used in every protected API route

---

## Billing *(2026-04-06)*

**Approved providers: Dodo Payments + Shopify Managed Billing ONLY.**
Any Flutterwave, Paystack, or Stripe code is unauthorized dead code — see BI-001 through BI-013 in Tickets.md.

### Providers

| Provider | Who | Webhook | Idempotency |
|----------|-----|---------|-------------|
| Dodo Payments | Direct signups | `/api/dodo/webhook` | `subscription_id + next_billing_date` |
| Shopify Managed Billing | App Store merchants | `/api/shopify/webhooks/subscription` | `X-Shopify-Webhook-Id` |

### Plans

| Plan | Price/mo | Credits (seconds) | Annual Option |
|------|---------|-------------------|--------------|
| Starter | $29 | 1,800 (30 min) | $313/yr |
| Growth | $79 | 6,000 (100 min) | $853/yr |
| Scale | $179 | 15,000 (250 min) | $1,933/yr |

### Credit Rules
- Measured in **seconds** (not minutes, not dollars)
- **RESET** on plan activation and renewal — never stack
- Deducted per call based on `duration_seconds`
- Free trial: 300 seconds granted on signup

### Dunning Flow (Dodo only)

| Day | Status | Action |
|-----|--------|--------|
| 0 | `past_due` | Payment failed email |
| 3 | `past_due` | Reminder email |
| 7 | `past_due` | Final warning email + SMS |
| 9 | `past_due_restricted` | AI answers with billing notice |
| 14 | `past_due_final` | Calls declined |
| 30/45 | `cancelled` | Subscription cancelled (monthly/annual) |

### Billing UI Guard
- `isShopifyMerchant = !!shopifyPlan` — Shopify merchants see "Managed by Shopify" panel, never Dodo controls
- `billing_source` derived at runtime; never stored as a column

---

## Security *(2026-04-06)*

### HMAC Verification

| Endpoint | Algorithm | Encoding | Timing-Safe | Secret Source |
|----------|-----------|----------|-------------|--------------|
| Shopify OAuth callback | HMAC-SHA256 | Hex | Yes | `SHOPIFY_API_SECRET` or `BARPEL_CONNECT_CLIENT_SECRET` |
| Shopify webhooks | HMAC-SHA256 | Base64 | Yes | Per-shop Vault secret |
| Vapi webhook | Shared secret | Plain | Yes | `VAPI_WEBHOOK_SECRET` |
| Dodo webhook | StandardWebhooks | — | Yes | `DODO_PAYMENTS_WEBHOOK_KEY` |

### Rate Limiting (Upstash Redis)

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/contact` | 1 req | 10 min per IP |
| `/api/chat/widget` | 1 req | 1 hr per IP (in-memory fallback) |
| `/api/support` | Per-user | Short window |
| `/api/caller-id/start` | Per-merchant | Short window |
| Redis down behavior | Fails open (logs, does not block) | — |

### Input Sanitization

| Input | Method |
|-------|--------|
| Custom AI prompt | `sanitiseMerchantPrompt()` — whitelist approach, blocks jailbreak patterns |
| Business name | 2–60 chars, trimmed, type-checked |
| Country | Enum whitelist: NG, GB, US, CA, GH, KE |
| Notification keys | Hardcoded whitelist of valid keys |
| Shop domain | Regex: `/^[a-zA-Z0-9-]+\.myshopify\.com$/` |
| Vapi TTS output | Newlines replaced with spaces |
| CSV export | `escapeCsv()` function |

### Vault & Credentials
- Shopify tokens and webhook secrets stored in Supabase Vault (never in DB columns)
- BYOC Twilio credentials stored in Vault by name
- Admin client used for Vault access — RLS bypassed; HMAC/auth verified before any admin call
- Account deletion: cancel billing → release Vapi phone → delete assistant → clear Vault → anonymize calls → delete merchant

---

## Infrastructure *(2026-04-06)*

### Deployment

| Item | Value |
|------|-------|
| Platform | Vercel (iad1) |
| Node | 20.x |
| Build | `next build` |
| Domain | `dropship.barpel.ai` |
| Post-deploy health check | `GET /api/health` — polls 15s after deploy |

### Cron Jobs

| Path | Schedule (UTC) | Purpose |
|------|----------------|---------|
| `/api/cron/dial-pending` | Every 15 minutes | Initiate pending abandoned-cart calls |
| `/api/cron/data-cleanup` | 2:00 AM daily | Null transcripts (90d), redact numbers, remove recordings (30d) |
| `/api/cron/activation-check` | 9:00 AM daily | Email merchants 3+ days post-onboarding with zero calls |
| `/api/cron/dunning-check` | 10:00 AM daily | Manage overdue subscription states |

### Vercel Function Timeouts

| Route | Max Duration |
|-------|-------------|
| `/api/onboarding/complete/**` | 300s |
| `/api/provisioning/**` | 300s |
| `/api/merchant/ai-voice/**` | 60s |
| `/api/vapi/**` | 30s |
| All others | 30s |

### Security Headers (vercel.json)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

### CI/CD (`.github/workflows/ci-cd.yml`)

| Step | Trigger | Action |
|------|---------|--------|
| Quality checks | All PRs + push to main | TSC, ESLint, protected files validation |
| Build | After quality | Next.js build, verify output |
| Contract tests | Push to main only | Full chain test (Vapi → Vault → Shopify), USSD unit tests |
| Deploy preview | Pull requests | Vercel preview URL commented on PR |
| Deploy production | Push to main | Vercel prod deploy + health check |

### Monitoring

| Tool | Purpose | Status |
|------|---------|--------|
| PostHog | Product analytics | Configured (key via env) |
| Sentry | Error tracking | DSN empty — disabled (see IN-001) |
| Google Analytics | Web traffic | GA ID not configured (see IN-006) |

### Environment Variables (required)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public key |
| `SUPABASE_SERVICE_KEY` | Supabase admin key |
| `VAPI_PRIVATE_KEY` | Vapi API secret |
| `NEXT_PUBLIC_VAPI_PUBLIC_KEY` | Vapi public key (client) |
| `VAPI_WEBHOOK_SECRET` | Vapi webhook verification |
| `TWILIO_ACCOUNT_SID` | Twilio platform account |
| `TWILIO_AUTH_TOKEN` | Twilio platform auth |
| `SHOPIFY_API_KEY` | Shopify OAuth app key |
| `SHOPIFY_API_SECRET` | Shopify OAuth app secret |
| `BARPEL_CONNECT_CLIENT_ID` | Barpel Connect custom app ID |
| `BARPEL_CONNECT_CLIENT_SECRET` | Barpel Connect custom app secret |
| `DODO_PAYMENTS_API_KEY` | Dodo Payments API |
| `DODO_PAYMENTS_WEBHOOK_KEY` | Dodo webhook verification |
| `DODO_PAYMENTS_ENVIRONMENT` | `test_mode` or `live_mode` |
| `DODO_PAYMENTS_RETURN_URL` | Checkout redirect URL |
| `DODO_PRODUCT_ID_STARTER_MONTHLY` | Dodo product ID |
| `DODO_PRODUCT_ID_GROWTH_MONTHLY` | Dodo product ID |
| `DODO_PRODUCT_ID_SCALE_MONTHLY` | Dodo product ID |
| `DODO_PRODUCT_ID_STARTER_ANNUAL` | Dodo product ID |
| `DODO_PRODUCT_ID_GROWTH_ANNUAL` | Dodo product ID |
| `DODO_PRODUCT_ID_SCALE_ANNUAL` | Dodo product ID |
| `RESEND_API_KEY` | Email service |
| `RESEND_FROM_EMAIL` | Sender address |
| `UPSTASH_REDIS_REST_URL` | Rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limiting auth |
| `CRON_SECRET` | Cron route protection |
| `NEXT_PUBLIC_BASE_URL` | App domain |
| `NEXT_PUBLIC_POSTHOG_KEY` | Product analytics |
| `TAPFILIATE_ACCOUNT_ID` | Affiliate tracking |
| `TAPFILIATE_API_KEY` | Affiliate API |

---

## Affiliate Program *(2026-04-06)*

### Program Structure

| Item | Value |
|------|-------|
| Platform | Tapfiliate |
| Standard commission | 20% recurring |
| Gold tier (25+ referrals) | 25% recurring |
| Cookie duration | 90 days |
| Payout | Monthly Net-30, $50 minimum |

### Technical Integration

| Touch Point | File | What It Does |
|-------------|------|-------------|
| Script + detect | `app/layout.tsx:63-70` | Loads Tapfiliate JS, calls `tap('detect')` |
| Customer tracking | `app/(auth)/signup/SignupContent.tsx:85-87` | `tap('customer', userId)` on email signup only — Google OAuth missing (see AF-001) |
| First payment | `app/api/dodo/webhook/route.ts:156-172` | `createConversion()` on `subscription.active` |
| Renewal | `app/api/dodo/webhook/route.ts:293-305` | `createConversion()` on `subscription.renewed` |
| DB attribution | `merchants.affiliate_referral_code`, `merchants.referred_by_affiliate_id` | Populated from `?ref=` param — population logic incomplete (see AF-002) |

### Key Partners

| Partner | Platform | Status | Est. ARR Potential |
|---------|----------|--------|-------------------|
| Trevor Fenner (Ecommerce Paradise) | YouTube/Email | Active | $17K–$57K |

---

## Component Status Dashboard *(2026-04-06)*

| Component | Status | Notes |
|-----------|--------|-------|
| Homepage + marketing pages | Working | 20+ public pages live |
| Auth (login/signup/OAuth) | Working | Email + Google OAuth + magic link |
| Onboarding (5-step) | Working | Provisioning + call forwarding |
| Dashboard Home | Working | Stats via RPC |
| Call Logs | Working | Filters, pagination, CSV export |
| Integrations | Working | Shopify OAuth (standard + custom app) + BYOC |
| AI Voice Settings | Working | Vapi native voices only |
| Billing (Dodo + Shopify) | Working | Dual system live |
| Settings | Working | Profile, notifications, export, delete |
| Affiliate (Tapfiliate) | Partial | Tracking live; Google OAuth gap (AF-001) |
| Chat Widget | Working | Homepage + dashboard |
| Abandoned Cart Recovery | Working | Via Shopify webhook + cron |
| Outbound Calls | Working | Vapi-powered |
| BYOC Provisioning | Working | Merchant's Twilio credentials |
| Cron Jobs (4) | Working | Dial, cleanup, activation, dunning |

---

## Known Issues

See `skills/Tickets.md` for full ticket list.

**Resolved:**
- ✅ FE-001: ElevenLabs dead code removed from voice page
- ✅ BI-001–BI-008: Flutterwave/Paystack dead code removed (dunning-check, account/delete, billing/info, account/export, useCredits, lib/env.ts)

**Critical (must fix before next release):**
- AF-001: Google OAuth signups not tracked in Tapfiliate
- AF-002: `?ref=` URL param not populated into merchant columns

---

## Contract Tests *(2026-04-06)*

Run `npm run test:contracts` — executes `scripts/full-contract-test.ts`

| # | Contract |
|---|---------|
| 1 | Vapi assistant configuration (system prompt, tools, server URL) |
| 2 | Phone number linked to assistant |
| 3 | Webhook returns correct format (200, toolCallId match, single-line, no newlines) |
| 4 | Order lookup chain (integration active, Vault readable, Shopify returns data) |
| 4b | Token permanence check (`access_scopes.json` returns 200 — confirms permanent auth code grant) |

---

## Next Priorities *(2026-04-06)*

1. Remove all Flutterwave/Paystack dead code (BI-001 through BI-013)
2. Remove ElevenLabs references from voice page (FE-001)
3. Fix Google OAuth Tapfiliate tracking gap (AF-001)
4. Populate `affiliate_referral_code` from `?ref=` URL param on signup (AF-002)
5. Configure Sentry DSN and Google Analytics ID (IN-001, IN-006)

---

**Last reviewed:** 2026-04-06 — Full infrastructure audit; PRD rebuilt from live codebase
**Next review:** After legacy provider removal is complete
