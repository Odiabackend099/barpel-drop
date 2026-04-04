import { NextRequest } from 'next/server'
import { sendChatWidgetLeadEmail } from '@/lib/email/client'

// Rate limit: 1 lead capture per IP per hour
const rateLimitMap = new Map<string, number>()

function checkLeadRateLimit(ip: string): boolean {
  const now = Date.now()
  const lastCapture = rateLimitMap.get(ip)

  // Prune entries older than 1 hour
  Array.from(rateLimitMap.keys()).forEach((key) => {
    const ts = rateLimitMap.get(key)!
    if (now - ts > 60 * 60 * 1000) rateLimitMap.delete(key)
  })

  if (lastCapture && now - lastCapture < 60 * 60 * 1000) return false
  rateLimitMap.set(ip, now)
  return true
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    'unknown'

  if (!checkLeadRateLimit(ip)) {
    return Response.json({ ok: true }) // Silently succeed — never interrupt chat UX
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
