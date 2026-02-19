import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/app/lib/admin-auth'

export const runtime = 'edge'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''
const REPO_OWNER = 'incognitovaultentry'
const REPO_NAME = 'sitepins-updates'
const BRANCH = 'main'

export async function POST(request: NextRequest) {
  if (!await isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!GITHUB_TOKEN) {
    return NextResponse.json({ error: 'GitHub token not configured' }, { status: 500 })
  }

  const { title, content, tags, image, date } = await request.json() as {
    title?: string
    content?: string
    tags?: string[]
    image?: string
    date?: string
  }

  if (!title || !content) {
    return NextResponse.json({ error: 'Title and content required' }, { status: 400 })
  }

  const slug = title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)

  const fileName = `${date || new Date().toISOString().split('T')[0]}-${slug}.md`
  const filePath = `changelog/${fileName}`

  const frontmatter = `---
date: ${date || new Date().toISOString().split('T')[0]}
title: "${title}"
tags: ${tags && tags.length > 0 ? `[${tags.join(', ')}]` : '[]'}${image ? `\nimage: ${image}` : ''}
---

${content.trim()}
`

  try {
    // Create file via GitHub API
    const res = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Add changelog: ${title}`,
          content: Buffer.from(frontmatter).toString('base64'),
          branch: BRANCH,
        }),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      console.error('GitHub API error:', err)
      return NextResponse.json({ error: 'Failed to create file' }, { status: 500 })
    }

    return NextResponse.json({ success: true, fileName })
  } catch (err) {
    console.error('Changelog creation error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
