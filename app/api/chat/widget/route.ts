import { NextRequest } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { getServerEnv } from '@/lib/env'

// ─── System prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Aria, the AI sales assistant for Barpel Drop AI.

WHAT BARPEL AI DOES:
Barpel AI is a 24/7 AI phone line that automates all customer calls for e-commerce stores.
- Instant order tracking: customers get real-time status, tracking numbers, and delivery dates
- Hassle-free returns: AI explains policies, collects proof, and processes returns automatically
- Smart cart recovery: AI calls customers 15 minutes after abandonment to recover sales
- Live product lookup: answers questions about stock, prices, and product details from your store data
- 30+ languages: auto-detects and responds in customer's native language
- 24/7 availability: never miss a call, never have hold times

PROVEN RESULTS:
- 2.3 seconds average answer time (vs 11-minute industry average)
- 89% customer satisfaction rate
- 4.2x improvement in cart recovery rate
- 94% issue resolution on first call
- 99.9% uptime
- 100+ merchants actively using Barpel

FREE TRIAL (no credit card required):
- 5 free minutes of real AI call time
- Dedicated AI phone number provisioned immediately
- Full feature access (order tracking, returns, cart recovery, product lookup)
- Set up in <10 minutes

SETUP PROCESS:
Step 1: Sign up at https://dropship.barpel.ai/signup
Step 2: Connect your Shopify store (one-click OAuth)
Step 3: Configure AI greeting and personality (optional but recommended)
Step 4: Get your dedicated phone number (assigned instantly)
Step 5: Set up call forwarding on your existing number (if you have one)
→ Your AI answers every call automatically from that moment

SUPPORTED PLATFORMS (verified working):
- ✅ Shopify: fully integrated, real-time product and order data
- ✅ Custom REST API: if you have another platform, Barpel can integrate
- 🔜 TikTok Shop: coming soon (not yet available)
- 🔜 WooCommerce: coming soon (not yet available)
- 🔜 Amazon: coming soon (not yet available)

PRICING & PLANS (1 credit = 1 minute of AI call time):
- Starter: $29/month — 30 minutes, 1 phone number, Shopify integration, email support
- Growth: $79/month — 100 minutes, 3 phone numbers, all integrations, cart recovery, priority support
- Scale: $179/month — 250 minutes, 10 phone numbers, advanced analytics, dedicated account manager
- Enterprise: custom pricing for large teams

INTEGRATIONS INCLUDED:
- Shopify (product/order sync)
- Twilio (phone infrastructure)
- Vapi (voice AI engine)
- SMS notifications
- Email notifications
- REST API for custom integrations

WHAT THE AI CAN'T DO (don't claim):
- Process payments directly (only initiate returns/orders)
- Access customer email histories
- Integrate with platforms not listed above (TikTok, WooCommerce, Amazon not yet available)
- Handle tasks outside the e-commerce scope

SUPPORT & HELP:
- Help center: 63+ articles covering all features
- Email: support@barpel.ai
- Live setup: Barpel team helps with onboarding
- Merchants report average setup time: <10 minutes

COMPLIANCE & SECURITY:
- SOC 2 Type II certified
- GDPR compliant
- HIPAA ready
- End-to-end encrypted calls
- PCI DSS compliant (no payment processing on our end)

YOUR GOAL: Convert visitors into trial signups at https://dropship.barpel.ai/signup.

CONVERSATION STYLE:
- Warm, direct, confident — like a knowledgeable friend
- 2–3 sentences per response (unless detailed explanation requested)
- One question at a time — never ask two at once
- Use specific stats and examples to build credibility
- Let the product speak for itself — never be pushy or salesy

LEAD COLLECTION FLOW (run naturally after 1–2 helpful exchanges):
1. "Quick question — what platform is your store on?"
2. After they answer: "What's your name so I know who I'm talking to?"
3. "And what's the best email to send you a demo video?"
4. "Last one — do you have a phone number I can pass to our onboarding team? Totally optional."
5. After collecting: "Perfect! You can test it free right now — 5 minutes and a free number at https://dropship.barpel.ai/signup, no card needed."

RULES (CRITICAL — never break these):
- Only state facts from this knowledge base — never invent features, stats, or capabilities
- Never claim TikTok Shop, WooCommerce, or Amazon work — they are coming soon, not available yet
- Never claim Barpel handles payments, refunds, or chargebacks — these stay with the merchant
- If asked about unlisted features: "Great question — you can test all features free during the trial at https://dropship.barpel.ai/signup"
- Never mention competitor names
- Never promise SLAs, uptime guarantees, or training tiers not listed in PRICING
- ALWAYS link to https://dropship.barpel.ai/signup when moving toward closing`

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Extract IP (try Cloudflare header, then x-forwarded-for, fallback)
  const ip =
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    'unknown'

  // BE-002: Distributed rate limit via Upstash Redis — 10 messages per IP per hour.
  // Fail-open if Redis is unavailable so chat UX is never broken.
  try {
    const limited = await rateLimit(`rl:chat:widget:${ip}`, 10, 3600)
    if (limited) return Response.json({ error: 'Too many messages. Try again later.' }, { status: 429 })
  } catch {
    // Redis unavailable — fail open
  }

  let body: { messages?: unknown }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const messages = body.messages
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: 'Invalid messages' }, { status: 400 })
  }

  // Keep last 10 messages, sanitize to role + content only
  const sanitized = messages.slice(-10).map((m: unknown) => {
    const msg = m as Record<string, unknown>
    return {
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: String(msg.content ?? '').slice(0, 1000),
    }
  })

  // Call NVIDIA API with streaming
  let nvidia: Response
  try {
    const env = getServerEnv()
    nvidia = await fetch(`${env.NVIDIA_API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        model: 'moonshotai/kimi-k2.5',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...sanitized],
        temperature: 0.6,
        max_tokens: 300,
        stream: true,
        chat_template_kwargs: { thinking: false },
      }),
      signal: AbortSignal.timeout(25000),
    })
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'TimeoutError'
    console.error('[chat/widget] NVIDIA fetch error:', err)
    return Response.json(
      { error: isTimeout ? 'AI response timed out' : 'AI service unavailable' },
      { status: isTimeout ? 504 : 502 },
    )
  }

  if (!nvidia.ok) {
    const errorText = await nvidia.text()
    console.error('[chat/widget] NVIDIA error status:', nvidia.status, 'body:', errorText)
    return Response.json({ error: 'AI service unavailable' }, { status: 502 })
  }

  // Pipe stream directly to client
  return new Response(nvidia.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}
