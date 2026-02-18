import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, getAdminPassword } from '@/app/lib/admin-auth'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  const { password } = await request.json() as { password?: string }
  const adminPassword = getAdminPassword()

  if (!adminPassword) {
    return NextResponse.json({ error: 'Admin not configured' }, { status: 500 })
  }
  if (!password || password !== adminPassword) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const token = await hashPassword(adminPassword)
  const response = NextResponse.json({ success: true })
  response.cookies.set('sp_admin', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
  return response
}
