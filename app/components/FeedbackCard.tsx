'use client'

import { useState } from 'react'

interface FeedbackCardProps {
  id: number
  title: string
  details?: string
  type: string
  upvotes: number
  hasUpvoted: boolean
  onUpvote: (id: number) => void
  onClick: () => void
}

const TYPE_STYLES: Record<string, string> = {
  'Bug': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  'Feature Request': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  'Improvement': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  'Other': 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
}

export default function FeedbackCard({ id, title, details, type, upvotes, hasUpvoted, onUpvote, onClick }: FeedbackCardProps) {
  const [optimisticCount, setOptimisticCount] = useState(upvotes)
  const [voted, setVoted] = useState(hasUpvoted)
  const [animating, setAnimating] = useState(false)

  const handleUpvote = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (voted) return
    setVoted(true)
    setOptimisticCount(prev => prev + 1)
    setAnimating(true)
    setTimeout(() => setAnimating(false), 400)
    onUpvote(id)
  }

  const typeStyle = TYPE_STYLES[type] ?? TYPE_STYLES['Other']

  return (
    <div
      className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all cursor-pointer"
      onClick={onClick}
    >
      {/* Type badge */}
      <div className="mb-2">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${typeStyle}`}>
          {type}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug mb-1.5">
        {title}
      </h3>

      {/* Details preview */}
      {details && (
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 mb-3">
          {details}
        </p>
      )}

      {/* Upvote */}
      <div className="flex items-center justify-end mt-2">
        <button
          onClick={handleUpvote}
          disabled={voted}
          title={voted ? 'Already upvoted' : 'Upvote'}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            voted
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 cursor-default'
              : 'text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
          } ${animating ? 'scale-110' : 'scale-100'}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill={voted ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 19V5M5 12l7-7 7 7"/>
          </svg>
          <span>{optimisticCount}</span>
        </button>
      </div>
    </div>
  )
}
