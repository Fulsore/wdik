'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { createEntry, getEntries, markDone, submitFeedback } from '../../lib/api'
import {
  getCategoryColor, getCategoryLabel, getImportanceDots,
  relativeTime, getStoredEmail, setStoredEmail
} from '../../lib/utils'

interface Entry {
  id: string
  raw_text: string
  parsed_what: string
  parsed_when_display: string | null
  parsed_where: string
  category: string
  importance: number
  created_at: string
}

export default function DashboardPage() {
  const [email, setEmail] = useState(() => {
  if (typeof window === 'undefined') return ''
  return getStoredEmail() || ''
})
  const [emailInput, setEmailInput] = useState('')
  const [entries, setEntries] = useState<Entry[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [newEntryId, setNewEntryId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')
  const [feedbackSent, setFeedbackSent] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load stored email on mount
  useEffect(() => {
  if (email) {
    loadEntries(email)
  }
}, [email])

  async function loadEntries(userEmail: string) {
    setFetching(true)
    try {
      const data = await getEntries(userEmail)
      setEntries(data)
    } catch {
      // silent fail — no entries yet
    } finally {
      setFetching(false)
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!emailInput.trim() || !/\S+@\S+\.\S+/.test(emailInput)) {
      toast.error('Enter a valid email')
      return
    }
    setStoredEmail(emailInput)
    setEmail(emailInput)
    loadEntries(emailInput)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!inputText.trim()) return
    if (!email) { toast.error('Enter your email first'); return }

    setLoading(true)
    try {
      const entry = await createEntry({ user_email: email, raw_text: inputText })
      setEntries((prev) => [entry, ...prev])
      setNewEntryId(entry.id)
      setInputText('')
      toast.success('Got it. I will remind you.')
      setTimeout(() => setNewEntryId(null), 2000)
      textareaRef.current?.focus()
    } catch {
      toast.error('Could not save that. Try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDone(id: string) {
    try {
      await markDone(id)
      setEntries((prev) => prev.filter((e) => e.id !== id))
      toast.success('Marked as done')
    } catch {
      toast.error('Could not update')
    }
  }

  async function handleFeedback(e: React.FormEvent) {
    e.preventDefault()
    if (!feedback.trim()) return
    try {
      await submitFeedback({ email: email || undefined, message: feedback })
      setFeedbackSent(true)
      toast.success('Thanks — that helps a lot')
    } catch {
      toast.error('Could not send feedback')
    }
  }

  // Auto-resize textarea
  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInputText(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
  }

  return (
    <main className="min-h-screen bg-mist">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-semibold text-ink tracking-tight">where</Link>
          <div className="flex items-center gap-3">
            <span className="tag bg-blue-50 text-blue-600 text-xs">preview</span>
            {email && (
              <span className="text-xs text-slate truncate max-w-35">{email}</span>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Email gate (if not logged in) */}
        {!email && (
          <div className="card p-6 mb-6">
            <h2 className="text-lg font-semibold text-ink mb-1">Enter your email to start</h2>
            <p className="text-slate text-sm mb-4">
              Use the same email you registered with — or any email to try the preview.
            </p>
            <form onSubmit={handleEmailSubmit} className="flex gap-2">
              <input
                type="email"
                placeholder="you@email.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="input-field flex-1"
                autoFocus
              />
              <button type="submit" className="btn-primary shrink-0">
                Start
              </button>
            </form>
          </div>
        )}

        {/* Brain dump input */}
        <div className="card p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Tell Help anything</p>
              <p className="text-xs text-slate">Where you put something, a reminder, a task — anything</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleTextareaChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e as unknown as React.FormEvent)
              }}
              placeholder={
                email
                  ? "e.g. I kept my charger on the top shelf in the study room..."
                  : "Enter your email above to get started"
              }
              disabled={!email || loading}
              rows={3}
              className="input-field resize-none w-full mb-3 text-sm leading-relaxed"
              style={{ minHeight: '80px' }}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate">
                {email ? 'Cmd+Enter to save' : ''}
              </p>
              <button
                type="submit"
                disabled={!inputText.trim() || !email || loading}
                className="btn-primary text-sm py-2 px-5"
              >
                {loading ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  'Save to Help'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Entries list */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-ink">
              {entries.length > 0 ? `${entries.length} thing${entries.length !== 1 ? 's' : ''} remembered` : 'Nothing yet'}
            </h2>
            {fetching && (
              <svg className="animate-spin w-4 h-4 text-slate" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            )}
          </div>

          {entries.length === 0 && !fetching && email && (
            <div className="card p-8 text-center">
              <p className="text-slate text-sm">
                Nothing saved yet. Tell Help something above and it will appear here.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={`card p-4 transition-all duration-300 ${
                  newEntryId === entry.id ? 'ring-2 ring-accent/30 animate-fade-up' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Category + importance */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`tag text-xs ${getCategoryColor(entry.category)}`}>
                        {getCategoryLabel(entry.category)}
                      </span>
                      <div className="flex gap-0.5">
                        {getImportanceDots(entry.importance).map((filled, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${filled ? 'bg-accent' : 'bg-gray-200'}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* What */}
                    <p className="font-medium text-ink text-sm leading-snug mb-1.5">
                      {entry.parsed_what || entry.raw_text}
                    </p>

                    {/* When + where */}
                    <div className="flex flex-wrap gap-3 text-xs text-slate">
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

                  {/* Done button */}
                  <button
                    onClick={() => handleDone(entry.id)}
                    className="shrink-0 w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-green-50 hover:border-green-300 transition-colors group"
                    title="Mark as done"
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      className="text-gray-300 group-hover:text-success transition-colors">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback widget */}
        <div className="border-t border-gray-200 pt-8">
          <p className="text-sm font-medium text-ink mb-1">Something missing?</p>
          <p className="text-xs text-slate mb-4">
            Tell us what would make this 10x more useful for you. We read every message.
          </p>

          {feedbackSent ? (
            <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm text-success font-medium">
              Thank you — that genuinely helps us build the right thing.
            </div>
          ) : (
            <form onSubmit={handleFeedback} className="flex gap-2">
              <input
                type="text"
                placeholder="I wish it could also..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="input-field flex-1 text-sm"
              />
              <button type="submit" disabled={!feedback.trim()} className="btn-ghost text-sm shrink-0">
                Send
              </button>
            </form>
          )}
        </div>

      </div>
    </main>
  )
}