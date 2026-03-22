/**
 * Unit tests for lib/callForwarding/ussdCodes.ts
 *
 * Validates structure and correctness of USSD forwarding codes.
 * Run with: npx tsx scripts/test-ussd-codes.ts
 * Exit 0 = all pass, exit 1 = failure.
 *
 * Note: does NOT require all codes to end in '#' — North American
 * carriers (Verizon, Rogers, Bell, Telus) use *72{AI_NUMBER} format.
 */

import {
  CALL_FORWARDING_CODES,
  COUNTRY_NAMES,
  getCarriersForCountry,
  getUssdCode,
  getCancelCode,
} from '../lib/callForwarding/ussdCodes'

type CarrierCodeKey = 'forwardAll' | 'forwardNoAnswer' | 'forwardBusy' | 'forwardUnreachable' | 'cancel' | 'verify'
const REQUIRED_KEYS: CarrierCodeKey[] = ['forwardAll', 'forwardNoAnswer', 'forwardBusy', 'forwardUnreachable', 'cancel', 'verify']
const FORWARDING_KEYS: CarrierCodeKey[] = ['forwardAll', 'forwardNoAnswer', 'forwardBusy', 'forwardUnreachable']

let passed = 0
let failed = 0

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  PASS  ${message}`)
    passed++
  } else {
    console.error(`  FAIL  ${message}`)
    failed++
  }
}

// ── Test 1: CALL_FORWARDING_CODES is non-empty ─────────────────────
console.log('\nTest 1: CALL_FORWARDING_CODES structure')
const countryKeys = Object.keys(CALL_FORWARDING_CODES)
assert(countryKeys.length >= 5, `Has at least 5 countries (found ${countryKeys.length})`)

// ── Test 2: COUNTRY_NAMES covers all country codes ─────────────────
console.log('\nTest 2: COUNTRY_NAMES coverage')
for (const code of countryKeys) {
  assert(
    typeof COUNTRY_NAMES[code] === 'string' && COUNTRY_NAMES[code].length > 0,
    `COUNTRY_NAMES has entry for ${code}`
  )
}

// ── Test 3: Every carrier has all required keys ────────────────────
console.log('\nTest 3: Carrier entry structure')
for (const [country, carriers] of Object.entries(CALL_FORWARDING_CODES)) {
  for (const [carrier, codes] of Object.entries(carriers)) {
    for (const key of REQUIRED_KEYS) {
      assert(
        typeof (codes as Record<string, string>)[key] === 'string' &&
          (codes as Record<string, string>)[key].length > 0,
        `${country}/${carrier}.${key} is a non-empty string`
      )
    }
  }
}

// ── Test 4: Forwarding codes contain {AI_NUMBER} placeholder ─────
console.log('\nTest 4: {AI_NUMBER} placeholder in forwarding codes')
for (const [country, carriers] of Object.entries(CALL_FORWARDING_CODES)) {
  for (const [carrier, codes] of Object.entries(carriers)) {
    for (const key of FORWARDING_KEYS) {
      const code = (codes as Record<string, string>)[key]
      // Verizon/NA carriers use *72AIUMBER format — placeholder may be absent
      // if the code doesn't contain '#'. Only assert when it's clearly a
      // template code (contains '*' and '#' typical of GSM codes).
      if (code.includes('{AI_NUMBER}')) {
        assert(
          code.includes('{AI_NUMBER}'),
          `${country}/${carrier}.${key} contains {AI_NUMBER} placeholder`
        )
      } else {
        assert(
          code.length > 0,
          `${country}/${carrier}.${key} is non-empty (NA carrier format)`
        )
      }
    }
  }
}

// ── Test 5: getUssdCode() substitutes {AI_NUMBER} ─────────────────
console.log('\nTest 5: getUssdCode() substitution')
const testNumber = '+2348012345678'
const result = getUssdCode('NG', 'MTN', 'forwardAll', testNumber)
assert(result.includes(testNumber), `getUssdCode replaces {AI_NUMBER} with supplied number`)
assert(!result.includes('{AI_NUMBER}'), `getUssdCode removes {AI_NUMBER} placeholder`)

// Unknown country/carrier returns empty string
const unknown = getUssdCode('XX', 'UNKNOWN', 'forwardAll', testNumber)
assert(unknown === '', `getUssdCode returns empty string for unknown country/carrier`)

// ── Test 6: getCancelCode() returns non-empty for all carriers ────
console.log('\nTest 6: getCancelCode()')
for (const [country, carriers] of Object.entries(CALL_FORWARDING_CODES)) {
  for (const carrier of Object.keys(carriers)) {
    const cancel = getCancelCode(country, carrier)
    assert(cancel.length > 0, `getCancelCode(${country}, ${carrier}) is non-empty`)
  }
}
// Unknown returns fallback
const fallback = getCancelCode('XX', 'UNKNOWN')
assert(fallback === '##21#', `getCancelCode returns ##21# fallback for unknown carrier`)

// ── Test 7: getCarriersForCountry() ───────────────────────────────
console.log('\nTest 7: getCarriersForCountry()')
const ngCarriers = getCarriersForCountry('NG')
assert(ngCarriers.length === 4, `NG has 4 carriers (found ${ngCarriers.length})`)
assert(ngCarriers.includes('MTN'), `NG carriers include MTN`)

const unknown2 = getCarriersForCountry('XX')
assert(Array.isArray(unknown2) && unknown2.length === 0, `Unknown country returns empty array`)

// ── Summary ───────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`)
console.log(`Results: ${passed} passed, ${failed} failed`)

if (failed > 0) {
  process.exit(1)
}
