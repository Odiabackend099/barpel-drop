# Barpel Dashboard — 3-Step Coding Principle Test Checklist

**Test Account:** testsprite@barpel-test.com / TestSprite2026!
**Production URL:** https://dropship.barpel.ai
**Test Date:** 2026-03-18

---

## 🚀 GATE 1: SPEED (User Experience)

### Page Load Times
- [ ] **Login page** loads in <2 seconds
- [ ] **Dashboard home** loads in <2 seconds
- [ ] **Call Logs page** loads in <2 seconds
- [ ] **Voice page** loads in <2 seconds
- [ ] **Integrations page** loads in <2 seconds
- [ ] **Billing page** loads in <2 seconds
- [ ] **Settings page** loads in <2 seconds

### API Response Times
- [ ] Login API responds in <500ms
- [ ] Fetch merchant profile in <200ms
- [ ] Load call logs in <500ms
- [ ] Load billing data in <500ms
- [ ] Update settings in <300ms

### Rendering & Bundle Size
- [ ] No layout shift/flicker on page load
- [ ] Animations are smooth (60fps)
- [ ] Images are lazy-loaded (not blocking initial load)
- [ ] No console warnings during initial load

### Caching
- [ ] Dashboard data cached from previous load (if reload within 30s)
- [ ] Static assets (JS, CSS) use browser cache headers
- [ ] No unnecessary API calls on page navigation

---

## 🛡️ GATE 2: STABILITY (Error Handling & Recovery)

### Login Flow
- [ ] Invalid email shows inline error
- [ ] Invalid password shows inline error
- [ ] Network timeout shows "Try again" button
- [ ] Submission disabled during loading (no double-submit)
- [ ] Success redirects to dashboard

### Dashboard
- [ ] Page loads even if merchant data fails
- [ ] Shows "Loading..." or skeleton state
- [ ] Error boundary catches component crashes
- [ ] If error, shows reload button
- [ ] Network error shows retry option

### Call Logs
- [ ] Empty state shows helpful message (not blank)
- [ ] Pagination works (prev/next buttons)
- [ ] Sorting works without errors
- [ ] If API fails, shows error with retry
- [ ] Handles 0 results gracefully

### Billing
- [ ] Package buttons clickable
- [ ] Loading state shown during payment
- [ ] Cancel button works (closes modal)
- [ ] Network failure shows error + retry
- [ ] Success confirmation visible

### Settings
- [ ] Form validation on all fields
- [ ] Save button disabled during request
- [ ] Success toast shows after save
- [ ] Error toast shows if save fails
- [ ] Escape key closes dialogs
- [ ] Cancel button works during loading

### Voice
- [ ] Recording toggle shows loading state
- [ ] Stop button always works
- [ ] If connection drops, shows error
- [ ] Playback works after upload
- [ ] Delete works with confirmation

### Integrations
- [ ] Connect button shows loading spinner
- [ ] Disconnect shows confirmation
- [ ] Error on failed connection is clear
- [ ] Status shows as connected/disconnected
- [ ] Handles auth failures gracefully

### General Stability
- [ ] No console errors (check DevTools)
- [ ] No console warnings
- [ ] Form submissions don't lose data if error
- [ ] Modal close always works (Escape, X, Cancel)
- [ ] Back button works in browser history

---

## 🔐 GATE 3: RELIABILITY (Testing & Verification)

### Manual Testing — Happy Path
- [ ] **Login:** testsprite@barpel-test.com → Dashboard
- [ ] **Dashboard:** View merchant info, stats, recent calls
- [ ] **Call Logs:** Scroll, sort, filter (if available)
- [ ] **Voice:** Record test message → plays back
- [ ] **Integrations:** View status (connected/not)
- [ ] **Billing:** View balance, see packages
- [ ] **Settings:** Edit email/name → save → reload → persists

### Manual Testing — Error Paths
- [ ] **Offline mode:** Disconnect internet → error message shown
- [ ] **Slow network:** Throttle to 3G → page still loads (with spinner)
- [ ] **Invalid input:** Try submitting empty fields → validation error
- [ ] **Timeout:** API doesn't respond → timeout error after 30s
- [ ] **Logout:** Click logout → redirects to login
- [ ] **Session expiry:** Wait 30+ min → request fails gracefully

### Database Verification
After testing, verify in Supabase:
```sql
-- Check merchant record exists
SELECT id, business_name, email FROM merchants
WHERE email = 'testsprite@barpel-test.com';

-- Check recent call logs
SELECT id, duration, created_at FROM calls
WHERE merchant_id = '{merchant_id}'
ORDER BY created_at DESC
LIMIT 5;

-- Check settings updates persisted
SELECT * FROM merchant_settings
WHERE merchant_id = '{merchant_id}';
```

### Build Verification
- [ ] `npx next build` completes without errors
- [ ] No TypeScript errors
- [ ] No console warnings during build
- [ ] All routes prerender successfully

### Performance Baseline
- [ ] Lighthouse score ≥80 on desktop
- [ ] Largest bundle <500KB (gzipped)
- [ ] No memory leaks (heap snapshots)
- [ ] Time to Interactive (TTI) <3 seconds

### Browser Compatibility
- [ ] Chrome (latest) — works
- [ ] Safari (latest) — works
- [ ] Firefox (latest) — works
- [ ] Mobile Safari (iOS) — works
- [ ] Chrome Mobile (Android) — works

---

## ✅ Test Results Template

| Gate | Component | Status | Notes | Evidence |
|------|-----------|--------|-------|----------|
| Speed | Dashboard | ✅/❌ | [What was observed] | [Screenshot/time] |
| Stability | Login | ✅/❌ | [What was observed] | [Error message if any] |
| Reliability | Call Logs | ✅/❌ | [What was tested] | [DB query result] |

---

## 🐛 Known Issues & Workarounds

### Issue: Page loads slowly
- **Cause:** Large images, unoptimized bundle
- **Workaround:** Check DevTools Network tab, identify bottleneck
- **Status:** Fix in progress

### Issue: Modal doesn't close
- **Cause:** Button handler not properly bound
- **Workaround:** Press Escape key instead
- **Status:** Bug #123 filed

### Issue: Settings don't save
- **Cause:** API returns 401 (session expired)
- **Workaround:** Log out and log back in
- **Status:** Token refresh in progress

---

## 📋 Sign-Off

**Tester:** ________________
**Date:** ________________
**Result:** ✅ PASS / ❌ FAIL

**Blockers (if any):**
```
[List any critical failures that prevent shipping]
```

**Recommendations:**
```
[List improvements, optimizations, or fixes needed]
```

---

**Test Standard:** Barpel 3-Step Coding Principle v1.0
**Last Updated:** 2026-03-18
