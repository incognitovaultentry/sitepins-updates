import { NextRequest, NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

interface FeedbackRow {
  id: number
  title: string
  details: string | null
  type: string
  status: string
  upvotes: number
  created_at: string
}

async function sendFeedbackEmail(apiKey: string, type: string, title: string, details: string, createdAt: string) {
  if (!apiKey) return

  const body = `
New feedback submitted on Sitepins Updates:

Type: ${type}
Title: ${title}
Details: ${details || '(no details provided)'}
Submitted at: ${createdAt}

—
Sitepins Updates
`.trim()

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Sitepins Feedback <feedback@sitepins.com>',
      to: ['hi@sitepins.com'],
      subject: `[Sitepins Feedback] New ${type}: ${title}`,
      text: body,
    }),
  })
}

function getDB(): D1Database | null {
  try {
    const ctx = getRequestContext()
    return (ctx.env.DB as D1Database) ?? null
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const db = getDB()
  if (!db) {
    return NextResponse.json({ feedback: [], setup_required: true }, { status: 200 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') // optional filter by status
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 50)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  try {
    let countQuery: string
    let dataQuery: string

    if (status) {
      countQuery = `SELECT COUNT(*) as total FROM feedback WHERE status = '${status}'`
      dataQuery = `SELECT id, title, details, type, status, upvotes, created_at FROM feedback WHERE status = '${status}' ORDER BY upvotes DESC, created_at DESC LIMIT ${limit} OFFSET ${offset}`
    } else {
      countQuery = `SELECT COUNT(*) as total FROM feedback`
      dataQuery = `SELECT id, title, details, type, status, upvotes, created_at FROM feedback ORDER BY upvotes DESC, created_at DESC LIMIT ${limit} OFFSET ${offset}`
    }

    const [countResult, dataResult] = await Promise.all([
      db.prepare(countQuery).first<{ total: number }>(),
      db.prepare(dataQuery).all<FeedbackRow>(),
    ])

    const total = countResult?.total ?? 0
    const feedback = dataResult.results ?? []

    return NextResponse.json({
      feedback,
      total,
      hasMore: offset + feedback.length < total,
      offset,
      limit,
    })
  } catch (err) {
    console.error('GET /api/feedback error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const db = getDB()
  if (!db) {
    return NextResponse.json({ error: 'Database not configured. See setup instructions.' }, { status: 503 })
  }

  try {
    const body = await request.json() as { title?: string; details?: string; type?: string }
    const { title, details = '', type = 'Other' } = body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const validTypes = ['Feature Request', 'Bug', 'Improvement', 'Other']
    const safeType = validTypes.includes(type) ? type : 'Other'
    const safeTitle = title.trim().slice(0, 120)
    const safeDetails = (details ?? '').toString().trim().slice(0, 2000)
    const createdAt = new Date().toISOString()

    const result = await db.prepare(
      'INSERT INTO feedback (title, details, type, status, upvotes, created_at) VALUES (?, ?, ?, ?, ?, ?) RETURNING id'
    ).bind(safeTitle, safeDetails, safeType, 'open', 0, createdAt).first<{ id: number }>()

    // Get API key inside request context BEFORE fire-and-forget
    let resendKey = process.env.RESEND_API_KEY ?? ''
    if (!resendKey) {
      try {
        const ctx = getRequestContext()
        resendKey = (ctx.env as unknown as Record<string, string>).RESEND_API_KEY ?? ''
      } catch {}
    }
    await sendFeedbackEmail(resendKey, safeType, safeTitle, safeDetails, createdAt).catch(console.error)

    return NextResponse.json({ id: result?.id, success: true }, { status: 201 })
  } catch (err) {
    console.error('POST /api/feedback error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
