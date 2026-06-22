'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { joinWaitlist, getWaitlistCount } from '../../lib/api'
import { setStoredEmail } from '../../lib/utils'

const FORGET_OPTIONS = [
  { value: 'keys', label: 'Keys, wallet, or phone' },
  { value: 'tasks', label: 'Tasks and deadlines' },
  { value: 'events', label: 'Events and birthdays' },
  { value: 'objects', label: 'Where I put things' },
  { value: 'other', label: 'Everything, honestly' },
]

export default function RegisterPage() {
  const router = useRouter()

  const [count, setCount] = useState(127)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    name: '',
    email: '',
    forget_type: '',
  })

  // ✅ IMPORTANT: compute referral WITHOUT state
  const referral = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return new URLSearchParams(window.location.search).get('ref') || ''
  }, [])

  useEffect(() => {
    getWaitlistCount().then((c) => setCount(c + 127)).catch(() => {})
  }, [])

  function validate() {
    const e: Record<string, string> = {}

    if (!form.name.trim()) e.name = 'Enter name'
    if (!form.email.trim()) e.email = 'Enter email'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.forget_type) e.forget_type = 'Select one'

    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }

    setLoading(true)

    try {
      const res = await joinWaitlist({
        ...form,
        referred_by: referral || undefined,
      })

      setStoredEmail(form.email)

      router.push(
        `/confirmed?pos=${res.position}&code=${res.referral_code}&name=${encodeURIComponent(
          form.name
        )}`
      )
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <p className="text-sm mb-4">{count} people on the list</p>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) =>
              setForm((p) => ({ ...p, name: e.target.value }))
            }
            className="border p-2 w-full"
          />

          <input
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm((p) => ({ ...p, email: e.target.value }))
            }
            className="border p-2 w-full"
          />

          <select
            value={form.forget_type}
            onChange={(e) =>
              setForm((p) => ({ ...p, forget_type: e.target.value }))
            }
            className="border p-2 w-full"
          >
            <option value="">Select</option>
            {FORGET_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <button disabled={loading} className="bg-black text-white p-2 w-full">
            {loading ? 'Joining...' : 'Join'}
          </button>
        </form>

        {referral && (
          <p className="text-xs mt-4 text-green-600">
            Referral active
          </p>
        )}
      </div>
    </main>
  )
}