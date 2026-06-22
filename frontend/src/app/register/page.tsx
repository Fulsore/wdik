'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { joinWaitlist, getWaitlistCount } from '..//.././../lib/api'
import { setStoredEmail } from '..//.././../lib/utils'

const FORGET_OPTIONS = [
  { value: 'keys', label: 'Keys, wallet, or phone' },
  { value: 'tasks', label: 'Tasks and deadlines' },
  { value: 'events', label: 'Events and birthdays' },
  { value: 'objects', label: 'Where I put things' },
  { value: 'other', label: 'Everything, honestly' },
]

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref') || ''

  const [count, setCount] = useState(127)
  const [form, setForm] = useState({ name: '', email: '', forget_type: '', referred_by: ref })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    getWaitlistCount().then((c) => setCount(c + 127)).catch(() => {})
  }, [])

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'What should we call you?'
    if (!form.email.trim()) e.email = 'We need your email to send reminders'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'That does not look like a valid email'
    if (!form.forget_type) e.forget_type = 'Pick what fits you most'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      const res = await joinWaitlist({
        name: form.name,
        email: form.email,
        forget_type: form.forget_type,
        referred_by: ref || undefined,
      })
      setStoredEmail(form.email)
      router.push(`/confirmed?pos=${res.position}&code=${res.referral_code}&name=${encodeURIComponent(form.name)}`)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { email?: string[] } } }
      if (error?.response?.data?.email) {
        toast.error('That email is already on the list!')
      } else {
        toast.error('Something went wrong. Try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  function field(key: keyof typeof form) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm((p) => ({ ...p, [key]: e.target.value }))
        if (errors[key]) setErrors((p) => ({ ...p, [key]: '' }))
      },
    }
  }

  return (
    <main className="min-h-screen bg-mist flex flex-col items-center justify-center px-4 py-16">
      {/* Nav */}
      <div className="w-full max-w-md mb-8">
        <Link href="/" className="flex items-center gap-2 text-slate hover:text-ink transition-colors text-sm">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7-7l-7 7 7 7" />
          </svg>
          Back to home
        </Link>
      </div>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1.5 text-xs text-slate mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-slow inline-block" />
            {count} people on the list
          </div>
          <h1 className="text-3xl font-semibold text-ink mb-2">Get early access</h1>
          <p className="text-slate text-sm leading-relaxed">
            Free for the first 500 people. We are building this with you — your answer below helps us get it right.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="label" htmlFor="name">Your name</label>
            <input
              id="name"
              type="text"
              placeholder="Arjun, Priya, whoever you are"
              className={`input-field ${errors.name ? 'border-red-400 focus:ring-red-200' : ''}`}
              autoComplete="given-name"
              {...field('name')}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1.5">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="you@email.com"
              className={`input-field ${errors.email ? 'border-red-400 focus:ring-red-200' : ''}`}
              autoComplete="email"
              {...field('email')}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email}</p>}
            <p className="text-xs text-slate mt-1.5">We will only email you your reminders and early access invite.</p>
          </div>

          {/* Forget type */}
          <div>
            <label className="label" htmlFor="forget_type">
              What do you forget most?
              <span className="text-slate font-normal ml-1">(helps us build the right thing)</span>
            </label>
            <select
              id="forget_type"
              className={`input-field bg-white appearance-none ${errors.forget_type ? 'border-red-400' : ''}`}
              {...field('forget_type')}
            >
              <option value="">Pick one...</option>
              {FORGET_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {errors.forget_type && <p className="text-red-500 text-xs mt-1.5">{errors.forget_type}</p>}
          </div>

          {/* Referral hint */}
          {ref && (
            <div className="bg-blue-50 rounded-xl px-4 py-3 text-sm text-blue-700">
              You were invited by someone on the list — you get a higher spot.
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full text-base py-3.5 mt-2">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Joining...
              </span>
            ) : (
              'Join the waitlist'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate mt-5">
          No spam. No selling your data. Just your reminders and the launch email.
        </p>
      </div>
    </main>
  )
}