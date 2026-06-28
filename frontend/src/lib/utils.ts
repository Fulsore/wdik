export function getCategoryColor(cat: string) {
  const m: Record<string, string> = {
  task: 'bg-blue-50 text-blue-700',
  event: 'bg-purple-50 text-purple-700',
  object: 'bg-amber-50 text-amber-700',
  reminder: 'bg-green-50 text-green-700',
  query: 'bg-teal-50 text-teal-700',
  other: 'bg-gray-100 text-gray-600',
}
  return m[cat] || m.other
}

export function getCategoryLabel(cat: string) {
  const m: Record<string, string> = {
    task: 'Task', event: 'Event', object: 'Object',
    reminder: 'Reminder', query: 'Query', other: 'Note',
  }
  return m[cat] || 'Note'
}

export function getCategoryIcon(cat: string) {
  const m: Record<string, string> = {
    task: '✓',
    event: '◆',
    object: '◎',
    reminder: '◉',
    query: '?',
    other: '·',
  }

  return m[cat] || '·'
}

export function getImportanceDots(importance: number) {
  return Array.from({ length: 5 }, (_, i) => i < importance)
}

export function relativeTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 60000)
  if (diff < 1) return 'just now'
  if (diff < 60) return `${diff}m ago`
  const h = Math.floor(diff / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d === 1) return 'yesterday'
  return `${d}d ago`
}

export function getStoredEmail(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('where_email') || ''
}

export function setStoredEmail(email: string) {
  if (typeof window !== 'undefined') localStorage.setItem('where_email', email)
}

export function getLifestyleLabel(l: string) {
  const m: Record<string, string> = {
    student: 'Student',
    professional: 'Working Professional',
    parent: 'Parent / Caregiver',
    other: 'Other',
  }

  return m[l] || 'Other'
}
