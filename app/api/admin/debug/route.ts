import { NextRequest, NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  let ctxEnvKeys: string[] = []
  let ctxError = ''
  let processEnvHasIt = !!process.env.ADMIN_PASSWORD

  try {
    const ctx = getRequestContext()
    ctxEnvKeys = Object.keys(ctx.env)
    const pw = (ctx.env as unknown as Record<string, string>).ADMIN_PASSWORD
    return NextResponse.json({
      ctxEnvKeys,
      hasAdminPassword: !!pw,
      passwordLength: pw?.length ?? 0,
      processEnvHasIt,
    })
  } catch (e) {
    ctxError = String(e)
    return NextResponse.json({ ctxError, processEnvHasIt, ctxEnvKeys })
  }
}
