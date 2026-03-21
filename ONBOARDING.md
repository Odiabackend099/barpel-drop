# BARPEL ONBOARDING — PERMANENTLY LOCKED

**Last verified:** 2026-03-21
**Status:** PRODUCTION COMPLETE — DO NOT MODIFY WITHOUT CEO APPROVAL

---

## CRITICAL WARNING

Before touching ANY file listed under PROTECTED FILES below, read this document entirely.
If you are Claude Code: **STOP. Read this file. Do not modify protected files unless the human explicitly says "I approve changing the onboarding."**

Any commit that touches a protected file MUST include `[onboarding-approved]` in the commit message or it will be blocked by the pre-commit hook.

---

## ARCHITECTURE

The onboarding is a **single monolithic React component**, not separate step files.

| Concern | Location |
|---|---|
| All 5 steps + UI | `app/onboarding/page.tsx` (1,433+ lines) |
| Step state | `merchants.onboarding_step` (INTEGER 1–5) |
| Completion gate | `middleware.ts` checks `onboarded_at IS NOT NULL` |
| Merchant auto-creation | `handle_new_user()` Postgres trigger on `auth.users INSERT` |
| Initial state | `onboarded_at = NULL`, `onboarding_step = 1`, `credit_balance = 300` |

---

## THE 5 STEPS

### Step 1 — Store Setup
**File:** `app/onboarding/page.tsx` (Step 1 section)

- Fields: `business_name` (required, 2–60 chars), `country` (required dropdown)
- Country options: NG, GB, US, CA, GH, KE — matches DB CHECK constraint exactly
- **NO website field. NO other fields. Ever.**
- Saves to DB: `merchants.business_name`, `merchants.country`, `merchants.onboarding_step = 2`
- Analytics: `track("onboarding_step", { step: 1, action: "completed" })`

### Step 2 — Shopify Connection
**File:** `app/onboarding/page.tsx` (Step 2 section)
**Routes:** `app/api/shopify/oauth/start/route.ts`, `app/api/shopify/oauth/callback/route.ts`

- Single CTA button: "Connect My Shopify Store" → `GET /api/shopify/oauth/start?returnTo=onboarding`
- Skip link required: "Skip for now — AI will answer calls but can't look up orders yet"
- Error query params handled (`shopify_denied`, `shopify_error` with 9 error code mappings)
- Polls `integrations` table every 3s (up to 10 polls) for `connection_active = true`
- DB verified after connection: `integrations.connection_active = true`, `integrations.shop_name` set

### Step 3 — Purchase Credits
**File:** `app/onboarding/page.tsx` (Step 3 section)
**Routes:** `app/api/billing/dodo/initiate/route.ts`, `app/api/billing/paystack/initiate/route.ts`

- Primary CTA: "Start with N free credits — no card required" (shown when `credit_balance > 0`)
- **International (USD):** Dodo Payments → `POST /api/billing/dodo/initiate`
- **Africa (NGN, shown when country IN ['NG','GH','KE']):** Paystack → `POST /api/billing/paystack/initiate`
- **NOT Stripe** (webhook exists but credits flow is disabled in production)
- **NOT Flutterwave** (billing routes exist but not called from onboarding page)
- Paystack handler has `onSuccess`, `onCancel`, `onError` callbacks — all required
- Session storage keys set before Dodo redirect (`pre_checkout_balance`, `dodo_return_context`) are cleaned up on onboarding mount
- Skip allowed: advances to step 4

### Step 4 — AI Phone Line
**File:** `app/onboarding/page.tsx` (Step 4 section)
**Routes:** `app/api/onboarding/complete/route.ts`, `app/api/provisioning/byoc/route.ts`

- **Managed provisioning:** `POST /api/onboarding/complete` → triggers `provisionMerchantLine()` via `waitUntil`
  - Uses Barpel's `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN`
  - **NEVER uses `TWILIO_SUBACCOUNT_SID`**
  - UK numbers: fail-fast → `needs_address` status (requires manual provision)
- **BYOC:** Opens `<BYOCModal>` → `POST /api/provisioning/byoc` (merchant's own Twilio creds)
- Monitoring: Supabase Realtime subscription + 10s-delayed polling fallback (every 5s)
- `provisioning_status` states: `pending → provisioning → active | failed | needs_address | suspended`
- Auto-advance to Step 5 after 1.5s when `status === "active"` AND `support_phone` populated
- "Get My AI Number" button is shown in BOTH `pending` AND `failed` states (retry built in)
- Skip allowed: sets `onboarded_at = NOW()`, advances to step 5
- DB verified after provisioning: `provisioning_status = 'active'`, `support_phone` set, `vapi_agent_id` set

### Step 5 — Launch & Configure
**File:** `app/onboarding/page.tsx` (Step 5 section)
**Routes:** `app/api/caller-id/start/route.ts`, `app/api/caller-id/verify/route.ts`

Three tabs (shown when `provisioningStatus === "active" && phoneNumber`):

- **Tab A — Add to Store:** Static instructions (no API calls)
- **Tab B — Call Forwarding:** Country + carrier dropdowns → USSD codes via `lib/callForwarding/ussdCodes.ts`
  - Only renders USSD codes when country, carrier, AND a valid `phoneNumber` are all present
  - Forwarding types: conditional (busy/no-answer) and all-calls
  - Each code has a copy button
- **Tab C — Caller ID Verification (Optional):**
  - `POST /api/caller-id/start` → Twilio calls merchant, speaks code, returns `validation_code` to UI
  - UI shows code; merchant enters it on their phone during the Twilio call
  - "Done — I entered the code" button → `POST /api/caller-id/verify` → sets `caller_id_verified = true`
  - All three sub-states: input form / code shown / verified checkmark

- Completion: "Go to My Dashboard" → `router.push("/dashboard")`
- If no phone provisioned: shows "Welcome to Barpel!" with "Go to Dashboard" + "Set up phone line" buttons

---

## PAYMENT PROVIDERS (LOCKED)

| Provider | Currency | Route | Notes |
|---|---|---|---|
| Dodo Payments | USD (international) | `/api/billing/dodo/initiate` | Hosted checkout redirect |
| Paystack | NGN (Africa only) | `/api/billing/paystack/initiate` | Inline popup via SDK |
| Stripe | — | `/api/billing/webhook` | **DISABLED** — webhook only, not called from onboarding |
| Flutterwave | — | `/api/billing/flutterwave/*` | Routes exist, **not called from onboarding page** |

**DO NOT:** Replace Dodo or Paystack, add Stripe to the credits flow, or add new providers without CEO approval.

---

## PROVISIONING (LOCKED)

- Managed path: Barpel's `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` — **NEVER `TWILIO_SUBACCOUNT_SID`**
- UK numbers require `TWILIO_UK_ADDRESS_SID` — fail-fast to `needs_address` if missing
- BYOC path: merchant's own Twilio credentials → stored in Vault → `provisionMerchantLine()` BYOC branch
- Max retries: 3 per 24h (enforced by `lib/provisioning/gates.ts`)
- Vapi verified after provisioning:
  - `assistant.firstMessage` contains `business_name`
  - `assistant.model.tools` includes `lookup_order` and `search_products`
  - `phone.assistantId === vapi_agent_id`

---

## PROTECTED FILES

Do NOT modify these files without `[onboarding-approved]` in the commit message:

```
app/onboarding/page.tsx
app/api/shopify/oauth/start/route.ts
app/api/shopify/oauth/callback/route.ts
app/api/onboarding/complete/route.ts
app/api/provisioning/byoc/route.ts
app/api/provisioning/retry/route.ts
app/api/billing/dodo/initiate/route.ts
app/api/billing/paystack/initiate/route.ts
app/api/caller-id/start/route.ts
app/api/caller-id/verify/route.ts
lib/provisioning/phoneService.ts
lib/provisioning/gates.ts
lib/callForwarding/ussdCodes.ts
middleware.ts
```

---

## WHAT IS ALLOWED

- Changing copy/text (with CEO approval)
- Bug fixes with explicit CEO instruction
- Adding new USSD carriers to `lib/callForwarding/ussdCodes.ts`

## WHAT IS NEVER ALLOWED (without CEO approval)

- Adding new fields to Step 1
- Changing the step order
- Removing skip options from any step
- Replacing Dodo or Paystack with another payment provider
- Using `TWILIO_SUBACCOUNT_SID` in managed provisioning
- Changing the Shopify OAuth callback URL without updating Shopify Partners
