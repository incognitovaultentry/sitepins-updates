import { NextRequest } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode('sp_admin_' + password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export function getAdminPassword(): string {
  try {
    const ctx = getRequestContext()
    return (ctx.env as unknown as Record<string, string>).ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD ?? ''
  } catch {
    return process.env.ADMIN_PASSWORD ?? ''
  }
}

export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const adminPassword = getAdminPassword()
  if (!adminPassword) return false
  const token = request.cookies.get('sp_admin')?.value
  if (!token) return false
  const expected = await hashPassword(adminPassword)
  return token === expected
}
