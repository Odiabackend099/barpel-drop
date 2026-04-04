'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, Mic, MicOff, RotateCcw } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  error?: boolean
}

interface LeadData {
  name?: string
  email?: string
  phone?: string
  platform?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/
const PHONE_REGEX = /(\+?[\d\s\-().]{7,15})/

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi! I'm Aria, Barpel's AI assistant. Ask me anything about how Barpel works — or get started with 5 free minutes and a free phone number 👋",
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-slate-300 block"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function HomepageChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [leadData, setLeadData] = useState<LeadData>({})
  const [hasProactiveTriggered, setHasProactiveTriggered] = useState(false)

  const abortControllerRef = useRef<AbortController | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ─── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  // ─── Focus input when opened ────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // ─── Proactive trigger ───────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem('barpel_widget_shown')) return

    let timeMet = false
    let scrollMet = false

    const maybeOpen = () => {
      if (!timeMet || !scrollMet) return
      if (sessionStorage.getItem('barpel_widget_shown')) return
      sessionStorage.setItem('barpel_widget_shown', '1')
      setHasProactiveTriggered(true)
      setIsOpen(true)
      setMessages((prev) => [
        ...prev,
        {
          id: `proactive-${Date.now()}`,
          role: 'assistant',
          content:
            '👋 Quick question — does your store handle customer support calls? I can show you how Barpel handles them automatically.',
        },
      ])
    }

    const timer = setTimeout(() => {
      timeMet = true
      maybeOpen()
    }, 30000)

    const onScroll = () => {
      const total = document.body.scrollHeight - window.innerHeight
      if (total > 0 && window.scrollY / total >= 0.5) {
        scrollMet = true
        maybeOpen()
        window.removeEventListener('scroll', onScroll)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  // ─── Lead detection ──────────────────────────────────────────────────────────
  const detectAndCaptureLead = useCallback(
    (text: string, updatedLead: LeadData) => {
      if (sessionStorage.getItem('barpel_lead_sent')) return updatedLead

      const newLead = { ...updatedLead }

      const emailMatch = text.match(EMAIL_REGEX)
      if (emailMatch && !newLead.email) {
        newLead.email = emailMatch[0]
      }

      const phoneMatch = text.match(PHONE_REGEX)
      if (phoneMatch && !newLead.phone) {
        const candidate = phoneMatch[0].replace(/\s+/g, '').replace(/[()-]/g, '')
        if (candidate.replace(/\D/g, '').length >= 7) {
          newLead.phone = phoneMatch[0].trim()
        }
      }

      // If we have an email, fire the lead capture
      if (newLead.email && !sessionStorage.getItem('barpel_lead_sent')) {
        sessionStorage.setItem('barpel_lead_sent', '1')
        fetch('/api/chat/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLead),
        }).catch(() => {}) // Fire-and-forget
      }

      return newLead
    },
    [],
  )

  // ─── Extract platform/name from message ──────────────────────────────────────
  const extractLeadContext = useCallback(
    (text: string, currentLead: LeadData): LeadData => {
      const newLead = { ...currentLead }
      const lower = text.toLowerCase()

      if (!newLead.platform) {
        if (lower.includes('shopify')) newLead.platform = 'Shopify'
        else if (lower.includes('tiktok') || lower.includes('tik tok'))
          newLead.platform = 'TikTok Shop'
        else if (lower.includes('woocommerce') || lower.includes('woo'))
          newLead.platform = 'WooCommerce'
        else if (lower.includes('amazon')) newLead.platform = 'Amazon'
      }

      return newLead
    },
    [],
  )

  // ─── Send message ─────────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isStreaming) return

      // Abort any in-progress stream
      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
      }

      const aiMsgId = `ai-${Date.now()}`
      const aiMsg: Message = { id: aiMsgId, role: 'assistant', content: '' }

      setMessages((prev) => [...prev, userMsg, aiMsg])
      setInputValue('')
      setIsStreaming(true)

      // Extract lead context from user message
      let currentLead = extractLeadContext(trimmed, leadData)
      currentLead = detectAndCaptureLead(trimmed, currentLead)
      if (currentLead !== leadData) setLeadData(currentLead)

      // Build history for API (exclude current pair — already added above)
      const history = messages
        .filter((m) => m.id !== 'welcome' || m.content !== WELCOME_MESSAGE.content)
        .concat(userMsg)
        .filter((m) => !m.error)
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }))

      try {
        const res = await fetch('/api/chat/widget', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history }),
          signal: controller.signal,
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(err.error ?? `HTTP ${res.status}`)
        }

        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let accumulated = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            const trimmedLine = line.trim()
            if (!trimmedLine.startsWith('data:')) continue
            const data = trimmedLine.slice(5).trim()
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              const delta = parsed.choices?.[0]?.delta?.content
              if (typeof delta === 'string' && delta) {
                accumulated += delta
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMsgId ? { ...m, content: accumulated } : m,
                  ),
                )
              }
            } catch {
              // Partial chunk — skip
            }
          }
        }

        // Detect lead info in AI response too (AI may echo back the email)
        if (accumulated) {
          const updatedLead = detectAndCaptureLead(accumulated, currentLead)
          if (updatedLead !== currentLead) setLeadData(updatedLead)
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return // User cancelled — no error shown
        }
        const errMsg =
          err instanceof Error && err.message
            ? err.message
            : 'Something went wrong'
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? { ...m, content: errMsg, error: true }
              : m,
          ),
        )
      } finally {
        setIsStreaming(false)
      }
    },
    [isStreaming, messages, leadData, detectAndCaptureLead, extractLeadContext],
  )

  // ─── Voice recording ──────────────────────────────────────────────────────────
  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : ''

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)

      audioChunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(audioChunksRef.current, {
          type: mimeType || 'audio/webm',
        })
        if (blob.size === 0) return

        try {
          const res = await fetch('/api/chat/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': mimeType || 'audio/webm' },
            body: blob,
          })
          const data = await res.json()
          if (data.transcript) {
            setInputValue(data.transcript)
            inputRef.current?.focus()
          }
        } catch {
          // Transcription failed silently
        }
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
    } catch {
      // Mic permission denied or unavailable — fail silently
    }
  }, [isRecording])

  // ─── Open / close ─────────────────────────────────────────────────────────────
  const handleOpen = () => {
    sessionStorage.setItem('barpel_widget_shown', '1')
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
    abortControllerRef.current?.abort()
    if (isRecording) {
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="panel"
            initial={{ scale: 0.85, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="w-[calc(100vw-3rem)] max-w-[380px] flex flex-col rounded-2xl shadow-2xl bg-white overflow-hidden border border-slate-200"
            style={{ height: '520px', paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-teal-700 to-teal-500 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-none">Barpel AI</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                    </span>
                    <span className="text-[11px] text-white/80">Online</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-white/70 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scroll-smooth">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-teal-600 text-white rounded-br-sm'
                        : msg.error
                          ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-sm'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                    }`}
                  >
                    {msg.content || (msg.role === 'assistant' && !msg.error ? <TypingDots /> : null)}
                    {msg.error && (
                      <button
                        onClick={() => sendMessage(messages[messages.indexOf(msg) - 1]?.content ?? '')}
                        className="flex items-center gap-1 mt-1 text-xs text-red-500 hover:text-red-700"
                      >
                        <RotateCcw className="w-3 h-3" /> Retry
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator — shown while streaming and last message is empty */}
              {isStreaming && messages[messages.length - 1]?.content === '' && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm">
                    <TypingDots />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-slate-100 bg-gradient-to-b from-white to-slate-50 flex-shrink-0">
              <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-sm hover:shadow-md transition-all">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage(inputValue)
                    }
                  }}
                  placeholder="Ask about Barpel..."
                  disabled={isStreaming}
                  className="flex-1 text-sm outline-none bg-transparent text-slate-800 placeholder-slate-400 disabled:opacity-50 font-medium"
                />
                <button
                  onClick={toggleRecording}
                  title={isRecording ? 'Stop recording' : 'Voice input'}
                  className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                    isRecording
                      ? 'bg-red-100 text-red-600 animate-pulse'
                      : 'text-slate-500 hover:text-teal-600 hover:bg-teal-50'
                  }`}
                  aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => sendMessage(inputValue)}
                  disabled={!inputValue.trim() || isStreaming}
                  className="p-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0 active:scale-95"
                  aria-label="Send message"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger button */}
      <motion.button
        onClick={handleOpen}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`w-14 h-14 rounded-full bg-teal-600 text-white shadow-lg hover:bg-teal-700 transition-colors flex items-center justify-center flex-shrink-0 ${
          isOpen ? 'hidden' : 'flex'
        }`}
        aria-label="Open chat"
      >
        <MessageSquare className="w-6 h-6" />
        {/* Notification ring when proactive trigger fires */}
        {hasProactiveTriggered && !isOpen && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
        )}
      </motion.button>
    </div>
  )
}
