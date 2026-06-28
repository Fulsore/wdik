'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { login } from '@/lib/api'
import { storeSession } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials')
  const [form, setForm] = useState({ email: '', password: '', code: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(p => ({ ...p, [k]: e.target.value }))
      if (errors[k]) setErrors(p => ({ ...p, [k]: '' }))
    }
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.email.trim()) e.email = 'Email is required'
    if (!form.password) e.password = 'Password is required'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (step === 'credentials') {
      const errs = validate()
      if (Object.keys(errs).length) { setErrors(errs); return }
    }
    setLoading(true)
    try {
      const payload: { email: string; password: string; totp_code?: string } = {
        email: form.email.toLowerCase().trim(),
        password: form.password,
      }
      if (step === '2fa') payload.totp_code = form.code

      const res = await login(payload)

      if (res.requires_2fa) {
        setStep('2fa')
        toast('Enter your authenticator code', { icon: '🔐' })
        setLoading(false)
        return
      }

      storeSession(res.tokens)
      toast.success(`Welcome back, ${res.user.name.split(' ')[0]}`)
      router.push('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      if (step === '2fa') {
        setErrors({ code: msg || 'Invalid code' })
      } else {
        toast.error(msg || 'Invalid email or password')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F5F3] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-semibold text-gray-900 tracking-tight">
            where
          </Link>
          <p className="text-gray-500 text-sm mt-2">
            {step === 'credentials' ? 'Sign in to your account' : 'Two-factor authentication'}
          </p>
        </div>

        <div className="card p-6">
          {step === 'credentials' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input
                  type="email" autoComplete="email" autoFocus
                  placeholder="you@email.com"
                  value={form.email} onChange={set('email')}
                  className={`input-field ${errors.email ? 'border-red-400' : ''}`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0">Password</label>
                </div>
                <input
                  type="password" autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password} onChange={set('password')}
                  className={`input-field ${errors.password ? 'border-red-400' : ''}`}
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? <span className="spinner" /> : 'Sign in'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">Enter the 6-digit code from your authenticator app</p>
              </div>
              <input
                type="text" inputMode="numeric" pattern="[0-9]*"
                maxLength={6} autoFocus placeholder="000000"
                value={form.code} onChange={set('code')}
                className={`input-field text-center text-2xl tracking-[0.5em] font-mono ${errors.code ? 'border-red-400' : ''}`}
              />
              {errors.code && <p className="text-red-500 text-xs text-center">{errors.code}</p>}
              <button type="submit" disabled={loading || form.code.length < 6} className="btn-primary w-full">
                {loading ? <span className="spinner" /> : 'Verify'}
              </button>
              <button type="button" onClick={() => setStep('credentials')}
                className="w-full text-sm text-gray-500 hover:text-gray-800 transition-colors">
                ← Back
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          No account?{' '}
          <Link href="/register" className="text-blue-600 font-medium hover:text-blue-700">
            Create one
          </Link>
        </p>
      </div>
    </main>
  )
}