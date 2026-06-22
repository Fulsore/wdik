'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function ConfirmedPage() {
  const params = useSearchParams()

  const position = params.get('pos') || '?'
  const code = params.get('code') || ''
  const name = params.get('name') || 'there'

  const [copied, setCopied] = useState(false)

  const referralLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/register?ref=${code}`
      : `/register?ref=${code}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)

      setTimeout(() => {
        setCopied(false)
      }, 2500)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  return (
    <main className="min-h-screen bg-mist flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">

        {/* Checkmark */}
        <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            width="28"
            height="28"
            fill="none"
            viewBox="0 0 24 24"
            stroke="white"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-semibold text-ink mb-3">
          You are in, {decodeURIComponent(name)}
        </h1>

        <p className="text-slate mb-2">
          You are{' '}
          <span className="font-semibold text-ink text-2xl">
            #{position}
          </span>{' '}
          on the list.
        </p>

        <p className="text-slate text-sm mb-10 leading-relaxed">
          We will email you the moment early access opens. In the meantime —
          share your link below and move up the list.
        </p>

        {/* Referral card */}
        <div className="card p-6 mb-6 text-left">
          <p className="text-sm font-medium text-ink mb-1">
            Your referral link
          </p>

          <p className="text-xs text-slate mb-3">
            Each friend who joins moves you closer to the top.
          </p>

          <div className="flex gap-2">
            <div className="flex-1 bg-mist rounded-xl px-3 py-2.5 text-xs font-mono text-slate truncate border border-gray-200">
              {referralLink}
            </div>

            <button
              onClick={copyLink}
              className={`btn-primary text-sm py-2 px-4 shrink-0 transition-all ${
                copied ? 'bg-success hover:bg-success' : ''
              }`}
            >
              {copied ? (
                <span className="flex items-center gap-1.5">
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copied
                </span>
              ) : (
                'Copy'
              )}
            </button>
          </div>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-2 gap-3 mb-10">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
              `I just joined the waitlist for "Where" — an app that actually remembers where you put things 🧠 Join me: ${referralLink}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost text-sm py-2.5 text-center"
          >
            Share on X / Twitter
          </a>

          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `Hey! I found this app that helps you remember where you put things. Check it out: ${referralLink}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost text-sm py-2.5 text-center"
          >
            Share on WhatsApp
          </a>
        </div>

        {/* Try demo link */}
        <div className="border-t border-gray-200 pt-8">
          <p className="text-sm text-slate mb-4">
            Want to try a preview right now?
          </p>

          <Link
            href="/dashboard"
            className="btn-primary inline-block text-sm py-2.5 px-6"
          >
            Open dashboard preview
          </Link>
        </div>

      </div>

      {/* Footer */}
      <p className="text-xs text-slate mt-12">
        Questions?{' '}
        <a
          href="mailto:hello@where.app"
          className="underline hover:text-ink"
        >
          hello@where.app
        </a>
      </p>
    </main>
  )
}