'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { get2FASetup, enable2FA } from '@/lib/api'
import Image from 'next/image'

export default function Setup2FAPage() {
  const router = useRouter()
  const [data, setData] = useState<{ qr_code: string; secret: string } | null>(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [showSecret, setShowSecret] = useState(false)

useEffect(() => {
  async function load2FA() {
    try {
      const result = await get2FASetup()
      setData(result)
    } catch {
      toast.error('Could not load 2FA setup. Are you logged in?')
    } finally {
      setLoading(false)
    }
  }

  load2FA()
}, [])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (code.length < 6) { setError('Enter the 6-digit code'); return }
    setVerifying(true)
    setError('')
    try {
      await enable2FA(code)
      toast.success('2FA enabled! Your account is now secure.')
      router.push('/dashboard')
    } catch {
      setError('That code is incorrect. Check your app and try again.')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F5F3] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-semibold text-gray-900 tracking-tight">where</Link>
          <p className="text-gray-500 text-sm mt-2">Secure your account</p>
        </div>

        <div className="card p-6">
          <h1 className="text-lg font-semibold text-gray-900 mb-1">Set up two-factor auth</h1>
          <p className="text-sm text-gray-500 mb-5">
            Scan this QR code with Google Authenticator or Authy, then enter the 6-digit code below.
          </p>

          {loading ? (
            <div className="flex justify-center py-8">
              <span className="spinner text-blue-600" style={{width:24,height:24,borderWidth:3}} />
            </div>
          ) : data ? (
            <>
              {/* QR */}
              <div className="flex justify-center mb-4">
  <div className="border-4 border-white rounded-xl shadow-sm overflow-hidden">
    {data?.qr_code ? (
      <Image
        src={data.qr_code}
        alt="2FA QR Code"
        width={180}
        height={180}
      />
    ) : (
      <p className="text-red-500 text-sm">QR not generated</p>
    )}
  </div>
</div>

              {/* Manual secret */}
              <div className="mb-5">
                <button onClick={() => setShowSecret(p => !p)}
                  className="text-xs text-blue-600 hover:text-blue-700 underline">
                  {showSecret ? 'Hide manual key' : 'Cannot scan? Enter key manually'}
                </button>
                {showSecret && (
                  <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2 font-mono text-xs text-gray-700 break-all select-all border border-gray-200">
                    {data.secret}
                  </div>
                )}
              </div>

              {/* Verify */}
              <form onSubmit={handleVerify} className="space-y-3">
                <div>
                  <label className="label">Enter the 6-digit code</label>
                  <input type="text" inputMode="numeric" pattern="[0-9]*"
                    maxLength={6} autoFocus placeholder="000000"
                    value={code}
                    onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError('') }}
                    className={`input-field text-center text-xl tracking-[0.4em] font-mono ${error ? 'border-red-400' : ''}`}
                  />
                  {error && <p className="text-red-500 text-xs mt-1 text-center">{error}</p>}
                </div>
                <button type="submit" disabled={verifying || code.length < 6} className="btn-primary w-full">
                  {verifying ? <span className="spinner" /> : 'Enable 2FA'}
                </button>
              </form>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600 block text-center">
                  Skip for now (not recommended)
                </Link>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              Failed to load. <Link href="/dashboard" className="text-blue-600 underline">Go to dashboard</Link>
            </p>
          )}
        </div>
      </div>
    </main>
  )
}