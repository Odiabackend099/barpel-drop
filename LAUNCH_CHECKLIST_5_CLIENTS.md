# Production Launch Checklist — First 5 Clients

**Status:** 🔴 NOT READY (Critical items must be checked before proceeding)
**Date Created:** 2026-04-05
**Last Updated:** 2026-04-05

---

## ⚠️ CRITICAL BLOCKERS (Must Complete)

### 1. USSD Code Verification
**Task:** Verify all USSD codes with REAL phones before any merchant goes live

| Carrier | Country | Code | Status | Verified By | Date |
|---------|---------|------|--------|-------------|------|
| T-Mobile | US | `*72+[number]#` | 🔴 PENDING | | |
| Verizon | US | `*72+[number]#` | 🔴 PENDING | | |
| AT&T | US | myAT&T app | 🔴 PENDING | | |
| O2 | GB | `*21*[number]#` | 🔴 PENDING | | |
| Vodafone | GB | `*21*[number]#` | 🔴 PENDING | | |
| MTN | NG | `*21*[number]#` | 🔴 PENDING | | |
| Airtel | NG | `**21*[number]#` | 🔴 PENDING | | |

**How to verify:**
1. Get a test SIM card with that carrier
2. Get a Barpel phone number to forward to
3. Dial the USSD code on the test phone
4. Call the Barpel number from another phone
5. Verify the call rings on the Barpel line (not original number)
6. Update the table above with ✅ VERIFIED

**Blockers:** ⛔ **Do NOT onboard any merchant until code is verified**

---

### 2. E.164 Regex Validation
**Task:** Verify the E.164 regex works for all 5 clients' actual phone numbers

```typescript
// Regex: /^\+[1-9]\d{6,14}$/
```

**Client Phone Numbers:**
- Client 1: `[INSERT ACTUAL NUMBER]` → Test: `regex.test(number)` = ✅ PASS / 🔴 FAIL
- Client 2: `[INSERT ACTUAL NUMBER]` → Test: `regex.test(number)` = ✅ PASS / 🔴 FAIL
- Client 3: `[INSERT ACTUAL NUMBER]` → Test: `regex.test(number)` = ✅ PASS / 🔴 FAIL
- Client 4: `[INSERT ACTUAL NUMBER]` → Test: `regex.test(number)` = ✅ PASS / 🔴 FAIL
- Client 5: `[INSERT ACTUAL NUMBER]` → Test: `regex.test(number)` = ✅ PASS / 🔴 FAIL

**If ANY fail:** Update regex or notify client of format requirement

---

### 3. Caller ID Verification Timing
**Task:** Measure actual Twilio verification call latency

```bash
# Execute this test 5 times with real Twilio account
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/OutgoingCallerIds.json" \
  -d "PhoneNumber=+1234567890" \
  --basic --user "${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}" \
  --time-all
```

**Results:**
1. Test 1: `[LATENCY]` seconds
2. Test 2: `[LATENCY]` seconds
3. Test 3: `[LATENCY]` seconds
4. Test 4: `[LATENCY]` seconds
5. Test 5: `[LATENCY]` seconds

**Average:** `[AVERAGE]` seconds
**Max + 10s buffer:** `[MAX + 10]` seconds

**Action:** Update onboarding copy in `app/onboarding/page.tsx` line 1320 with actual value (currently says "60 seconds")

---

### 4. Stale-Dial Guard Testing
**Task:** Confirm stale-dial guard works correctly (NULL handling)

```bash
# Create a test pending call with NULL last_attempted_at
INSERT INTO pending_outbound_calls (merchant_id, status, last_attempted_at, ...)
VALUES (..., 'dialing', NULL, ...);

# Run cron (should NOT reset NULL call)
GET /api/cron/dial-pending?secret=CRON_SECRET

# Verify: call is still 'dialing' (not reset to 'pending')
SELECT status FROM pending_outbound_calls WHERE id = '[TEST_ID]';
```

**Result:** ✅ PASS / 🔴 FAIL

---

### 5. Twilio Rollback Testing
**Task:** Confirm Twilio number rollback works on Vapi import failure

```bash
# Simulate: Provision new merchant, force Vapi import to fail
POST /api/onboarding/complete
# (Use mock to simulate Vapi failure)

# Verify: Twilio number was released
# 1. Check logs for error message with SID
# 2. Check Twilio dashboard: number should NOT appear
# 3. Check DB: twilio_number_sid should be NULL
```

**Result:** ✅ PASS / 🔴 FAIL

---

### 6. Rate Limiting Testing
**Task:** Verify 429 rate limit on `/api/merchant/forwarding`

```bash
# Make 11 rapid requests from same user
for i in {1..11}; do
  curl -X POST "http://localhost:3000/api/merchant/forwarding" \
    -H "Authorization: Bearer $TEST_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"store_phone": "+2348012345678"}'
  echo "Request $i"
done
```

**Expected:** First 10 succeed/fail with 200/400, 11th returns 429

**Result:** ✅ PASS / 🔴 FAIL

---

## 🔄 PRE-LAUNCH CHECKS (Must Complete 24h Before Launch)

### Database Migrations
- [ ] `migration 023_call_forwarding.sql` applied to production
  ```bash
  # Verify columns exist
  SELECT column_name FROM information_schema.columns 
  WHERE table_name='merchants' AND column_name IN ('store_phone', 'forwarding_enabled');
  ```

### Environment Variables
- [ ] `NEXT_PUBLIC_BASE_URL` set correctly
- [ ] `CRON_SECRET` is non-empty and matches Vercel cron config
- [ ] `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are valid
- [ ] `TWILIO_UK_ADDRESS_SID` is populated (if UK merchants onboarding)
- [ ] `VAPI_PRIVATE_KEY` is set
- [ ] `UPSTASH_REDIS_REST_URL` and token set (for rate limiting)

### Cron Configuration
- [ ] Vercel cron schedule is `*/5 * * * *` (not `0 0 * * *`)
- [ ] Test cron: Manually trigger `/api/cron/dial-pending` with valid secret
  ```bash
  curl -H "Authorization: Bearer $CRON_SECRET" \
    "https://your-domain.com/api/cron/dial-pending"
  ```

### API Endpoints
- [ ] `POST /api/merchant/forwarding` returns 200 on valid request
- [ ] `POST /api/merchant/forwarding` returns 400 on invalid E.164
- [ ] `POST /api/merchant/forwarding` returns 401 without auth
- [ ] `POST /api/merchant/forwarding` returns 429 after 10 requests/minute
- [ ] `/api/caller-id/start` initiates Twilio call
- [ ] `/api/caller-id/verify` confirms code correctly

### Monitoring & Logging
- [ ] Sentry is configured for error tracking
- [ ] Logs are being shipped to centralized logging (CloudWatch, DataDog, etc.)
- [ ] Check that console.error logs are visible:
  ```bash
  # Look for critical logs
  grep "\[CRITICAL\]" /var/log/app.log
  grep "\[cron/dial-pending\]" /var/log/app.log
  ```

### Load Testing
- [ ] Test with 5 merchants simultaneously starting onboarding
  ```bash
  # Simulate: 5 concurrent provisioning requests
  parallel -j 5 "curl -X POST .../api/onboarding/complete ..." ::: {1..5}
  ```
- [ ] Verify no duplicate calls to Twilio or Vapi
- [ ] Verify database remains consistent

---

## ✅ CLIENT-SPECIFIC CHECKS

### Client 1: [NAME]
**Country:** [COUNTRY] | **Carriers:** [LIST] | **Phone:** [NUMBER]

- [ ] Phone number validates with E.164 regex
- [ ] USSD code verified for their carrier
- [ ] Test provisioning flow end-to-end
- [ ] Test call forwarding with real USSD code
- [ ] Test caller ID verification
- [ ] Test abandoned cart call with real Vapi agent

### Client 2: [NAME]
**Country:** [COUNTRY] | **Carriers:** [LIST] | **Phone:** [NUMBER]

- [ ] Phone number validates with E.164 regex
- [ ] USSD code verified for their carrier
- [ ] Test provisioning flow end-to-end
- [ ] Test call forwarding with real USSD code
- [ ] Test caller ID verification
- [ ] Test abandoned cart call with real Vapi agent

### Client 3: [NAME]
**Country:** [COUNTRY] | **Carriers:** [LIST] | **Phone:** [NUMBER]

- [ ] Phone number validates with E.164 regex
- [ ] USSD code verified for their carrier
- [ ] Test provisioning flow end-to-end
- [ ] Test call forwarding with real USSD code
- [ ] Test caller ID verification
- [ ] Test abandoned cart call with real Vapi agent

### Client 4: [NAME]
**Country:** [COUNTRY] | **Carriers:** [LIST] | **Phone:** [NUMBER]

- [ ] Phone number validates with E.164 regex
- [ ] USSD code verified for their carrier
- [ ] Test provisioning flow end-to-end
- [ ] Test call forwarding with real USSD code
- [ ] Test caller ID verification
- [ ] Test abandoned cart call with real Vapi agent

### Client 5: [NAME]
**Country:** [COUNTRY] | **Carriers:** [LIST] | **Phone:** [NUMBER]

- [ ] Phone number validates with E.164 regex
- [ ] USSD code verified for their carrier
- [ ] Test provisioning flow end-to-end
- [ ] Test call forwarding with real USSD code
- [ ] Test caller ID verification
- [ ] Test abandoned cart call with real Vapi agent

---

## 🚨 INCIDENT RESPONSE

### If USSD Code Fails for a Client
1. Immediately pause further calls to that merchant
2. Check logs for exact USSD response
3. Contact carrier support to verify code
4. Update `lib/carriers.ts` with corrected code
5. Test with another phone
6. Notify client with corrected instructions

### If Twilio Number is Orphaned
1. Check Twilio dashboard for unused numbers
2. Query DB: `SELECT twilio_number_sid, provisioning_status FROM merchants WHERE provisioning_status = 'failed' AND twilio_number_sid IS NOT NULL;`
3. For each orphaned number, manually release via Twilio API
4. Create support ticket to audit all orphaned numbers

### If Caller ID Verification Fails
1. Check Twilio logs for OutgoingCallerIds errors
2. Verify merchant's phone number is correctly formatted
3. Contact Twilio support if rate-limited
4. Implement retry logic with exponential backoff

---

## 📋 FINAL SIGN-OFF

**Project Lead:** [NAME]
- [ ] All critical blockers resolved
- [ ] All clients tested end-to-end
- [ ] Monitoring in place
- [ ] Incident response plan ready
- [ ] **Signature:** _________________ **Date:** _________

**Engineering Lead:** [NAME]
- [ ] All code reviewed
- [ ] All tests passing
- [ ] No unmerged critical fixes
- [ ] Logging/monitoring configured
- [ ] **Signature:** _________________ **Date:** _________

**Approval:** Launch cleared for production ✅ / ❌ Not ready

---

## 📞 SUPPORT CONTACTS

**During Launch (24/7):**
- Twilio Issues: [CONTACT]
- Vapi Issues: [CONTACT]
- Database Issues: [CONTACT]
- Customer Issues: [CONTACT]

**Escalation:** Page on-call engineer if any critical incident

---

**Last Reviewed:** 2026-04-05
**Next Review:** Daily during first week of launch
