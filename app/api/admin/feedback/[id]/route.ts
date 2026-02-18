import { NextRequest, NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { isAuthenticated } from '@/app/lib/admin-auth'

export const runtime = 'edge'

const VALID_STATUSES = ['open', 'planned', 'building', 'completed']

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!await isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: idStr } = await context.params
  const id = parseInt(idStr)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const { status } = await request.json() as { status?: string }
  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  try {
    const ctx = getRequestContext()
    const db = ctx.env.DB as D1Database
    await db.prepare('UPDATE feedback SET status = ? WHERE id = ?').bind(status, id).run()
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!await isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: idStr } = await context.params
  const id = parseInt(idStr)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  try {
    const ctx = getRequestContext()
    const db = ctx.env.DB as D1Database
    await db.prepare('DELETE FROM feedback WHERE id = ?').bind(id).run()
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
