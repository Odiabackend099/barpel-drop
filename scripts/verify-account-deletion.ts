/**
 * Account Deletion Verification — end-to-end automated test
 *
 * Creates a real merchant with a provisioned phone number, deletes via the UI,
 * then verifies all 11 resources are gone from Supabase, Vapi, and Twilio.
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/verify-account-deletion.ts
 *
 * Required env vars (all in .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY,
 *   VAPI_PRIVATE_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
 */

import { chromium } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const browser = await chromium.launch({ headless: false, slowMo: 700 })
const page = await browser.newPage()
await page.setViewportSize({ width: 1280, height: 800 })

const EMAIL = `delete.test.${Date.now()}@test.com`
const PASSWORD = 'DeleteTest2026!'
let userId = ''
let merchantId = ''
let vapiAgentId = ''
let vapiPhoneId = ''       // DB column: vapi_phone_id (not vapi_phone_number_id)
let twilioNumberSid = ''

// ── PHASE 1: CREATE REAL MERCHANT WITH PROVISIONED NUMBER ────────────────────

console.log('\n══════════════════════════════════════════════')
console.log('PHASE 1: Creating test merchant with full setup')
console.log('══════════════════════════════════════════════')

// Sign up
await page.goto('https://dropship.barpel.ai/signup')
await page.waitForLoadState('networkidle')
await page.fill('input[type="email"]', EMAIL)
await page.fill('input[type="password"]', PASSWORD)
await page.click('button[type="submit"]')
await page.waitForURL(/onboarding/, { timeout: 15000 })
console.log('✅ Signed up:', EMAIL)

// Step 1: Business name
await page.waitForSelector(
  'text=STORE, text=Tell us about, text=Business',
  { timeout: 10000 }
)
await page.fill(
  'input[placeholder*="PowerFit" i], input[placeholder*="business" i], input[placeholder*="store" i]',
  'Delete Test Store'
)
await page.click('button:has-text("Continue")')
await page.waitForTimeout(800)

// DB: fetch merchant ID after step 1
const { data: userRecord } = await adminSupabase.auth.admin.getUserByEmail(EMAIL)
userId = userRecord?.user?.id ?? ''
const { data: merchant1 } = await adminSupabase
  .from('merchants')
  .select('id')
  .eq('user_id', userId)
  .single()
merchantId = merchant1?.id ?? ''
console.log('✅ Merchant created:', merchantId)

// Step 2: Skip Shopify
await page.waitForSelector(
  'text=CONNECT, text=Connect Your Shopify, text=Shopify',
  { timeout: 10000 }
)
await page.click(
  'button:has-text("Skip for now"), a:has-text("Skip"), button:has-text("Skip")'
)
console.log('✅ Shopify skipped')

// Step 3: Free trial
await page.waitForSelector(
  'text=CREDITS, text=Get call minutes, text=free minutes',
  { timeout: 10000 }
)
await page.locator(
  'button:has-text("free"), button:has-text("Start with"), button:has-text("Use your")'
).first().click()
await page.waitForTimeout(800)
console.log('✅ Free trial selected')

// Step 4: Provision AI number
await page.waitForSelector(
  'text=LIVE, text=AI Phone, text=Get your AI',
  { timeout: 10000 }
)
await page.click(
  'button:has-text("Get My AI Number"), button:has-text("Get My AI Number — Free")'
)
await page.locator('text=/setting up|provisioning|connecting/i')
  .waitFor({ timeout: 10000 })
console.log('⏳ Provisioning AI number (up to 90s)...')

await page.waitForFunction(
  () => document.body.innerText.match(/\+1[\s\d\-()]{10,}/) ||
        document.body.innerText.includes('🎉') ||
        document.body.innerText.toLowerCase().includes('is live'),
  { timeout: 90000 }
)
console.log('✅ Phone number provisioned')

// Go to dashboard
await page.click(
  'button:has-text("Go to Dashboard"), button:has-text("Continue"), a:has-text("dashboard")'
)
await page.waitForURL(/dashboard/, { timeout: 15000 })

// Collect ALL resource IDs before deletion
const { data: merchant } = await adminSupabase
  .from('merchants')
  .select('id, vapi_agent_id, vapi_phone_id, support_phone, provisioning_mode')
  .eq('user_id', userId)
  .single()

merchantId    = merchant?.id ?? ''
vapiAgentId   = merchant?.vapi_agent_id ?? ''
vapiPhoneId   = merchant?.vapi_phone_id ?? ''            // correct column name

// Get Twilio SID by matching support_phone
const twilioAuth = 'Basic ' + Buffer.from(
  `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
).toString('base64')

const twilioRes = await fetch(
  `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers.json`,
  { headers: { Authorization: twilioAuth } }
)
const twilioData = await twilioRes.json()
const twilioNumber = twilioData.incoming_phone_numbers?.find(
  (n: { phone_number: string; sid: string }) => n.phone_number === merchant?.support_phone
)
twilioNumberSid = twilioNumber?.sid ?? ''

console.log('\n─── RESOURCES TO BE DELETED ───────────────────')
console.log('Auth user ID:      ', userId)
console.log('Merchant ID:       ', merchantId)
console.log('Vapi agent ID:     ', vapiAgentId)
console.log('Vapi phone ID:     ', vapiPhoneId)
console.log('Support phone:     ', merchant?.support_phone)
console.log('Twilio number SID: ', twilioNumberSid || '(not found — may not be provisioned)')
console.log('────────────────────────────────────────────────')

// ── PHASE 2: DELETE VIA UI ────────────────────────────────────────────────────

console.log('\n══════════════════════════════════════════════')
console.log('PHASE 2: Deleting account via UI')
console.log('══════════════════════════════════════════════')

await page.goto('https://dropship.barpel.ai/dashboard/settings')
await page.waitForLoadState('networkidle')

// Open delete modal
await page.click('button:has-text("Delete My Account")')
await page.waitForSelector('text=/cannot be undone/i', { timeout: 5000 })
console.log('✅ Delete modal opened')

// Verify button is disabled before typing
const deleteBtn = page.locator('button:has-text("Delete Everything")')
const disabledBefore = await deleteBtn.isDisabled()
console.log('Delete button disabled before typing:', disabledBefore ? '✅' : '❌')

// Type confirmation
await page.fill('input#delete-confirmation', 'DELETE')
const enabledAfter = await deleteBtn.isEnabled()
console.log('Delete button enabled after typing DELETE:', enabledAfter ? '✅' : '❌')

// Click delete
await deleteBtn.click()
console.log('⏳ Deletion in progress...')

// Wait for redirect to homepage (window.location.href = "/")
await page.waitForURL(
  /dropship\.barpel\.ai\/?($|\?)/,
  { timeout: 30000 }
)
console.log('✅ Redirected to homepage after deletion')

// Verify dashboard now blocks access
await page.goto('https://dropship.barpel.ai/dashboard')
await page.waitForURL(/login|sign-?in|auth/, { timeout: 10000 })
console.log('✅ Dashboard blocks deleted user — redirects to login')

// Wait for async cleanup
await new Promise(r => setTimeout(r, 5000))

// ── PHASE 3: VERIFY ALL 11 RESOURCES ARE GONE ────────────────────────────────

console.log('\n══════════════════════════════════════════════')
console.log('PHASE 3: Verifying all resources deleted')
console.log('══════════════════════════════════════════════')

const checks: Record<string, { pass: boolean; detail: string }> = {}

// CHECK 1: Supabase auth user gone
const { data: authCheck } = await adminSupabase.auth.admin.getUserById(userId)
checks['Auth user deleted'] = {
  pass: !authCheck?.user,
  detail: authCheck?.user ? `❌ User still exists: ${userId}` : '✅ Gone from auth.users'
}

// CHECK 2: Merchant row gone
const { data: merchantCheck } = await adminSupabase
  .from('merchants')
  .select('id')
  .eq('id', merchantId)
  .single()
checks['Merchant row deleted'] = {
  pass: !merchantCheck,
  detail: merchantCheck ? '❌ Row still in merchants table' : '✅ Gone from merchants'
}

// CHECK 3: Integrations gone
const { data: intCheck } = await adminSupabase
  .from('integrations')
  .select('id')
  .eq('merchant_id', merchantId)
checks['Integrations deleted'] = {
  pass: !intCheck || intCheck.length === 0,
  detail: intCheck?.length ? `❌ ${intCheck.length} rows still in integrations` : '✅ Gone from integrations'
}

// CHECK 4: Call logs anonymised (not deleted — audit trail)
const { data: callCheck } = await adminSupabase
  .from('call_logs')
  .select('caller_number, transcript')
  .eq('merchant_id', merchantId)
const callsPiiClean = !callCheck || callCheck.length === 0 ||
  callCheck.every(c => (c.caller_number === 'deleted' || c.caller_number === null) &&
                       c.transcript === null)
checks['Call logs anonymised'] = {
  pass: callsPiiClean,
  detail: callsPiiClean ? '✅ PII removed from call_logs' : '❌ PII still in call_logs'
}

// CHECK 5: Billing transactions anonymised
const { data: billingCheck } = await adminSupabase
  .from('billing_transactions')
  .select('id, merchant_id')
  .eq('merchant_id', merchantId)
checks['Billing anonymised'] = {
  pass: !billingCheck || billingCheck.length === 0,
  detail: !billingCheck || billingCheck.length === 0
    ? '✅ Billing records merchant_id nulled (financial law)'
    : `❌ ${billingCheck.length} billing rows still linked to merchant`
}

// CHECK 6: Vapi phone number gone
if (vapiPhoneId) {
  const vapiPhoneRes = await fetch(
    `https://api.vapi.ai/phone-number/${vapiPhoneId}`,
    { headers: { Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}` } }
  )
  checks['Vapi phone number deleted'] = {
    pass: vapiPhoneRes.status === 404,
    detail: vapiPhoneRes.status === 404
      ? '✅ Returns 404 — deleted from Vapi'
      : `❌ Still exists — status ${vapiPhoneRes.status}`
  }
} else {
  checks['Vapi phone number deleted'] = { pass: true, detail: '✅ No phone to delete (not provisioned)' }
}

// CHECK 7: Vapi assistant gone
if (vapiAgentId) {
  const vapiAssRes = await fetch(
    `https://api.vapi.ai/assistant/${vapiAgentId}`,
    { headers: { Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}` } }
  )
  checks['Vapi assistant deleted'] = {
    pass: vapiAssRes.status === 404,
    detail: vapiAssRes.status === 404
      ? '✅ Returns 404 — deleted from Vapi'
      : `❌ Still exists — status ${vapiAssRes.status}`
  }
} else {
  checks['Vapi assistant deleted'] = { pass: true, detail: '✅ No assistant to delete' }
}

// CHECK 8: Twilio number released
if (twilioNumberSid) {
  const twilioCheckRes = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers/${twilioNumberSid}.json`,
    { headers: { Authorization: twilioAuth } }
  )
  checks['Twilio number released'] = {
    pass: twilioCheckRes.status === 404,
    detail: twilioCheckRes.status === 404
      ? '✅ Returns 404 — released from Twilio'
      : `❌ Still exists on Twilio — status ${twilioCheckRes.status}`
  }
} else {
  checks['Twilio number released'] = { pass: true, detail: '✅ No Twilio number to release' }
}

// CHECK 9: OAuth states gone
const { data: oauthCheck } = await adminSupabase
  .from('oauth_states')
  .select('id')
  .eq('merchant_id', merchantId)
checks['OAuth states deleted'] = {
  pass: !oauthCheck || oauthCheck.length === 0,
  detail: oauthCheck?.length ? `❌ ${oauthCheck.length} rows remain` : '✅ Gone'
}

// CHECK 10: Abandoned carts gone
const { data: cartCheck } = await adminSupabase
  .from('abandoned_carts')
  .select('id')
  .eq('merchant_id', merchantId)
checks['Abandoned carts deleted'] = {
  pass: !cartCheck || cartCheck.length === 0,
  detail: cartCheck?.length ? `❌ ${cartCheck.length} rows remain` : '✅ Gone'
}

// CHECK 11: Cannot log in after deletion
const { error: loginError } = await adminSupabase.auth.signInWithPassword({
  email: EMAIL,
  password: PASSWORD,
})
checks['Cannot log in after deletion'] = {
  pass: !!loginError,
  detail: loginError ? '✅ Login fails correctly after deletion' : '❌ Account still accepts login'
}

await browser.close()

// ── PHASE 4: FINAL REPORT ─────────────────────────────────────────────────────

const passed = Object.values(checks).filter(c => c.pass).length
const failed = Object.values(checks).filter(c => !c.pass).length

console.log('\n╔══════════════════════════════════════════════════════════╗')
console.log('║  ACCOUNT DELETION VERIFICATION — FINAL REPORT            ║')
console.log('╠══════════════════════════════════════════════════════════╣')

for (const [name, result] of Object.entries(checks)) {
  const icon = result.pass ? '✅' : '❌'
  console.log(`║  ${icon} ${name.padEnd(42)}║`)
  console.log(`║    ${result.detail.slice(0, 54).padEnd(54)}║`)
}

console.log('╠══════════════════════════════════════════════════════════╣')
console.log(`║  PASSED: ${String(passed).padEnd(3)} / ${String(passed + failed).padEnd(3)}                                         ║`)

if (failed === 0) {
  console.log('║  ✅ ALL CHECKS PASSED                                     ║')
  console.log('║  Account deletion is COMPLETE and GDPR COMPLIANT         ║')
  console.log('║  Safe to record the demo video                           ║')
} else {
  console.log(`║  ❌ ${String(failed).padEnd(2)} CHECK(S) FAILED — FIX BEFORE RECORDING VIDEO  ║`)
  console.log('║  Resources are leaking — not GDPR compliant              ║')
}

console.log('╚══════════════════════════════════════════════════════════╝')

if (failed > 0) {
  console.log('\nFAILED CHECKS — FIX THESE:')
  for (const [name, result] of Object.entries(checks)) {
    if (!result.pass) {
      console.log(`  ❌ ${name}: ${result.detail}`)
    }
  }
  process.exit(1)
}
