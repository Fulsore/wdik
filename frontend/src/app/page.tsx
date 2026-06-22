'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getWaitlistCount } from '..//././../lib/api'

const DEMO_ENTRIES = [
  {
    raw: "Remind me about Priya's birthday on the 18th — I want to buy her a book",
    parsed_what: "Priya's birthday — buy a book",
    category: 'event',
    parsed_when_display: '18 Jul 2025, 09:00 AM',
    importance: 4,
  },
  {
    raw: 'I kept my passport in the blue drawer inside the wardrobe in the second room',
    parsed_what: 'Passport — blue drawer, wardrobe, second room',
    category: 'object',
    parsed_when_display: null,
    importance: 5,
  },
  {
    raw: 'Submit the project report before Friday end of day',
    parsed_what: 'Submit project report',
    category: 'task',
    parsed_when_display: 'Fri 18 Jul 2025, 06:00 PM',
    importance: 5,
  },
]

const CATEGORY_COLORS: Record<string, string> = {
  event: 'bg-purple-50 text-purple-700',
  object: 'bg-amber-50 text-amber-700',
  task: 'bg-blue-50 text-blue-700',
}

const CATEGORY_LABELS: Record<string, string> = {
  event: 'Event',
  object: 'Object',
  task: 'Task',
}

export default function LandingPage() {
  const [count, setCount] = useState<number>(127)
  const [demoIndex, setDemoIndex] = useState(0)
  const [typed, setTyped] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showCard, setShowCard] = useState(false)

  useEffect(() => {
    getWaitlistCount()
      .then((c) => setCount(c + 127))
      .catch(() => {})
  }, [])

  // Demo typewriter effect
  useEffect(() => {
    const entry = DEMO_ENTRIES[demoIndex]
    setTyped('')
    setShowCard(false)
    setIsTyping(true)
    let i = 0
    const interval = setInterval(() => {
      if (i <= entry.raw.length) {
        setTyped(entry.raw.slice(0, i))
        i++
      } else {
        clearInterval(interval)
        setIsTyping(false)
        setTimeout(() => {
          setShowCard(true)
          setTimeout(() => {
            setDemoIndex((prev) => (prev + 1) % DEMO_ENTRIES.length)
          }, 3000)
        }, 400)
      }
    }, 28)
    return () => clearInterval(interval)
  }, [demoIndex])

  const currentEntry = DEMO_ENTRIES[demoIndex]

  return (
    <main className="min-h-screen bg-mist">
      {/* Nav */}
      <nav className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold text-ink tracking-tight">where</span>
          <span className="tag bg-blue-50 text-blue-600 text-xs">beta</span>
        </div>
        <Link href="/register" className="btn-primary text-sm py-2 px-5">
          Join waitlist
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-8 text-center">
        <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-slate mb-8">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse-slow inline-block" />
          {count} people already on the waitlist
        </div>

        <h1 className="text-5xl md:text-6xl font-semibold text-ink tracking-tight leading-tight mb-6">
          You forgot where
          <br />
          <span className="text-accent">you put it. Again.</span>
        </h1>

        <p className="text-lg text-slate max-w-xl mx-auto mb-10 leading-relaxed">
          No app to open. No typing into forms. Just tell{' '}
          <span className="font-medium text-ink">Help</span> — and it remembers
          everything, reminds you when it matters.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register" className="btn-primary text-base py-3.5 px-8">
            Get early access — free
          </Link>
          <a href="#how" className="btn-ghost text-base py-3.5 px-8">
            See how it works
          </a>
        </div>
      </section>

      {/* Live Demo */}
      <section className="max-w-2xl mx-auto px-6 py-12" id="demo">
        <div className="card p-6">
          <p className="text-xs font-medium text-slate uppercase tracking-wider mb-4">
            Live demo — watch it work
          </p>

          {/* Input simulation */}
          <div className="bg-mist rounded-xl p-4 mb-4 min-h-[64px] flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-accent flex-shrink-0 flex items-center justify-center mt-0.5">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-ink leading-relaxed">
                {typed}
                {isTyping && (
                  <span className="inline-block w-0.5 h-4 bg-accent ml-0.5 animate-pulse" />
                )}
              </p>
            </div>
          </div>

          {/* Result card */}
          {showCard && (
            <div className="border border-gray-100 rounded-xl p-4 animate-fade-up">
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className={`tag ${CATEGORY_COLORS[currentEntry.category] || 'bg-gray-100 text-gray-600'}`}>
                  {CATEGORY_LABELS[currentEntry.category] || 'Note'}
                </span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${
                        i < currentEntry.importance ? 'bg-accent' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="font-medium text-ink text-sm mb-2">{currentEntry.parsed_what}</p>
              {currentEntry.parsed_when_display && (
                <p className="text-xs text-slate flex items-center gap-1.5">
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {currentEntry.parsed_when_display}
                </p>
              )}
              <p className="text-xs text-success mt-3 font-medium">
                Got it. I will remind you.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-16" id="how">
        <h2 className="text-3xl font-semibold text-ink text-center mb-12">
          Three steps. That is it.
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              title: 'Open and talk',
              desc: 'Say "Help" and tell it anything — a birthday, where you put your keys, a task to do.',
            },
            {
              step: '02',
              title: 'Help understands',
              desc: 'It figures out what, when, where, and how important — automatically. No forms.',
            },
            {
              step: '03',
              title: 'It finds you',
              desc: 'At the right time, it reaches out. "Is now a good time? Here is what I am holding."',
            },
          ].map((item) => (
            <div key={item.step} className="card p-6">
              <span className="font-mono text-xs text-accent font-medium">{item.step}</span>
              <h3 className="text-lg font-semibold text-ink mt-2 mb-2">{item.title}</h3>
              <p className="text-slate text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pain points */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 md:p-12">
          <p className="text-sm font-medium text-slate uppercase tracking-wider mb-6">
            Built for real life
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              'Students who have 10 things to do and forget 3',
              'Working moms who hold the whole family in their head',
              'Employees switching tasks under constant pressure',
              'Anyone who has walked into a room and forgotten why',
              'People who find things only after they stopped looking',
              'Everyone who told themselves "I will remember this"',
            ].map((pain) => (
              <div key={pain} className="flex items-start gap-3 text-sm text-ink">
                <svg className="w-4 h-4 text-success flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {pain}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl font-semibold text-ink mb-4">
          Be one of the first to use it
        </h2>
        <p className="text-slate mb-8 max-w-md mx-auto">
          Early access is free. We are building this with the first 500 people who join.
        </p>
        <Link href="/register" className="btn-primary text-base py-3.5 px-10 inline-block">
          Join the waitlist
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-semibold text-ink">where</span>
            <span className="text-slate text-sm ml-3">
              Built by a developer who kept forgetting things too.
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate">
            <a href="mailto:hello@where.app" className="hover:text-ink transition-colors">
              hello@where.app
            </a>
            <Link href="/privacy" className="hover:text-ink transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}