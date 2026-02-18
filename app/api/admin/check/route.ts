import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/app/lib/admin-auth'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const authed = await isAuthenticated(request)
  return NextResponse.json({ authenticated: authed })
}
