export function getCategoryColor(category: string) {
  const map: Record<string, string> = {
    task: 'bg-blue-50 text-blue-700',
    event: 'bg-purple-50 text-purple-700',
    object: 'bg-amber-50 text-amber-700',
    reminder: 'bg-green-50 text-green-700',
    other: 'bg-gray-100 text-gray-600',
  }
  return map[category] || map.other
}

export function getCategoryLabel(category: string) {
  const map: Record<string, string> = {
    task: 'Task',
    event: 'Event',
    object: 'Object / Place',
    reminder: 'Reminder',
    other: 'Note',
  }
  return map[category] || 'Note'
}

export function getImportanceDots(importance: number) {
  return Array.from({ length: 5 }, (_, i) => i < importance)
}

export function relativeTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays === 1) return 'yesterday'
  return `${diffDays}d ago`
}

export function getStoredEmail(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('where_email') || ''
}

export function setStoredEmail(email: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('where_email', email)
  }
}