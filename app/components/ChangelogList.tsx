'use client'

import type { ChangelogEntry } from '../changelog/page'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Image from 'next/image'

interface Props {
  entries: ChangelogEntry[]
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function ChangelogList({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400 dark:text-slate-500">
        <p className="text-5xl mb-4">📋</p>
        <p className="text-sm">No changelog entries yet.</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700 ml-[calc(120px+1.5rem)] hidden md:block" />

      <div className="space-y-12">
        {entries.map((entry, i) => (
          <div key={i} className="flex flex-col md:flex-row gap-4 md:gap-8">
            {/* Date */}
            <div className="md:w-[120px] shrink-0 pt-0.5">
              <time className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide whitespace-nowrap">
                {formatDate(entry.date)}
              </time>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 md:pl-8 relative">
              {/* Timeline dot */}
              <div className="absolute -left-[1.5rem] top-2 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-white dark:ring-slate-900 hidden md:block" />

              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Image (optional) */}
                {entry.image && (
                  <div className="relative w-full h-48 sm:h-64 bg-slate-100 dark:bg-slate-700">
                    <img
                      src={entry.image}
                      alt={entry.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-6">
                  {/* Tags */}
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {entry.tags.map(tag => (
                        <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">{entry.title}</h2>

                  <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300
                    prose-headings:text-slate-900 dark:prose-headings:text-slate-100
                    prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                    prose-code:bg-slate-100 dark:prose-code:bg-slate-700 prose-code:rounded prose-code:px-1 prose-code:text-sm
                    prose-pre:bg-slate-100 dark:prose-pre:bg-slate-700">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.details}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
