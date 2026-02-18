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

async function sendFeedbackEmail(type: string, title: string, details: string, createdAt: string) {
  const apiKey = (process.env.RESEND_API_KEY as string) ?? ''
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
      from: 'Sitepins Updates <updates@sitepins.com>',
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

export async function GET() {
  const db = getDB()
  if (!db) {
    return NextResponse.json({ feedback: [], setup_required: true }, { status: 200 })
  }

  try {
    const result = await db.prepare(
      'SELECT id, title, details, type, status, upvotes, created_at FROM feedback ORDER BY created_at DESC'
    ).all<FeedbackRow>()

    return NextResponse.json({ feedback: result.results ?? [] })
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

    // Fire-and-forget email notification
    sendFeedbackEmail(safeType, safeTitle, safeDetails, createdAt).catch(console.error)

    return NextResponse.json({ id: result?.id, success: true }, { status: 201 })
  } catch (err) {
    console.error('POST /api/feedback error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
