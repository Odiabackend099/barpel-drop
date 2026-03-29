# Act As A Business User — Test Scope for Barpel Drop AI

## Who is the business user?

Two types of merchants use Barpel AI:

1. **Shopify merchant** — installs the app from the Shopify App Store. Billing is managed by Shopify (Managed Pricing). They never see Dodo Payments.
2. **Direct signup** — signs up at `https://dropship.barpel.ai`. Billing is through Dodo Payments (USD, international cards). They never see Shopify billing controls.

Both are non-technical. They expect everything to just work.

---

## Full User Journey (in order)

### 1. Discovery & Signup
- Lands on `https://dropship.barpel.ai` (marketing page)
- Reads features, clicks "Get Started" or "Start Free Trial"
- Signs up with email + password
- Is redirected to onboarding

### 2. Onboarding — Step 1: Business Info
- Fills in business name
- Selects country (US)
- Clicks Continue

### 3. Onboarding — Step 2: Connect Shopify
- Enters their Shopify store domain
- Clicks "Connect My Shopify Store"
- Completes Shopify OAuth (external — human assisted)
- Returns to onboarding, sees "Connected" badge

### 4. Onboarding — Step 3: Free Credits
- Receives 5 free credits (300 seconds) automatically on account creation
- No payment is required during onboarding
- Payment happens later on the `/dashboard/billing` page when credits run out

### 5. Onboarding — Step 4: Set Up AI Phone Line
- Chooses BYOC (Bring Your Own Number) using Twilio credentials
- Fills SID, auth token, phone number
- Clicks "Connect My Number →"
- Waits for provisioning (AI line goes active)

### 6. Onboarding — Step 5: Ready
- Sees phone number displayed
- Sees "Add to Store" instructions
- Copies phone number
- Clicks "Go to Dashboard"

### 7. Dashboard — Daily Use
- Views real-time stats (calls today, credits used, money saved)
- Checks call logs (list, search, filter by sentiment, view transcript)
- Manages AI Voice (greeting, personality, voice type)
- Checks Integrations (phone line active, Shopify connected)
- Views Billing (balance, transaction history, upgrade plan)
- Manages Settings (business name, notifications, download data)

### 8. Billing — Two Paths

**Path A: Shopify merchant** (installed via App Store)
- Billing page shows "Billing managed by Shopify" panel
- "Manage in Shopify Admin" button links to their Shopify admin charges page
- No Dodo plan cards, no Dodo payment controls
- Plan upgrade/downgrade/cancel happens in Shopify Admin

**Path B: Direct signup** (non-Shopify or self-service)
- Billing page shows 3 plan cards (Starter $29, Growth $79, Scale $179)
- Monthly/Annual toggle with "Save 10%" badge
- Clicking "Subscribe" → redirects to Dodo-hosted checkout page
- On completion, user is redirected to `/dashboard/billing/success`
- Credits are granted via webhook (not redirect)
- "Manage USD Subscription" section shows Update Payment Method + Cancel Subscription

### 9. Edge Cases to Test
- Tries to submit empty forms (should show validation errors)
- Tries to delete account (opens modal, sees warnings, clicks Cancel)
- Toggles notification preferences (should persist across page reload)
- Tries changing password (should receive reset email)
- Downloads data export (should get ZIP file with account.json, calls.csv, billing.csv)

---

## What the Business User Does NOT Care About

- Internal API payloads
- Database schemas
- Webhook signatures
- Cron jobs
- Admin routes
- BYOC Vault secrets

---

## Success Criteria

✅ Every button works
✅ Every form validates (empty fields blocked, inline errors shown)
✅ Every page loads in <3 seconds
✅ Errors show helpful messages (not "undefined" or blank screens)
✅ No console errors in production
✅ Session persists (login → navigate → still logged in)
✅ Forms save changes (update business name → refresh → persists)
✅ Notifications work (toast on success, error, warning)
✅ Shopify merchants never see Dodo plan cards or payment controls
✅ Non-Shopify merchants never see "Billing managed by Shopify" panel

---

## Pages & Flows to Test

| Page | Critical Tests |
|------|---|
| `/` (Home) | CTAs work, navigation visible |
| `/signup` | Email + password validation, account creation, redirect to onboarding |
| `/onboarding` (Steps 1-5) | All form inputs, continue buttons, redirects, error states |
| `/dashboard` | Stats load, sidebar nav works, empty state if no calls |
| `/dashboard/calls` | List renders, search/filter work, pagination, detail view |
| `/dashboard/voice` | Greeting save, voice selector, personality fields, char counts |
| `/dashboard/integrations` | Phone line status, Shopify connected badge, cart toggle, modals |
| `/dashboard/billing` | Balance display, correct UI for Shopify vs Dodo merchant, transaction history, chart renders |
| `/dashboard/settings` | Business name save, password reset, 3 toggles, download, delete modal |
| `/privacy` | Page loads, content visible |
| `/login` | Email + password fields, sign-in, redirect to dashboard |

---

## Authentication Note

TestSprite will use email + password Supabase auth. No OAuth or magic links during the automated test.

---

**Last Updated:** 2026-03-29
**Test Status:** Pending TestSprite run
