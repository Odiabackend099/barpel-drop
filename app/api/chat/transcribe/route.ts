import { NextRequest } from 'next/server'
import { DeepgramClient } from '@deepgram/sdk'

const MAX_AUDIO_BYTES = 10 * 1024 * 1024 // 10 MB

export async function POST(req: NextRequest) {
  const contentLength = req.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > MAX_AUDIO_BYTES) {
    return Response.json({ error: 'Audio file too large (max 10 MB)' }, { status: 413 })
  }

  let audioBuffer: ArrayBuffer
  try {
    audioBuffer = await req.arrayBuffer()
  } catch {
    return Response.json({ error: 'Failed to read audio data' }, { status: 400 })
  }

  if (audioBuffer.byteLength > MAX_AUDIO_BYTES) {
    return Response.json({ error: 'Audio file too large (max 10 MB)' }, { status: 413 })
  }

  if (audioBuffer.byteLength === 0) {
    return Response.json({ error: 'Empty audio file' }, { status: 400 })
  }

  const deepgram = new DeepgramClient({ apiKey: process.env.DEEPGRAM_API_KEY! })

  try {
    const response = await deepgram.listen.v1.media.transcribeFile(
      Buffer.from(audioBuffer),
      {
        model: 'nova-2',
        smart_format: true,
        language: 'en',
      },
    )

    // v5 SDK resolves directly to ListenV1Response — results are on the response itself
    const res = response as { results?: { channels?: Array<{ alternatives?: Array<{ transcript?: string }> }> } }
    const transcript = res.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? ''

    return Response.json({ transcript })
  } catch (err) {
    console.error('[chat/transcribe] Deepgram error:', err)
    return Response.json({ error: 'Transcription failed' }, { status: 500 })
  }
}
