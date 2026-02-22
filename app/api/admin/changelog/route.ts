import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/app/lib/admin-auth'

export const runtime = 'edge'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''
const REPO_OWNER = 'incognitovaultentry'
const REPO_NAME = 'sitepins-updates'
const BRANCH = 'main'

export async function GET(request: NextRequest) {
  if (!await isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!GITHUB_TOKEN) {
    return NextResponse.json({ error: 'GitHub token not configured' }, { status: 500 })
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/changelog`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
        },
      }
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to list changelogs' }, { status: 500 })
    }

    const files = await res.json() as Array<{ name: string; sha: string; path: string; download_url: string }>
    const mdFiles = files.filter(f => f.name.endsWith('.md'))

    // Fetch content for each file
    const changelogs = await Promise.all(
      mdFiles.map(async (f) => {
        try {
          const contentRes = await fetch(f.download_url)
          const raw = await contentRes.text()

          // Parse frontmatter
          const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
          let title = f.name
          let date = ''
          let tags: string[] = []
          let image = ''
          let content = raw

          if (fmMatch) {
            const fm = fmMatch[1]
            content = fmMatch[2].trim()
            const titleMatch = fm.match(/title:\s*"?([^"\n]*)"?/)
            const dateMatch = fm.match(/date:\s*(.+)/)
            const tagsMatch = fm.match(/tags:\s*\[([^\]]*)\]/)
            const imageMatch = fm.match(/image:\s*(.+)/)
            if (titleMatch) title = titleMatch[1]
            if (dateMatch) date = dateMatch[1].trim()
            if (tagsMatch) tags = tagsMatch[1].split(',').map(t => t.trim()).filter(Boolean)
            if (imageMatch) image = imageMatch[1].trim()
          }

          return { filename: f.name, sha: f.sha, title, date, tags, image, content }
        } catch {
          return { filename: f.name, sha: f.sha, title: f.name, date: '', tags: [], image: '', content: '' }
        }
      })
    )

    changelogs.sort((a, b) => b.date.localeCompare(a.date))

    return NextResponse.json({ changelogs })
  } catch (err) {
    console.error('Changelog list error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

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
