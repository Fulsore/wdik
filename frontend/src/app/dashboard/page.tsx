'use client'
import { useState, useEffect, useRef, useCallback, type FormEvent, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { getEntries, createEntry, markDone, submitFeedback, clearTokens } from '@/lib/api'
import { loadUser, type AuthUser } from '@/lib/auth'
import { getCategoryColor, getCategoryLabel, getImportanceDots, relativeTime } from '@/lib/utils'

interface Entry {
  id: string
  raw_text: string
  parsed_what: string
  parsed_when_display: string | null
  parsed_where: string
  category: string
  importance: number
  ai_response: string
  input_mode: string
  created_at: string
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking'

// ── Speech API types ──────────────────────────────────────────────────────────
// These DOM Speech APIs aren't part of standard lib.dom.d.ts, so we declare
// minimal shapes here instead of relying on ambient globals that don't exist.
interface ISpeechRecognitionAlternative {
  transcript: string
  confidence: number
}
interface ISpeechRecognitionResult {
  isFinal: boolean
  length: number
  [index: number]: ISpeechRecognitionAlternative
}
interface ISpeechRecognitionResultList {
  length: number
  [index: number]: ISpeechRecognitionResult
}
interface ISpeechRecognitionEvent extends Event {
  resultIndex: number
  results: ISpeechRecognitionResultList
}
interface ISpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}
interface ISpeechRecognition extends EventTarget {
  lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number
  start(): void; stop(): void; abort(): void
  onresult: ((e: ISpeechRecognitionEvent) => void) | null
  onerror: ((e: ISpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}
declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition
    webkitSpeechRecognition?: new () => ISpeechRecognition
  }
}

// ── Voice hook ────────────────────────────────────────────────────────────────
// This hook no longer takes a callback. It only exposes state + a `finalTranscript`
// value. The caller reacts to `finalTranscript` changes via its own useEffect.
// This avoids any "accessed before declaration" ordering problem entirely, since
// there is no cross-reference between this hook's return value and a function
// defined later in the component.
function useVoice() {
  const [state, setState] = useState<VoiceState>('idle')
  const [transcript, setTranscript] = useState('')
  const [finalTranscript, setFinalTranscript] = useState<{ text: string; nonce: number } | null>(null)
  // Lazy initializer runs once during the initial render (not "in an effect"),
  // so there's no setState-in-effect warning and no extra re-render either.
  const [supported] = useState(() => {
    if (typeof window === 'undefined') return true
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
  })
  const recognitionRef = useRef<ISpeechRecognition | null>(null)
  const stateRef = useRef<VoiceState>(state)

  // Keep stateRef in sync with state, but do it in an effect (not render).
  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return

    const r = new SR()
    r.lang = 'en-IN'
    r.continuous = false
    r.interimResults = true
    r.maxAlternatives = 1

    r.onresult = (e: ISpeechRecognitionEvent) => {
      const results = Array.from(e.results)
      const current = results[results.length - 1]
      const text = current[0].transcript
      setTranscript(text)
      if (current.isFinal) {
        setState('processing')
        setFinalTranscript({ text, nonce: Date.now() })
      }
    }

    r.onerror = (e: ISpeechRecognitionErrorEvent) => {
      if (e.error !== 'aborted') {
        toast.error('Microphone error: ' + e.error)
      }
      setState('idle')
      setTranscript('')
    }

    r.onend = () => {
      if (stateRef.current === 'listening') setState('idle')
    }

    recognitionRef.current = r

    return () => {
      r.onresult = null
      r.onerror = null
      r.onend = null
      r.abort()
    }
  }, [])

  const startListening = useCallback(() => {
    if (!supported) { toast.error('Voice not supported in this browser. Use Chrome.'); return }
    if (stateRef.current !== 'idle') return
    setTranscript('')
    setState('listening')
    recognitionRef.current?.start()
  }, [supported])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setState('idle')
    setTranscript('')
  }, [])

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!window.speechSynthesis) { onEnd?.(); return }
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-IN'
    u.rate = 0.93
    u.pitch = 1.05
    u.onend = () => {
      setState('idle')
      onEnd?.()
    }
    setState('speaking')
    window.speechSynthesis.speak(u)
  }, [])

  const reset = useCallback(() => setState('idle'), [])

  return { state, transcript, finalTranscript, supported, startListening, stopListening, speak, reset }
}

// ── Entry card ────────────────────────────────────────────────────────────────
function EntryCard({ entry, onDone, isNew }: {
  entry: Entry; onDone: (id: string) => void; isNew: boolean
}) {
  const [done, setDone] = useState(false)

  async function handleDone() {
    setDone(true)
    try {
      await markDone(entry.id)
      setTimeout(() => onDone(entry.id), 300)
    } catch {
      setDone(false)
      toast.error('Could not update')
    }
  }

  return (
    <div className={`card p-4 transition-all duration-300 ${done ? 'opacity-0 scale-95' : ''} ${isNew ? 'ring-2 ring-blue-500/20 animate-fade-up' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className={`tag text-xs ${getCategoryColor(entry.category)}`}>
              {getCategoryLabel(entry.category)}
            </span>
            {entry.input_mode === 'voice' && (
              <span className="tag text-xs bg-violet-50 text-violet-700">
                <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="inline">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                {' '}Voice
              </span>
            )}
            <div className="flex gap-0.5 ml-auto">
              {getImportanceDots(entry.importance).map((filled, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${filled ? 'bg-blue-500' : 'bg-gray-200'}`} />
              ))}
            </div>
          </div>

          <p className="font-medium text-gray-900 text-sm leading-snug mb-1.5">
            {entry.parsed_what || entry.raw_text}
          </p>

          <div className="flex flex-wrap gap-3 text-xs text-gray-400">
            {entry.parsed_when_display && (
              <span className="flex items-center gap-1">
                <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {entry.parsed_when_display}
              </span>
            )}
            {entry.parsed_where && (
              <span className="flex items-center gap-1">
                <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {entry.parsed_where}
              </span>
            )}
            <span>{relativeTime(entry.created_at)}</span>
          </div>
        </div>

        <button onClick={handleDone} disabled={done}
          className="flex-shrink-0 w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-green-50 hover:border-green-300 transition-colors group">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            className="text-gray-300 group-hover:text-green-500 transition-colors">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>

      {/* AI response bubble */}
      {entry.ai_response && (
        <div className="mt-2.5 flex items-start gap-2">
          <div className="w-5 h-5 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center mt-0.5">
            <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed italic">{entry.ai_response}</p>
        </div>
      )}
    </div>
  )
}

// ── Mic button ────────────────────────────────────────────────────────────────
function MicButton({ voiceState, onClick }: { voiceState: VoiceState; onClick: () => void }) {
  const isListening = voiceState === 'listening'
  const isProcessing = voiceState === 'processing'
  const isSpeaking = voiceState === 'speaking'

  return (
    <div className="relative flex items-center justify-center">
      {isListening && (
        <>
          <div className="absolute w-16 h-16 rounded-full bg-red-400/20 animate-pulse-ring" />
          <div className="absolute w-20 h-20 rounded-full bg-red-400/10 animate-pulse-ring" style={{ animationDelay: '0.3s' }} />
        </>
      )}
      {isSpeaking && (
        <div className="absolute w-16 h-16 rounded-full bg-blue-400/20 animate-pulse" />
      )}
      <button
        onClick={onClick}
        className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-md ${
          isListening
            ? 'bg-red-500 scale-110 shadow-red-200'
            : isSpeaking
            ? 'bg-blue-500 scale-105 shadow-blue-200'
            : isProcessing
            ? 'bg-amber-500 shadow-amber-200'
            : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95'
        }`}
        aria-label={isListening ? 'Stop listening' : 'Start voice input'}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <span className="spinner text-white" style={{ width: 20, height: 20, borderWidth: 2.5 }} />
        ) : isSpeaking ? (
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 9.5v5M8.464 8.464a5 5 0 000 7.072" />
          </svg>
        ) : (
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>
    </div>
  )
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [entries, setEntries] = useState<Entry[]>([])
  const [fetching, setFetching] = useState(false)
  const [inputText, setInputText] = useState('')
  const [saving, setSaving] = useState(false)
  const [newEntryId, setNewEntryId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'objects' | 'events' | 'tasks'>('all')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // useVoice no longer takes a callback, so there's no forward-reference problem.
  const voice = useVoice()

  // ── Save entry ────────────────────────────────────────────────────────────
  const saveEntry = useCallback(async (text: string, mode: 'text' | 'voice' = 'text') => {
    if (!text.trim()) return
    setSaving(true)
    try {
      const entry = await createEntry({ raw_text: text, input_mode: mode })
      setEntries(prev => [entry, ...prev])
      setNewEntryId(entry.id)
      setInputText('')
      setTimeout(() => setNewEntryId(null), 3000)

      if (mode === 'voice' && entry.ai_response) {
        voice.speak(entry.ai_response)
      } else {
        toast.success(entry.ai_response || 'Got it.')
      }

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch {
      toast.error('Could not save. Try again.')
      voice.reset()
    } finally {
      setSaving(false)
    }
  }, [voice.speak, voice.reset])

  // React to a finalized voice transcript. `finalTranscript` carries a `nonce`
  // so repeated identical phrases ("blue drawer" twice) still re-trigger.
  useEffect(() => {
    if (!voice.finalTranscript) return
    const text = voice.finalTranscript.text
    if (!text.trim()) {
      voice.reset()
      return
    }
    setInputText(text)
    saveEntry(text, 'voice')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.finalTranscript])

  function handleMicClick() {
    if (voice.state === 'listening') {
      voice.stopListening()
    } else if (voice.state === 'idle') {
      voice.startListening()
    }
  }

  // ── Load entries ──────────────────────────────────────────────────────────
  // Declared before the auth-check effect that calls it, with a stable identity.
  const loadEntries = useCallback(async () => {
    setFetching(true)
    try {
      const data = await getEntries()
      setEntries(data)
    } catch {
      /* silent */
    } finally {
      setFetching(false)
    }
  }, [])

  // ── Auth check ────────────────────────────────────────────────────────────
  useEffect(() => {
    loadUser().then(u => {
      if (!u) { router.push('/login'); return }
      setUser(u)
      loadEntries()
    }).catch(() => router.push('/login'))
      .finally(() => setAuthLoading(false))
  }, [router, loadEntries])

  async function handleTextSubmit(e: FormEvent) {
    e.preventDefault()
    await saveEntry(inputText, 'text')
  }

  function handleTextareaChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setInputText(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
  }

  async function handleFeedback(e: FormEvent) {
    e.preventDefault()
    if (!feedback.trim()) return
    try {
      await submitFeedback(feedback)
      setFeedbackSent(true)
      toast.success('Thank you — genuinely.')
    } catch { toast.error('Could not send') }
  }

  function handleLogout() {
    clearTokens()
    router.push('/login')
  }

  // ── Filtered entries ──────────────────────────────────────────────────────
  const filtered = entries.filter(e => {
    if (activeTab === 'all') return true
    if (activeTab === 'objects') return e.category === 'object'
    if (activeTab === 'events') return e.category === 'event'
    if (activeTab === 'tasks') return e.category === 'task'
    return true
  })

  const voiceLabel = {
    idle: 'Tap to speak',
    listening: 'Listening... tap to stop',
    processing: 'Thinking...',
    speaking: 'Help is speaking...',
  }[voice.state]

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F3] flex items-center justify-center">
        <span className="spinner text-blue-600" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#F5F5F3]">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-4 py-3.5 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 tracking-tight">where</span>
            {!user?.is_2fa_enabled && (
              <Link href="/setup-2fa"
                className="tag bg-amber-50 text-amber-700 text-xs hover:bg-amber-100 transition-colors">
                Enable 2FA
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-xs text-gray-400 hidden sm:inline truncate max-w-[120px]">
                {user.name}
              </span>
            )}
            <button onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Voice + Input card */}
        <div className="card p-5 mb-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Tell Help anything</p>
              <p className="text-xs text-gray-400">Speak or type — where you put something, a reminder, a task</p>
            </div>
          </div>

          {/* Voice section */}
          <div className="flex flex-col items-center py-4 mb-4 bg-gray-50 rounded-xl">
            <MicButton voiceState={voice.state} onClick={handleMicClick} />
            <p className="text-xs text-gray-400 mt-3 transition-all">{voiceLabel}</p>

            {/* Live transcript */}
            {voice.transcript && (
              <div className="mt-3 w-full px-3">
                <p className="text-sm text-gray-600 bg-white rounded-lg px-3 py-2 border border-gray-200 text-center animate-fade-in">
                  {voice.transcript}
                </p>
              </div>
            )}

            {!voice.supported && (
              <p className="text-xs text-amber-600 mt-2 text-center px-3">
                Voice not supported. Use Chrome on Android for voice input.
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or type below</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Text input */}
          <form onSubmit={handleTextSubmit}>
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleTextareaChange}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  handleTextSubmit(e)
                }
              }}
              placeholder="e.g. I kept my passport in the blue drawer in the second room..."
              disabled={saving || voice.state !== 'idle'}
              rows={2}
              className="input-field resize-none w-full mb-2 leading-relaxed"
              style={{ minHeight: '60px' }}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">Cmd+Enter to save</p>
              <button type="submit"
                disabled={!inputText.trim() || saving || voice.state !== 'idle'}
                className="btn-primary text-sm py-2 px-5">
                {saving ? <span className="spinner" /> : 'Save'}
              </button>
            </div>
          </form>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-white rounded-xl p-1 border border-gray-100">
          {(['all', 'objects', 'events', 'tasks'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-all capitalize ${
                activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-800'
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Entries */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {filtered.length > 0 ? `${filtered.length} remembered` : 'Nothing here yet'}
            </p>
            {fetching && <span className="spinner text-gray-400" />}
          </div>

          {filtered.length === 0 && !fetching && (
            <div className="card p-10 text-center">
              <div className="text-3xl mb-3">🧠</div>
              <p className="text-gray-500 text-sm">
                {activeTab === 'all'
                  ? 'Nothing saved yet. Speak or type something above.'
                  : `No ${activeTab} saved yet.`}
              </p>
            </div>
          )}

          <div className="space-y-3">
            {filtered.map(entry => (
              <EntryCard
                key={entry.id}
                entry={entry}
                isNew={entry.id === newEntryId}
                onDone={id => setEntries(p => p.filter(e => e.id !== id))}
              />
            ))}
          </div>
        </div>

        {/* Feedback */}
        <div className="border-t border-gray-200 pt-6 pb-8">
          <p className="text-sm font-medium text-gray-800 mb-1">Something missing?</p>
          <p className="text-xs text-gray-400 mb-3">We read every message and reply personally.</p>
          {feedbackSent ? (
            <div className="bg-green-50 rounded-xl px-4 py-3 text-sm text-green-700 font-medium">
              Thank you — that genuinely helps.
            </div>
          ) : (
            <form onSubmit={handleFeedback} className="flex gap-2">
              <input type="text" placeholder="I wish it could also..."
                value={feedback} onChange={e => setFeedback(e.target.value)}
                className="input-field flex-1" />
              <button type="submit" disabled={!feedback.trim()} className="btn-ghost text-sm flex-shrink-0">
                Send
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
