# Voice Preview MP3 Generation — planning.md

**Date:** 2026-03-13
**Feature:** Generate actual voice preview MP3 files for all 10 Vapi native voices

---

## Problem

Vapi has **no direct TTS synthesis endpoint** (confirmed via API testing — `/speech`, `/v1/speech`, `/tts` all return 404). This means we cannot call the Vapi API to generate audio from text.

`@vapi-ai/web` v2.5.2 is already installed but requires microphone access for WebRTC — bad UX just to hear a voice sample.

---

## Solution

**Use `@vapi-ai/web` SDK (already installed v2.5.2) with `{ audioSource: false }` for listen-only preview.**

- `audioSource: false` in the Daily.co constructor = no microphone source = no browser permission prompt
- Starts a real Vapi web call that plays the ACTUAL Vapi voice through the browser speakers
- `assistantConfig` passed inline: voice provider=vapi, voiceId=selected voice, firstMessage="Hi! I'm your AI support assistant..."
- Auto-ends after `speech-end` event fires (AI finishes saying greeting)
- Cost: ~$0.01 per preview (small Vapi credits), but it's the REAL voice

This replaced a bad earlier approach of using Microsoft Edge TTS (a completely different voice provider) to generate approximation MP3s — which was useless because merchants would hear a fake voice and get Clara on actual calls.

---

## Voice Mapping

| Vapi Voice | Vapi Profile | Edge TTS Voice |
|------------|-------------|----------------|
| Clara | American female, 30s, warm | `en-US-AvaNeural` (Expressive, Caring, Pleasant) |
| Emma | Asian American female, 20s, conversational | `en-US-EmmaNeural` (Cheerful, Clear, Conversational) |
| Savannah | Southern American female, 20s | `en-US-JennyNeural` (Friendly, Considerate, Comfort) |
| Elliot | Canadian male, 20s, friendly, soothing | `en-CA-LiamNeural` (Friendly, Positive) |
| Kai | American male, 30s, relaxed | `en-US-BrianNeural` (Approachable, Casual, Sincere) |
| Rohan | Indian American male, 20s, energetic | `en-IN-PrabhatNeural` (Indian English male) |
| Nico | American male, 20s, casual, natural | `en-US-RogerNeural` (Lively) |
| Sagar | Indian American male, 20s, steady | `en-IN-PrabhatNeural` (Indian English male) |
| Godfrey | American male, 20s, energetic | `en-US-GuyNeural` (Passion) |
| Neil | Indian American male, 20s, clear, professional | `en-US-ChristopherNeural` (Reliable, Authority) |

---

## Sample Text

Each voice says a natural greeting that demonstrates their character:
> "Hi! I'm here to help with your orders and questions. What can I do for you today?"

---

## Implementation Phases

### Phase 1 — Generate MP3 files via script
- Write `scripts/generate-voice-previews.py`
- Generates 10 MP3 files into `public/voices/`
- Run it once, verify audio quality, commit files

### Phase 2 — Verify voice page works with static files
- The voice page already uses `new Audio('/voices/${voiceId.toLowerCase()}.mp3')`
- Test that clicking play works
- Run `npx next build` to confirm zero errors

### Phase 3 — Push to GitHub + deploy to Vercel
- `git add` + `git commit` all changes
- `git push origin main`
- `vercel deploy --prod`

---

## Testing Criteria

- [ ] All 10 MP3 files exist in `public/voices/`
- [ ] Files are non-zero size (audio data present)
- [ ] `npx next build` passes with 0 errors
- [ ] Voice page loads and play buttons work
- [ ] GitHub push succeeds
- [ ] Vercel build + deploy succeeds
- [ ] Production URL returns 200 for `/voices/clara.mp3`

---

## Files Changed

| File | Action |
|------|--------|
| `scripts/generate-voice-previews.py` | CREATE — one-time generation script |
| `public/voices/clara.mp3` | GENERATE |
| `public/voices/emma.mp3` | GENERATE |
| `public/voices/savannah.mp3` | GENERATE |
| `public/voices/elliot.mp3` | GENERATE |
| `public/voices/kai.mp3` | GENERATE |
| `public/voices/rohan.mp3` | GENERATE |
| `public/voices/nico.mp3` | GENERATE |
| `public/voices/sagar.mp3` | GENERATE |
| `public/voices/godfrey.mp3` | GENERATE |
| `public/voices/neil.mp3` | GENERATE |

---

## Notes

- Edge TTS voices are placeholders approximating the Vapi voice character profile
- When Vapi adds a TTS synthesis endpoint (or provides hosted samples), replace these files
- The script is committed to `scripts/` so anyone can regenerate the samples
- `.gitkeep` in `public/voices/` replaced by actual MP3 files
