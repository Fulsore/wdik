'use client'
import { saveTokens, clearTokens, getMe } from './api'

export interface AuthUser {
  id: string
  email: string
  name: string
  lifestyle: string
  forget_type: string
  is_2fa_enabled: boolean
  referral_code: string
  referral_count: number
}

export async function loadUser(): Promise<AuthUser | null> {
  try {
    return await getMe()
  } catch {
    return null
  }
}

export function storeSession(tokens: { access: string; refresh: string }) {
  saveTokens(tokens.access, tokens.refresh)
}

export function endSession() {
  clearTokens()
}