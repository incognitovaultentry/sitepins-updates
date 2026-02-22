import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/app/lib/admin-auth'

export const runtime = 'edge'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''
const REPO_OWNER = 'incognitovaultentry'
const REPO_NAME = 'sitepins-updates'
const BRANCH = 'main'

async function getFileSha(filePath: string): Promise<string | null> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`,
    {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
      },
    }
  )
  if (!res.ok) return null
  const data = await res.json() as { sha: string }
  return data.sha
}

// UPDATE changelog
export async function PUT(request: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  if (!await isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!GITHUB_TOKEN) {
    return NextResponse.json({ error: 'GitHub token not configured' }, { status: 500 })
  }

  const { filename } = await params
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

  const filePath = `changelog/${filename}`
  const sha = await getFileSha(filePath)
  if (!sha) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  const frontmatter = `---
date: ${date || new Date().toISOString().split('T')[0]}
title: "${title}"
tags: ${tags && tags.length > 0 ? `[${tags.join(', ')}]` : '[]'}${image ? `\nimage: ${image}` : ''}
---

${content.trim()}
`

  try {
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
          message: `Update changelog: ${title}`,
          content: btoa(unescape(encodeURIComponent(frontmatter))),
          sha,
          branch: BRANCH,
        }),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      console.error('GitHub API error:', err)
      return NextResponse.json({ error: 'Failed to update file' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Changelog update error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// DELETE changelog
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  if (!await isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!GITHUB_TOKEN) {
    return NextResponse.json({ error: 'GitHub token not configured' }, { status: 500 })
  }

  const { filename } = await params
  const filePath = `changelog/${filename}`
  const sha = await getFileSha(filePath)
  if (!sha) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Delete changelog: ${filename}`,
          sha,
          branch: BRANCH,
        }),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      console.error('GitHub API error:', err)
      return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Changelog delete error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
