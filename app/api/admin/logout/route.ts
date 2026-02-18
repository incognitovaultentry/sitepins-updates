import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.set('sp_admin', '', { maxAge: 0, path: '/' })
  return response
}
