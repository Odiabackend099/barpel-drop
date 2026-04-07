import { NextRequest } from 'next/server'
import { sendChatWidgetLeadEmail } from '@/lib/email/client'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    'unknown'

  // BE-002: Distributed rate limit via Upstash Redis — 1 lead capture per IP per hour.
  // Fail-open if Redis is unavailable so chat UX is never broken.
  try {
    const limited = await rateLimit(`rl:chat:lead:${ip}`, 1, 3600)
    if (limited) return Response.json({ ok: true }) // Silently succeed — never interrupt chat UX
  } catch {
    // Redis unavailable — fail open
  }

  let body: { name?: string; email?: string; phone?: string; platform?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name, email, phone, platform } = body

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return Response.json({ error: 'Invalid email' }, { status: 400 })
  }

  // Fire-and-forget — never block chat UX on email delivery
  if (process.env.RESEND_API_KEY) {
    sendChatWidgetLeadEmail({
      name: name?.slice(0, 100),
      email: email.slice(0, 200),
      phone: phone?.slice(0, 30),
      platform: platform?.slice(0, 50),
    }).catch((err) => console.error('[chat/lead] Resend error:', err))
  }

  return Response.json({ ok: true })
}
