'use client'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

// The actual page content lives here because it calls useSearchParams().
// Next.js requires any component using useSearchParams() in the app router
// to be wrapped in a <Suspense> boundary, otherwise the build bails out of
// static prerendering with "useSearchParams() should be wrapped in a
// suspense boundary". The default export below provides that boundary.
function ConfirmedContent() {
  const params = useSearchParams()
  const code = params.get('code') || ''
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : ''
  const name = params.get('name') || 'there'
  const [copied, setCopied] = useState(false)

  const referralLink = `${origin}/register?ref=${code}`

  function copy() {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <main className="min-h-screen bg-[#F5F5F3] flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">

        {/* Check */}
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          You are in, {decodeURIComponent(name).split(' ')[0]}
        </h1>
        <p className="text-gray-500 mb-8 text-sm leading-relaxed">
          Share your link below and invite others — each friend who joins moves you closer to the top.
        </p>

        {/* Referral */}
        <div className="card p-5 mb-5 text-left">
          <p className="text-sm font-medium text-gray-800 mb-1">Your referral link</p>
          <p className="text-xs text-gray-400 mb-3">Share this link — each signup moves you up</p>
          <div className="flex gap-2">
            <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5 text-xs font-mono text-gray-500 truncate border border-gray-200">
              {referralLink}
            </div>
            <button onClick={copy}
              className={`btn-primary text-sm py-2 px-4 flex-shrink-0 ${copied ? '!bg-green-500 hover:!bg-green-500' : ''}`}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Share */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
              'I just joined Where — an app that remembers where you put things 🧠 ' + referralLink
            )}`} target="_blank" rel="noopener noreferrer" className="btn-ghost text-sm py-2.5">
            Share on X
          </a>
          <a href={`https://wa.me/?text=${encodeURIComponent(
              'Hey! This app remembers where you put things. Check it out: ' + referralLink
            )}`} target="_blank" rel="noopener noreferrer" className="btn-ghost text-sm py-2.5">
            WhatsApp
          </a>
        </div>

        {/* Setup 2FA CTA */}
        <div className="card p-5 mb-6 text-left">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800 mb-0.5">Secure your account</p>
              <p className="text-xs text-gray-500 mb-3">Set up two-factor authentication to protect your memories.</p>
              <Link href="/setup-2fa" className="btn-primary text-xs py-2 px-4 inline-block">
                Set up 2FA
              </Link>
            </div>
          </div>
        </div>

        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-800 underline">
          Go to dashboard →
        </Link>
      </div>

      <p className="text-xs text-gray-400 mt-10">
        Questions? <a href="mailto:hello@where.app" className="underline">hello@where.app</a>
      </p>
    </main>
  )
}

// Minimal fallback shown only for the brief moment before search params
// resolve on the client (during static prerendering, Next renders this
// fallback instead of bailing out of the build).
function ConfirmedFallback() {
  return (
    <main className="min-h-screen bg-[#F5F5F3] flex flex-col items-center justify-center px-4 py-16">
      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 opacity-50" />
    </main>
  )
}

export default function ConfirmedPage() {
  return (
    <Suspense fallback={<ConfirmedFallback />}>
      <ConfirmedContent />
    </Suspense>
  )
}
