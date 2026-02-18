import fs from 'fs'
import path from 'path'
import ChangelogList from '../components/ChangelogList'

export interface ChangelogEntry {
  date: string
  title: string
  details: string
  image?: string
  tags?: string[]
}

function getChangelogEntries(): ChangelogEntry[] {
  const dir = path.join(process.cwd(), 'changelog')
  if (!fs.existsSync(dir)) return []
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse()

  return files.map(file => {
    const content = fs.readFileSync(path.join(dir, file), 'utf-8')
    return JSON.parse(content) as ChangelogEntry
  })
}

export default function ChangelogPage() {
  const entries = getChangelogEntries()

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Changelog</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm">
          Track what we&apos;ve shipped and what&apos;s new in Sitepins.
        </p>
      </div>
      <ChangelogList entries={entries} />
    </div>
  )
}
