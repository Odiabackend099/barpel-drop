# Planning: Dashboard Improvements — Money Saved, Audio Player, Sentiment

**Date:** April 9, 2026
**Features:** Money Saved transparency, In-app audio player, Sentiment verification
**Principle:** 3-step — Plan → planning.md → Execute phase by phase

---

## Step 1 — Problem Breakdown

### Feature A: Money Saved Metric Transparency

**What problem it solves:** "$173.40 Money Saved" on a demo store with <$2 catalog items confuses the merchant. The metric is correct (labor savings, not product value) but the tooltip doesn't explain this clearly.

**Inputs:** `total_calls` (from `get_dashboard_stats` RPC), `LABOR_COST_PER_CALL = 3.40` (constant)
**Outputs:** Click-to-open popover showing calculation breakdown + industry context
**Constraints:** No API/DB changes. Popover component exists at `components/ui/popover.tsx`.
**Dependencies:** `@/components/ui/popover` (exists)
**Assumptions:** $3.40/call is the correct industry benchmark (Zendesk/Gartner: $2.50-$5.50)

### Feature B: In-App Call Recording Player

**What problem it solves:** Clicking Play opens a new browser tab to `storage.vapi.ai`. Merchants expect an in-app player with controls.

**Inputs:** `recording_url` from `call_logs` table (Vapi webhook, expires 30 days)
**Outputs:** Modal with HTML5 audio player, call metadata, play/pause, seek, download
**Constraints:** Must handle expired URLs gracefully. Same component used in both `/dashboard` and `/dashboard/calls`.
**Dependencies:** `@/components/ui/dialog` (exists), HTML5 `<audio>` (native), `lucide-react` icons

### Feature C: Sentiment Verification (NO CODE CHANGE)

**Finding:** Sentiment comes from Vapi's LLM-based analysis (`analysis.sentiment`). Fallback keyword matcher at `webhook/route.ts:766-787` only fires if Vapi omits analysis (rare). All 51 calls used Vapi's LLM analysis. Accurate and reliable.

**Action:** Explain to Austin. No code change needed.

---

## Senior Engineer Review — Findings

### Logical Mistakes / Dual Source of Truth
1. **`LABOR_COST_PER_CALL = 3.40`** in `dashboard/page.tsx:3` and **`MONEY_SAVED_PER_CALL = 3.40`** in `stats/route.ts:5` — two constants for the same value. The API returns `money_saved` (line 52) but the frontend ignores it and recomputes at line 129. If either constant changes, they silently diverge. **Fix in Phase 1:** Use `money_saved` from the API response, remove the frontend constant entirely.

### Unaccounted Edge Cases
2. **`stats/route.ts:36`** — `to + "T23:59:59.999Z"` string concat. If `to` already has a time component, produces invalid ISO date. **Fix in Phase 1:** Add time suffix only if `to` doesn't already contain "T".
3. **Recording URL expiry** — Play button renders for calls with `recording_url`, but URL may have expired (30-day cleanup). **Fix in Phase 2:** AudioPlayerModal handles `<audio>` error event gracefully.

### Naming / Styling Issues
4. **`dashboard/page.tsx:3`** — Constant declared before imports. Violates standard JS convention. **Fix in Phase 1:** Move after imports.
5. **Duplicate `CALL_TYPE_LABELS`** — Locally defined at `dashboard/page.tsx:73-78` AND exported from `lib/constants.ts`. **Fix in Phase 1:** Import from constants, remove local copy.
6. **Duplicate `Badge` component** — In both `CallLogTable.tsx:8` and `dashboard/page.tsx:49`. Not fixing this sprint (shared Badge refactor is out of scope).

### Performance
7. **`emojiIcons` object** at `CallLogTable.tsx:46` — Allocated inside `.map()` on every row render. **Fix in Phase 3:** Hoist to module level.

### Security / Ambiguity
8. **`recording_url` unsafe casts** — `(call as CallLog & { recording_url?: string })` repeated 4 times in `CallLogTable.tsx`. **Fix in Phase 3:** Extract once at top of map callback.
9. **Magic number `6000`** at `dashboard/page.tsx:173` — `6000` = 100 min × 60s. **Fix in Phase 1:** Add named constant `MAX_CREDITS_SECONDS`.

### Debugging Code
10. No debugging code found — clean.

---

## Step 2 — Implementation Phases

### Phase 1: Money Saved Popover + Dashboard Code Quality

**Technical Requirements (Feature):**
- Replace `Tooltip` imports with `Popover` imports in `dashboard/page.tsx`
- Remove: `UITooltip, TooltipContent, TooltipProvider, TooltipTrigger` (lines 16-20)
- Add: `Popover, PopoverContent, PopoverTrigger` from `@/components/ui/popover`
- Replace hover tooltip (lines 180-192) with click-to-open Popover showing:
  - Title: "How we calculate this"
  - Explanation: each AI call replaces a human agent at $3.40/call (industry benchmark)
  - Breakdown box: `{total_calls} calls × $3.40 = ${moneySaved}` in a mint-green styled div
  - Footer note: "This measures labor savings, not product value"

**Technical Requirements (Senior Engineer Fixes):**
- Move `LABOR_COST_PER_CALL` after imports (fix #4: constant before imports)
- Use `money_saved` from API response instead of recomputing on frontend (fix #1: single source of truth). Keep frontend constant only for the popover's "per call" display text.
- Replace local `CALL_TYPE_LABELS` (lines 73-78) with import from `lib/constants.ts` (fix #5)
- Add `const MAX_CREDITS_SECONDS = 6000;` to replace magic number at line 173 (fix #9)
- Fix date handling in `stats/route.ts:36`: guard time suffix (fix #2)

**Files to modify:**
- `app/(dashboard)/dashboard/page.tsx` (~35 lines changed)
- `app/api/dashboard/stats/route.ts` (1 line: date guard)

**Testing Criteria:**
- [ ] Click info icon → popover opens
- [ ] Breakdown shows correct numbers (51 × $3.40 = $173.40)
- [ ] Click outside → popover closes
- [ ] No unused import warnings (Tooltip removed, CALL_TYPE_LABELS imported)
- [ ] `money_saved` comes from API, not recomputed
- [ ] `npx tsc --noEmit` passes

---

### Phase 2: Audio Player Modal Component

**Technical Requirements:**
- New file: `components/dashboard/AudioPlayerModal.tsx`
- Shadcn `Dialog` component (same pattern as existing `TestCallModal.tsx`)
- HTML5 `<audio>` with `preload="metadata"`
- Custom controls: play/pause (teal circle), range input seek bar, time display (mm:ss / mm:ss)
- Call metadata grid: caller, direction, type, duration
- Error state for expired recordings
- Download button (blob-fetch → save-as-wav, CORS fallback)
- Brand: #00A99D (teal play button), #F0F9F8 (bg), #D0EDE8 (borders), #1B2A4A (text)

**Files to create:**
- `components/dashboard/AudioPlayerModal.tsx` (~130 lines)

**Testing Criteria:**
- [ ] Component renders without errors
- [ ] `npx tsc --noEmit` passes
- [ ] Audio plays when play clicked
- [ ] Seek bar tracks current time
- [ ] Time display shows current / total
- [ ] Download button saves .wav file
- [ ] Error state renders for broken URLs
- [ ] Modal close stops audio, resets state

---

### Phase 3: Wire Play Button to Modal + CallLogTable Cleanup

**Technical Requirements (Feature):**
- Add `audioCall` state to `CallLogTable` component
- Import `AudioPlayerModal`
- Replace `<a target="_blank" href={recording_url}>` (lines 98-106) with `<button onClick={setAudioCall}>`
- Render `<AudioPlayerModal>` at end of component return
- Keep existing Download button unchanged (lines 107-128)

**Technical Requirements (Senior Engineer Fixes):**
- Hoist `emojiIcons` to module level (fix #7: allocated per row in map)
- Extract `recording_url` cast once at top of map: `const recordingUrl = (call as any).recording_url as string | undefined;` (fix #8: 4 repeated casts)
- Remove the inline Download button from CallLogTable (it's now in the AudioPlayerModal). Simplifies the table actions column.

**Files to modify:**
- `components/dashboard/CallLogTable.tsx` (~25 lines changed)

**Testing Criteria:**
- [ ] Click Play → modal opens (not new tab)
- [ ] Audio plays inside modal
- [ ] Close modal → audio stops
- [ ] Download in modal works
- [ ] Eye button (transcript) still works independently
- [ ] Works on `/dashboard` (Recent Calls)
- [ ] Works on `/dashboard/calls` (full call log)
- [ ] No repeated type casts
- [ ] `npx tsc --noEmit && npm run lint` passes

---

## Step 3 — Execution Order

1. **Phase 1** → implement Money Saved popover → test → validate done
2. **Phase 2** → implement AudioPlayerModal → test → validate done
3. **Phase 3** → wire Play button to modal → test → validate done
4. **Final gate** → `npx tsc --noEmit && npm run lint` → deploy

---

## Critical Files Reference

| File | Action | Phase |
|------|--------|-------|
| `app/(dashboard)/dashboard/page.tsx` | Modify (Tooltip → Popover) | 1 |
| `components/dashboard/AudioPlayerModal.tsx` | Create (new file) | 2 |
| `components/dashboard/CallLogTable.tsx` | Modify (Play → modal trigger) | 3 |
| `components/ui/popover.tsx` | Exists, no changes | — |
| `components/ui/dialog.tsx` | Exists, no changes | — |
| `lib/constants.ts` | Read-only (CALL_TYPE_LABELS, SENTIMENT_CONFIG) | — |
| `lib/mockApi.ts` | Read-only (CallLog type) | — |
