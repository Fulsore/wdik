import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// ── Waitlist ──────────────────────────────────────────────
export async function getWaitlistCount(): Promise<number> {
  const res = await api.get('/waitlist/count/')
  return res.data.count
}

export async function joinWaitlist(data: {
  name: string
  email: string
  forget_type: string
  referred_by?: string
}) {
  const res = await api.post('/waitlist/', data)
  return res.data
}

// ── Entries (brain dumps) ─────────────────────────────────
export async function getEntries(email: string) {
  const res = await api.get('/entries/', { params: { email } })
  return res.data
}

export async function createEntry(data: {
  user_email: string
  raw_text: string
}) {
  const res = await api.post('/entries/', data)
  return res.data
}

export async function markDone(entryId: string) {
  const res = await api.patch(`/entries/${entryId}/done/`)
  return res.data
}

// ── Feedback ──────────────────────────────────────────────
export async function submitFeedback(data: { email?: string; message: string }) {
  const res = await api.post('/feedback/', data)
  return res.data
}

export default api