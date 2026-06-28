import axios, { AxiosError } from 'axios'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

const api = axios.create({ baseURL: BASE, headers: { 'Content-Type': 'application/json' } })

// Attach JWT access token from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('where_access')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const orig = error.config as typeof error.config & { _retry?: boolean }
    if (error.response?.status === 401 && !orig._retry) {
      orig._retry = true
      try {
        const refresh = localStorage.getItem('where_refresh')
        if (refresh) {
          const res = await axios.post(`${BASE}/auth/token/refresh/`, { refresh })
          const { access } = res.data
          localStorage.setItem('where_access', access)
          if (orig.headers) orig.headers.Authorization = `Bearer ${access}`
          return api(orig)
        }
      } catch {
        localStorage.removeItem('where_access')
        localStorage.removeItem('where_refresh')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ── Token helpers ──────────────────────────────────────────────────────────
export function saveTokens(access: string, refresh: string) {
  localStorage.setItem('where_access', access)
  localStorage.setItem('where_refresh', refresh)
}

export function clearTokens() {
  localStorage.removeItem('where_access')
  localStorage.removeItem('where_refresh')
}

export function hasToken(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('where_access')
}

// ── Auth ───────────────────────────────────────────────────────────────────
export async function register(data: {
  email: string; name: string; password: string
  lifestyle: string; forget_type: string; referred_by?: string
}) {
  const res = await api.post('/auth/register/', data)
  return res.data
}

export async function login(data: { email: string; password: string; totp_code?: string }) {
  const res = await api.post('/auth/login/', data)
  return res.data
}

export async function logout(refresh: string) {
  await api.post('/auth/logout/', { refresh })
}

export async function getMe() {
  const res = await api.get('/auth/me/')
  return res.data
}

export async function updateMe(data: Partial<{ name: string; lifestyle: string; forget_type: string }>) {
  const res = await api.patch('/auth/me/', data)
  return res.data
}

// ── 2FA ────────────────────────────────────────────────────────────────────
export async function get2FASetup() {
  const res = await api.get('/auth/2fa/setup/')
  return res.data
}

export async function enable2FA(code: string) {
  const res = await api.post('/auth/2fa/setup/', { code })
  return res.data
}

export async function disable2FA(code: string) {
  const res = await api.post('/auth/2fa/disable/', { code })
  return res.data
}

// ── Entries ────────────────────────────────────────────────────────────────
export async function getEntries() {
  const res = await api.get('/entries/')
  return res.data
}

export async function createEntry(data: { raw_text: string; input_mode?: string }) {
  const res = await api.post('/entries/', data)
  return res.data
}

export async function markDone(id: string) {
  const res = await api.patch(`/entries/${id}/done/`)
  return res.data
}

// ── Feedback ───────────────────────────────────────────────────────────────
export async function submitFeedback(message: string) {
  const res = await api.post('/feedback/', { message })
  return res.data
}

// ── Waitlist ───────────────────────────────────────────────────────────────
export async function getWaitlistCount() {
  const res = await api.get('/waitlist/count/')
  return res.data.count as number
}

export async function joinWaitlist(data: {
  name: string; email: string; forget_type: string; referred_by?: string
}) {
  const res = await api.post('/waitlist/', data)
  return res.data
}

export default api