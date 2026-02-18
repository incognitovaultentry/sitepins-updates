'use client'

interface Feedback {
  id: number
  title: string
  details?: string
  type: string
  status: string
  upvotes: number
  created_at: string
}

interface FeedbackDetailModalProps {
  feedback: Feedback
  hasUpvoted: boolean
  onClose: () => void
  onUpvote: (id: number) => void
}

const TYPE_STYLES: Record<string, string> = {
  'Bug': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  'Feature Request': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  'Improvement': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  'Other': 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  'open': { label: 'Open', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
  'planned': { label: 'Planned', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' },
  'building': { label: 'Building Now', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' },
  'completed': { label: 'Completed', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
}

export default function FeedbackDetailModal({ feedback, hasUpvoted, onClose, onUpvote }: FeedbackDetailModalProps) {
  const typeStyle = TYPE_STYLES[feedback.type] ?? TYPE_STYLES['Other']
  const statusInfo = STATUS_LABELS[feedback.status] ?? STATUS_LABELS['open']

  const formattedDate = new Date(feedback.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${typeStyle}`}>
              {feedback.type}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg p-1 shrink-0 ml-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 leading-snug mb-3">
            {feedback.title}
          </h2>

          {feedback.details ? (
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
              {feedback.details}
            </p>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500 italic">No additional details provided.</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-xs text-slate-400 dark:text-slate-500">{formattedDate}</span>

          <button
            onClick={() => { if (!hasUpvoted) onUpvote(feedback.id) }}
            disabled={hasUpvoted}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              hasUpvoted
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 cursor-default'
                : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill={hasUpvoted ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 19V5M5 12l7-7 7 7"/>
            </svg>
            <span>{feedback.upvotes} {hasUpvoted ? 'Upvoted' : 'Upvote'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
