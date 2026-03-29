# The 3-Step Coding Principle — Speed, Stability, Reliability

This document defines the engineering standard for the entire Barpel dashboard. Every code change must pass these three gates before merging.

---

## 🚀 STEP 1: SPEED (User Experience)

> Pages load fast. Operations complete without delay. Users never wait unnecessarily.

### Checklist Before Commit

- [ ] **Navigation latency** — Dashboard pages load in <2 seconds (first paint)
  - Use `npm run dev` and measure time from click to visible content
  - If page takes >3 seconds, investigate: lazy loading, data fetching, bundle size

- [ ] **API response times** — All endpoints respond in <500ms
  - Profile endpoint: `GET /api/merchant/profile` → aim for <200ms
  - Update endpoints: `PATCH /api/merchant/update` → aim for <300ms
  - Data export: `GET /api/account/export` → can take longer (generating ZIP), but show progress

- [ ] **No blocking operations on main thread**
  - Heavy computations → use Web Workers
  - File processing → async/await, not synchronous
  - Large data structures → paginate or virtualize

- [ ] **Bundle size is optimized**
  - Code splitting: each route under 150KB (gzipped)
  - Unused imports removed
  - Third-party libraries evaluated for bundle impact

- [ ] **Rendering is efficient**
  - React components memoized where expensive (avoid re-renders)
  - Images are lazy-loaded
  - Lists use virtual scrolling (if >100 items)

- [ ] **Caching is implemented**
  - Client-side: merchant profile cached in `useMerchant` hook, revalidated on change
  - Server-side: `/api/merchant/profile` response cached for 30 seconds (Redis)
  - Browser cache: static assets (JS, CSS) cached for 1 year with content-hash naming

### Example: Good Speed

```typescript
// ✅ Fast — data loaded in parallel, cached, and streamed to UI
export async function GET(req: Request) {
  // Cache hit: return immediately
  const cached = await cache.get(`merchant:${userId}`);
  if (cached) return NextResponse.json(cached);

  // Parallel requests
  const [merchant, transactions] = await Promise.all([
    supabase.from('merchants').select('*').eq('user_id', userId).single(),
    supabase.from('billing_transactions').select('*').eq('merchant_id', merchantId).limit(10),
  ]);

  const result = { merchant, transactions };
  await cache.set(`merchant:${userId}`, result, 30); // 30-second TTL
  return NextResponse.json(result);
}
```

### Example: Bad Speed

```typescript
// ❌ Slow — sequential requests, no caching, blocks UI
export async function GET(req: Request) {
  // Request 1 (blocks Request 2)
  const merchant = await supabase.from('merchants').select('*').eq('user_id', userId).single();

  // Request 2 (only after Request 1 completes)
  const transactions = await supabase.from('billing_transactions').select('*').eq('merchant_id', merchant.id);

  // No caching — same request twice = two slow responses
  return NextResponse.json({ merchant, transactions });
}
```

---

## 🛡️ STEP 2: STABILITY (Error Handling & Recovery)

> Features don't break under edge cases. Errors are handled gracefully. Users always have a way forward.

### Checklist Before Commit

- [ ] **Error boundaries prevent cascading failures**
  - Every page wrapped in error boundary
  - Page-level errors → show fallback UI + "Reload" button
  - Don't let one component crash the entire dashboard

- [ ] **API failures are handled**
  - Timeout: requests timeout after 30 seconds (not Infinity)
  - Retry logic: transient errors (5xx, network) retry 3 times with exponential backoff
  - User feedback: toast/notification on every error (not silent failures)

- [ ] **Form validation prevents bad submissions**
  - Frontend: HTML5 validation + custom checks (email format, required fields)
  - Backend: Zod/schema validation; reject invalid input with 400 status
  - User feedback: inline error messages (not generic "error occurred")

- [ ] **Modal/Dialog close always works**
  - Cancel button always closeable (even during loading)
  - Escape key closes dialog
  - Clicking outside dialog closes it (unless action in progress)

- [ ] **Loading states are shown**
  - Buttons show "Loading..." or spinner while async work happens
  - Disabled during async (prevent double-submit)
  - If takes >2 seconds, show skeleton/placeholder

- [ ] **Network issues are visible**
  - Offline: show banner "You're offline. Some features may not work."
  - Slow connection: show "Slower than usual..." if request takes >3 seconds
  - Failed request: show "Try again" button with retry logic

### Example: Good Stability

```typescript
// ✅ Stable — errors caught, user informed, can retry
const handleSaveProfile = async () => {
  if (!name.trim() || name.length > 60) {
    toast.error("Name must be 2–60 characters");
    return;
  }

  setSaving(true);
  try {
    const res = await fetch('/api/merchant/update', {
      method: 'PATCH',
      body: JSON.stringify({ business_name: name }),
      signal: AbortSignal.timeout(30000), // 30-second timeout
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? 'Update failed');
    }

    toast.success('Saved!');
  } catch (err) {
    // User always sees what went wrong
    toast.error(err instanceof Error ? err.message : 'Update failed. Try again.');
  } finally {
    setSaving(false);
  }
};
```

### Example: Bad Stability

```typescript
// ❌ Unstable — errors hidden, no feedback, no recovery
const handleSaveProfile = async () => {
  const res = await fetch('/api/merchant/update', {
    method: 'PATCH',
    body: JSON.stringify({ business_name: name }),
  });

  const data = await res.json();
  setProfile(data); // If request failed, data is error object — silently breaks app
};
```

---

## 🔐 STEP 3: RELIABILITY (Testing & Verification)

> Code is tested before ship. Features work in production like they work locally. Bugs are caught before users see them.

### Checklist Before Commit

- [ ] **Manual testing completed**
  - Happy path: feature works as intended
  - Sad path: error cases handled (invalid input, network failure, timeout)
  - Edge cases: empty state, pagination boundaries, character limits

- [ ] **Contract tests pass** — `npm run test:contracts`
  - API routes return correct status codes (200, 400, 401, 404, 500)
  - Response schemas match expected types (no null where object expected)
  - Database queries work (don't query non-existent columns)

- [ ] **Build succeeds** — `npx next build`
  - No TypeScript errors (strict mode enabled)
  - No console errors/warnings during build
  - All routes prerender without throwing

- [ ] **No regressions in related features**
  - Changed settings? Run settings page tests
  - Changed API? Run all endpoints that use it
  - Changed hook? Run all components that use it

- [ ] **Performance baseline met**
  - Largest page bundle <500KB (gzipped)
  - Lighthouse score ≥80 (on desktop)
  - No memory leaks (check DevTools heap snapshots)

- [ ] **Database state is correct**
  - After operation, verify DB has expected data
  - Example: after delete account → merchants row deleted, auth user deleted, integrations deleted
  - Run query: `SELECT COUNT(*) FROM merchants WHERE deleted_at IS NULL` — expect accurate count

### Test Scenarios by Feature

#### Settings — Email Display
- [ ] Page loads → email visible (not "—")
- [ ] Valid email format shown
- [ ] Email matches Supabase auth user email
- Verify DB: User has auth.user.email set

#### Settings — Change Password
- [ ] Button click → shows "Opening..."
- [ ] Request sent to `supabase.auth.resetPasswordForEmail()`
- [ ] Toast appears: "Password reset email sent"
- [ ] Can complete password reset flow via email link
- Verify logs: no 401 errors

#### Settings — Notification Toggles
- [ ] Toggle on/off → immediately responds (optimistic update)
- [ ] Toggle value persists after page reload
- [ ] Invalid request → toggle reverts + error toast
- Verify DB: `merchants.notification_preferences` JSONB updated correctly

#### Settings — Download Data
- [ ] Click Download → ZIP starts downloading
- [ ] ZIP contains: `account.json`, `calls.csv`, `billing.csv`
- [ ] Data in ZIP is user's actual data (not someone else's)
- [ ] Emails in ZIP match auth user email (not merchants.email, which doesn't exist)

#### Billing — Package Buttons (Dodo Payments — non-Shopify merchants only)
- [ ] Click "Subscribe" → redirected to Dodo-hosted checkout page
- [ ] Checkout shows correct package price ($29, $79, $179)
- [ ] Can abandon checkout → returns to billing page, no error
- [ ] Can complete payment → redirected to success page, credit balance updates via webhook
- [ ] Shopify merchants see "Managed by Shopify" panel instead of plan cards

#### Billing — Credit Usage Chart
- [ ] Chart renders without errors
- [ ] Chart shows last 30 days of usage
- [ ] Y-axis scale matches actual usage (0–4+ credits per day)
- [ ] Chart loads within 3 seconds

### Test Execution

**Before merging any code:**

```bash
# 1. Manual test (5 min)
npm run dev
# → Open http://localhost:3000
# → Click through features
# → Trigger errors (invalid input, offline)

# 2. Build test (2 min)
npx next build
# → Should complete without errors
# → Check: "✓ Compiled successfully", "✓ Generating static pages"

# 3. Contract tests (3 min)
npm run test:contracts
# → All endpoints should respond correctly
# → No 500 errors (unless intentional)

# 4. Database verification (2 min)
# Use Supabase dashboard or CLI
# SELECT * FROM merchants WHERE id = '{test_user_id}';
# Verify all fields present + accurate
```

---

## 🚦 The Three-Gate System

Every commit must pass all three gates:

```
SPEED (Test Locally)
    ↓
STABILITY (Manual Testing + Error Paths)
    ↓
RELIABILITY (Build + Contracts + DB Check)
    ↓
✅ READY TO MERGE
```

If any gate fails → fix the issue before committing.

---

## Examples by Feature

### ✅ Settings Email — Passed All Gates

| Gate | Status | Evidence |
|------|--------|----------|
| Speed | ✅ | Email loads in <200ms (from `useMerchant` hook, no extra API call) |
| Stability | ✅ | Falls back to `"—"` if email unavailable; toast shows error if load fails |
| Reliability | ✅ | Contract test verifies `/api/merchant/profile` returns email; manual test confirms display |

### ❌ Delete Account — Failed Gate 2 (Stability)

| Gate | Status | Evidence |
|------|--------|----------|
| Speed | ✅ | Modal opens instantly |
| Stability | ❌ | **BUG:** Delete API queried `merchants.email` column (doesn't exist) → returned 404 → account not deleted — _Fixed by removing email from query_ |
| Reliability | ⏳ | Pending test after fix |

---

## Dashboard Components Checklist

Use this matrix to ensure all dashboard sections meet the standard:

| Component | Speed | Stability | Reliability | Status |
|-----------|-------|-----------|-------------|--------|
| Dashboard home | ✅ | ✅ | ✅ | Ready |
| Call Logs | ✅ | ✅ | ✅ | Ready |
| Integrations | ✅ | ✅ | ✅ | Ready |
| AI Voice | ✅ | ✅ | ✅ | Ready |
| Billing | ✅ | ✅ | ✅ | Ready |
| Settings | ✅ | ✅ | ✅ | Ready |
| **Overall** | **✅** | **✅** | **✅** | **Ship** |

---

## When to Ask for Help

If any gate is unclear or you can't pass it:

1. **Speed issue:** Profile the component with DevTools → check for slow queries, bundle bloat, re-renders
2. **Stability issue:** Trace the error path → add error handling + user feedback
3. **Reliability issue:** Run the test locally → fix failing assertions → re-run

All three gates are non-negotiable. Speed alone isn't enough (might be fast but crash). Stability alone isn't enough (might never fail but be slow). Reliability alone isn't enough (might be tested but unusable).

---

**Last updated:** 2026-03-18
**Next review:** When new major feature ships
