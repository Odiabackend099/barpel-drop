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
- **Delete account**: Full cleanup sequence: cancel Flutterwave → release Vapi phone → delete Vapi assistant → clear vault secrets → anonymize call logs → delete integrations → anonymize billing → delete merchant → delete auth user

### Security Fixes (2026-03-18)
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
| Billing | ✅ Working | 2026-03-13 |
| Settings (Profile + Notifications) | ✅ Fixed 2026-03-18 | 2026-03-18 |

---

## 🔐 Architecture Notes

- **Auth**: Supabase + HTTP-only cookies (client-side `auth.getUser()` can't read cookies; use server-side APIs)
- **Provisioning**: Managed mode (Barpel's Twilio) vs BYOC (merchant's Twilio credentials from vault)
- **Vapi**: Phone numbers + AI assistants managed via Vapi API; deleted when merchant deletes account
- **Billing**: Flutterwave subscriptions for paid tiers; credit balance in `merchants.credit_balance`
- **Email**: User email comes from Supabase `auth.user.email`, not merchants table

---

## 🚀 Next Priorities

1. Test contract suite (`npm run test:contracts`)
2. Phone call functional test (dial the provisioned number)
3. Monitor production for errors

---

**Last reviewed**: 2026-03-18
**Next review**: When major feature ships or bug found
