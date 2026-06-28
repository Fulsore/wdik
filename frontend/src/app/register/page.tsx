'use client'
import { Suspense, useState, useEffect, type ChangeEvent, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { register, getWaitlistCount } from '@/lib/api'
import { storeSession } from '@/lib/auth'

const LIFESTYLE = [
  { value: 'student', label: 'Student' },
  { value: 'professional', label: 'Working Professional' },
  { value: 'parent', label: 'Parent / Caregiver' },
  { value: 'other', label: 'Other' },
]
const FORGET = [
  { value: 'keys', label: 'Keys, wallet, or phone' },
  { value: 'tasks', label: 'Tasks and deadlines' },
  { value: 'events', label: 'Events and birthdays' },
  { value: 'objects', label: 'Where I put things' },
  { value: 'other', label: 'Everything, honestly' },
]

// The actual page content lives here because it calls useSearchParams().
// Next.js requires any component using useSearchParams() in the app router
// to be wrapped in a <Suspense> boundary, otherwise the build bails out of
// static prerendering with "useSearchParams() should be wrapped in a
// suspense boundary". The default export below provides that boundary.
function RegisterContent() {
  const router = useRouter()
  const params = useSearchParams()
  const ref = params.get('ref') || ''

  const [count, setCount] = useState(127)
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    lifestyle: '', forget_type: '', referred_by: ref,
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    getWaitlistCount().then(c => setCount(c + 127)).catch(() => {})
  }, [])

  function set(k: keyof typeof form) {
    return (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm(p => ({ ...p, [k]: e.target.value }))
      if (errors[k]) setErrors(p => ({ ...p, [k]: '' }))
    }
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'What should we call you?'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password) e.password = 'Choose a password'
    else if (form.password.length < 8) e.password = 'At least 8 characters'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    if (!form.lifestyle) e.lifestyle = 'Pick your lifestyle'
    if (!form.forget_type) e.forget_type = 'Pick what fits you'
    return e
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      const res = await register({
        name: form.name.trim(), email: form.email.toLowerCase().trim(),
        password: form.password, lifestyle: form.lifestyle,
        forget_type: form.forget_type,
        referred_by: ref || undefined,
      })
      storeSession(res.tokens)
      toast.success(`Welcome, ${res.user.name.split(' ')[0]}!`)
      router.push(`/confirmed?code=${res.user.referral_code}&name=${encodeURIComponent(res.user.name)}&pos=1`)
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data
      if (data?.email) toast.error(data.email[0])
      else toast.error('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const strength = form.password.length === 0 ? 0
    : form.password.length < 8 ? 1
    : /[A-Z]/.test(form.password) && /[0-9]/.test(form.password) ? 3 : 2

  return (
    <main className="min-h-screen bg-[#F5F5F3] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-semibold text-gray-900 tracking-tight">where</Link>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-gray-500">{count} people on the waitlist</span>
          </div>
        </div>

        <div className="card p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Create your account</h1>
          <p className="text-sm text-gray-500 mb-6">Free forever. No credit card.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="label">Your name</label>
              <input type="text" autoComplete="given-name" autoFocus
                placeholder="Arjun, Priya..." value={form.name} onChange={set('name')}
                className={`input-field ${errors.name ? 'border-red-400' : ''}`} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="label">Email</label>
              <input type="email" autoComplete="email" placeholder="you@email.com"
                value={form.email} onChange={set('email')}
                className={`input-field ${errors.email ? 'border-red-400' : ''}`} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} autoComplete="new-password"
                  placeholder="Min 8 characters" value={form.password} onChange={set('password')}
                  className={`input-field pr-10 ${errors.password ? 'border-red-400' : ''}`} />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {form.password && (
                <div className="flex gap-1 mt-1.5">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                      strength >= i ? (strength === 1 ? 'bg-red-400' : strength === 2 ? 'bg-amber-400' : 'bg-green-500') : 'bg-gray-200'
                    }`} />
                  ))}
                </div>
              )}
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label className="label">Confirm password</label>
              <input type="password" autoComplete="new-password" placeholder="Repeat password"
                value={form.confirmPassword} onChange={set('confirmPassword')}
                className={`input-field ${errors.confirmPassword ? 'border-red-400' : ''}`} />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Lifestyle + Forget type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">I am a</label>
                <select value={form.lifestyle} onChange={set('lifestyle')}
                  className={`input-field bg-white ${errors.lifestyle ? 'border-red-400' : ''}`}>
                  <option value="">Select...</option>
                  {LIFESTYLE.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {errors.lifestyle && <p className="text-red-500 text-xs mt-1">{errors.lifestyle}</p>}
              </div>
              <div>
                <label className="label">I mostly forget</label>
                <select value={form.forget_type} onChange={set('forget_type')}
                  className={`input-field bg-white ${errors.forget_type ? 'border-red-400' : ''}`}>
                  <option value="">Select...</option>
                  {FORGET.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {errors.forget_type && <p className="text-red-500 text-xs mt-1">{errors.forget_type}</p>}
              </div>
            </div>

            {ref && (
              <div className="bg-blue-50 rounded-xl px-4 py-3 text-sm text-blue-700">
                You were invited — you get priority access.
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? <span className="spinner" /> : 'Create account'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            By registering you agree to our{' '}
            <Link href="/privacy" className="underline hover:text-gray-600">privacy policy</Link>.
          </p>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 font-medium hover:text-blue-700">Sign in</Link>
        </p>
      </div>
    </main>
  )
}

// Minimal fallback shown only for the brief moment before search params
// resolve on the client (during static prerendering, Next renders this
// fallback instead of bailing out of the build).
function RegisterFallback() {
  return (
    <main className="min-h-screen bg-[#F5F5F3] flex items-center justify-center px-4 py-12">
      <span className="spinner text-blue-600" style={{ width: 32, height: 32, borderWidth: 3 }} />
    </main>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterFallback />}>
      <RegisterContent />
    </Suspense>
  )
}
