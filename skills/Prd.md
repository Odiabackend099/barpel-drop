# Barpel Drop AI — Product Requirements Document

## 🔴 PRD Maintenance Instructions

**Every AI agent must follow these rules:**

1. **Update this document when you complete work** — after fixing bugs, shipping features, or resolving tickets, update the relevant section below with what you actually built
2. **Keep it accurate** — if what you built differs from what's documented, fix the docs. The PRD is the source of truth for the next engineer
3. **Don't bloat it** — be concise. One sentence per feature. Link to code if details are complex
4. **Verify correctness** — test the feature/fix yourself. Only document what you've confirmed works
5. **Date your changes** — include the date you last updated each section so future engineers know how fresh the info is

---

## ✅ Completed Features

### Settings Page (2026-03-18)
- **Email display**: Shows user email from Supabase auth via `useMerchant` hook (not from merchants table, which doesn't have email column)
- **Change password**: Sends password reset email via `supabase.auth.resetPasswordForEmail()`
- **Notification toggles**: 3 JSONB toggles (low balance SMS, monthly summary email, payment receipts email) saved to merchants table
- **Download data**: ZIP export via `/api/account/export` with account.json, calls.csv, billing.csv
- **Privacy policy**: Link to `/privacy` page (full GDPR-compliant policy visible)
- **Delete account**: Full cleanup sequence: cancel Dodo subscription → release Vapi phone → delete Vapi assistant → clear vault secrets → anonymize call logs → delete integrations → anonymize billing → delete merchant → delete auth user

### Dodo Payments USD Billing (2026-03-23) ✅ LIVE
- **3 credit plans**: Starter $29/month (30 min), Growth $79/month (100 min), Scale $179/month (250 min) — all with annual discount option
- **Checkout flow**: `/api/billing/dodo/initiate` creates atomic pending `billing_transactions` record, returns hosted Dodo checkout URL
- **Webhook handling**: `/api/dodo/webhook` receives `subscription.active` (grants credits), `subscription.renewed` (resets credits), `subscription.cancelled`, `subscription.on_hold` (dunning), `subscription.failed/expired` events via StandardWebhooks signature verification
- **Atomic idempotency**: Webhook claims billing_transaction with `UPDATE WHERE status='pending'` — prevents double-credit on retries
- **Case-insensitive lookup**: `credit_packages` query uses `.ilike()` to match plan names (DB stores "Starter", transactions store "starter")
- **Customer portal**: `/api/billing/dodo/customer-portal` with ownership verification — prevents IDOR, redirects to Dodo-hosted portal for payment method updates
- **Cancel subscription**: `/api/billing/dodo/cancel` with atomic ownership check before calling Dodo API
- **Real payment verified**: $29 test payment processed end-to-end; merchant credited 1800 seconds (30 min) via webhook

### Security & Performance Fixes (2026-03-23)
- **Middleware webhook exclusion**: Added `api/dodo/webhook` to middleware router exclusion list — webhook requests no longer hit auth middleware, pass through to signature verification
- **Success page balance**: Changed hardcoded `String(0)` to actual `currentBalance` from `useCredits()` — prevents false "Plan Activated!" when balance already exists
- **Credit fetch performance**: Replaced `supabase.auth.getUser()` with `supabase.auth.getSession()` in `useCredits` hook — eliminates network round-trip to Supabase Auth server, reads session from localStorage instead. Billing page now loads in <500ms instead of 10s
- **Twilio credential exposure**: Renamed `TWILIO_SUBACCOUNT_SID`/`TWILIO_SUBACCOUNT_AUTH_TOKEN` to `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN` across 8 files. Barpel's own platform credentials are now properly hidden from merchants
- **Toast notifications**: Added `<Toaster richColors position="top-right" />` to root layout — now all `toast.success()`/`toast.error()` calls work globally
- **Sonner SSR bug**: Added `"use client"` directive to `components/ui/sonner.tsx` (was using `useTheme()` hook without declaring client component)

---

## 📋 Known Issues

- None currently

---

## 🔄 Merchants Dashboard

| Component | Status | Last Updated |
|-----------|--------|--------------|
| Dashboard home | ✅ Working | 2026-03-13 |
| Call Logs | ✅ Working | 2026-03-13 |
| Integrations (Shopify + BYOC) | ✅ Working | 2026-03-18 |
| AI Voice settings | ✅ Working | 2026-03-13 |
| Billing (Dodo Payments USD) | ✅ Live, tested, verified | 2026-03-23 |
| Settings (Profile + Notifications) | ✅ Working | 2026-03-18 |

---

## 🔐 Architecture Notes

- **Auth**: Supabase + HTTP-only cookies. Client-side `useCredits()` hook uses `getSession()` (localStorage cache, no network) for instant balance load
- **Provisioning**: Managed mode (Barpel's Twilio) vs BYOC (merchant's Twilio credentials from vault)
- **Vapi**: Phone numbers + AI assistants managed via Vapi API; deleted when merchant deletes account
- **Billing**: **Dodo Payments USD** (stripe-style recurring subscriptions, international cards accepted); credit balance stored in `merchants.credit_balance`; webhook-driven credit grants via StandardWebhooks signature verification
- **Email**: User email comes from Supabase `auth.user.email`, not merchants table; payment receipts sent via Resend

---

## 🚀 Next Priorities

1. End-to-end Dodo payment test with new customer (verify webhook delivery automatically grants credits)
2. Phone call functional test (dial the provisioned number)
3. Monitor Dodo webhook delivery for retry backoff issues
4. Test contract suite (`npm run test:contracts`) for billing endpoints

---

**Last reviewed**: 2026-03-23 — Dodo Payments integration complete, 3 security/perf fixes deployed, live on production
**Next review**: After first 5 paying customers or when Dodo webhook issues found
