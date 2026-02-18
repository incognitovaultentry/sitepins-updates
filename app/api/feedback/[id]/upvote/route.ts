import { NextRequest, NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

function getDB(): D1Database | null {
  try {
    const ctx = getRequestContext()
    return (ctx.env.DB as D1Database) ?? null
  } catch {
    return null
  }
}

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const db = getDB()
  if (!db) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  try {
    const { id: idStr } = await context.params
    const id = parseInt(idStr, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const result = await db.prepare(
      'UPDATE feedback SET upvotes = upvotes + 1 WHERE id = ?'
    ).bind(id).run()

    if (result.meta?.changes === 0) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('POST /api/feedback/[id]/upvote error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
