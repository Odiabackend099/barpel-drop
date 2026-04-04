'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HelpCircle,
  X,
  Send,
  Home,
  MessageSquare,
  ChevronRight,
  RotateCcw,
  Mic,
  MicOff,
} from 'lucide-react'
import { useMerchant } from '@/hooks/useMerchant'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  error?: boolean
}

type Tab = 'home' | 'messages'

// ─── Quick actions ────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: 'How do I connect my Shopify store?', icon: '🔗' },
  { label: 'My AI isn\'t answering calls', icon: '📞' },
  { label: 'How do I add more call minutes?', icon: '⏱️' },
  { label: 'Update my AI\'s greeting message', icon: '🎙️' },
]

// ─── Typing dots ──────────────────────────────────────────────────────────────

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

export default function DashboardSupportWidget() {
  const { merchant } = useMerchant()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  const businessName = merchant?.business_name ?? 'there'
  const initial = businessName[0]?.toUpperCase() ?? 'M'

  // ─── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'messages') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isStreaming, activeTab])

  // ─── Focus input on Messages tab ────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'messages' && isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [activeTab, isOpen])

  // ─── Send message ─────────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isStreaming) return

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

      const history = [...messages, userMsg]
        .filter((m) => !m.error)
        .slice(-15)
        .map((m) => ({ role: m.role, content: m.content }))

      try {
        const res = await fetch('/api/chat/support', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
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
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        const errMsg =
          err instanceof Error && err.message
            ? err.message
            : 'Something went wrong'
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId ? { ...m, content: errMsg, error: true } : m,
          ),
        )
      } finally {
        setIsStreaming(false)
      }
    },
    [isStreaming, messages],
  )

  // ─── Quick action click ───────────────────────────────────────────────────────
  const handleQuickAction = useCallback(
    (label: string) => {
      setActiveTab('messages')
      // Small delay so tab switch animation completes
      setTimeout(() => sendMessage(label), 50)
    },
    [sendMessage],
  )

  // ─── Voice toggle ─────────────────────────────────────────────────────────────
  const handleVoiceToggle = useCallback(async () => {
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
          : undefined

      const recorder =
        mimeType && MediaRecorder.isTypeSupported(mimeType)
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream)

      const chunks: BlobPart[] = []
      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())
        const blob = new Blob(chunks, { type: recorder.mimeType })
        try {
          const res = await fetch('/api/chat/transcribe', {
            method: 'POST',
            body: blob,
            headers: { 'Content-Type': recorder.mimeType },
          })
          const { transcript } = await res.json()
          if (transcript) setInputValue(transcript)
        } catch (err) {
          console.error('Transcription error:', err)
        }
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Microphone error:', err)
    }
  }, [isRecording])

  // ─── Close ───────────────────────────────────────────────────────────────────
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
      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="support-panel"
            initial={{ scale: 0.85, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="w-[calc(100vw-3rem)] max-w-[360px] flex flex-col rounded-2xl shadow-2xl bg-white overflow-hidden border border-slate-200"
            style={{ height: '500px', paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-teal-800 to-teal-600 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm font-semibold text-white">Barpel AI</p>
              </div>
              <button
                onClick={handleClose}
                className="text-white/70 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                aria-label="Close support"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'home' ? (
                <div className="h-full overflow-y-auto">
                  {/* Greeting */}
                  <div className="px-5 pt-5 pb-4">
                    <h2 className="text-xl font-bold text-slate-900">
                      Hi {businessName} 👋
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">How can we help?</p>
                  </div>

                  {/* Quick action cards */}
                  <div className="px-4 space-y-2">
                    {QUICK_ACTIONS.map((action) => (
                      <button
                        key={action.label}
                        onClick={() => handleQuickAction(action.label)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl text-left text-sm text-slate-700 font-medium hover:border-teal-400 hover:shadow-sm transition-all group"
                      >
                        <span className="flex items-center gap-2">
                          <span>{action.icon}</span>
                          {action.label}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 flex-shrink-0" />
                      </button>
                    ))}
                  </div>

                  {/* Status */}
                  <div className="mx-4 mt-4 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    <span className="text-xs text-slate-500">All systems operational</span>
                  </div>
                </div>
              ) : (
                /* Messages tab */
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                    {messages.length === 0 && (
                      <p className="text-xs text-slate-400 text-center pt-4">
                        Ask anything about your Barpel account
                      </p>
                    )}
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ y: 8, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0 mb-0.5">
                            <span className="text-[10px] font-bold text-white">{initial}</span>
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
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
                              onClick={() =>
                                sendMessage(
                                  messages[messages.indexOf(msg) - 1]?.content ?? '',
                                )
                              }
                              className="flex items-center gap-1 mt-1 text-xs text-red-500 hover:text-red-700"
                            >
                              <RotateCcw className="w-3 h-3" /> Retry
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}

                    {isStreaming && messages[messages.length - 1]?.content === '' && (
                      <div className="flex items-end gap-2 justify-start">
                        <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-white">{initial}</span>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm">
                          <TypingDots />
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="px-3 py-2 border-t border-slate-100 bg-gradient-to-b from-white to-slate-50 flex-shrink-0">
                    <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 shadow-sm hover:shadow-md transition-all">
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
                        placeholder="Ask a question..."
                        disabled={isStreaming || isRecording}
                        className="flex-1 text-sm outline-none bg-transparent text-slate-800 placeholder-slate-400 disabled:opacity-50 font-medium"
                      />
                      <button
                        onClick={handleVoiceToggle}
                        disabled={isStreaming}
                        className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${
                          isRecording
                            ? 'bg-red-100 text-red-600 animate-pulse'
                            : 'text-slate-500 hover:text-teal-600 hover:bg-teal-50'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                        title={isRecording ? 'Stop recording' : 'Voice input'}
                        aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
                      >
                        {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => sendMessage(inputValue)}
                        disabled={!inputValue.trim() || isStreaming || isRecording}
                        className="p-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0 active:scale-95"
                        aria-label="Send message"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tab bar */}
            <div className="flex border-t border-slate-100 bg-white flex-shrink-0">
              {(['home', 'messages'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors relative ${
                    activeTab === tab ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {activeTab === tab && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute top-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full"
                    />
                  )}
                  {tab === 'home' ? (
                    <Home className="w-4 h-4" />
                  ) : (
                    <MessageSquare className="w-4 h-4" />
                  )}
                  {tab === 'home' ? 'Home' : 'Messages'}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger button */}
      {!isOpen && (
        <motion.button
          onClick={() => setIsOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-14 h-14 rounded-full bg-teal-600 text-white shadow-lg hover:bg-teal-700 transition-colors flex items-center justify-center"
          aria-label="Open support"
        >
          <HelpCircle className="w-6 h-6" />
        </motion.button>
      )}
    </div>
  )
}
