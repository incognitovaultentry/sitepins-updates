import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function GET() {
  let apiKey = process.env.RESEND_API_KEY ?? ''
  try {
    const ctx = getRequestContext()
    const ctxKey = (ctx.env as Record<string, string>).RESEND_API_KEY
    if (ctxKey) apiKey = ctxKey
  } catch {}

  if (!apiKey) {
    return NextResponse.json({ error: 'No API key', process_env_keys: Object.keys(process.env) })
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Sitepins Feedback <feedback@sitepins.com>',
      to: ['hi@sitepins.com'],
      subject: '[Sitepins] Test email from edge',
      text: 'Test from Cloudflare edge runtime',
    }),
  })

  const data = await res.json()
  return NextResponse.json({ status: res.status, resend: data, key_length: apiKey.length })
}
