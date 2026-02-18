import { NextRequest, NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { isAuthenticated } from '@/app/lib/admin-auth'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  if (!await isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const ctx = getRequestContext()
    const db = ctx.env.DB as D1Database
    const { results } = await db.prepare(
      'SELECT id, title, details, type, status, upvotes, created_at FROM feedback ORDER BY created_at DESC'
    ).all()
    return NextResponse.json({ feedback: results })
  } catch (err) {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
