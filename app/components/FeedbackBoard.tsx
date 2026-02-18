'use client'

import { useState, useEffect, useCallback } from 'react'
import FeedbackCard from './FeedbackCard'
import FeedbackModal from './FeedbackModal'
import FeedbackDetailModal from './FeedbackDetailModal'

interface Feedback {
  id: number
  title: string
  details?: string
  type: string
  status: string
  upvotes: number
  created_at: string
}

const COLUMNS = [
  { id: 'open', label: 'Open', emoji: '📬', color: 'border-t-blue-400' },
  { id: 'planned', label: 'Planned', emoji: '🗓️', color: 'border-t-purple-400' },
  { id: 'building', label: 'Building Now', emoji: '🔨', color: 'border-t-orange-400' },
  { id: 'completed', label: 'Completed', emoji: '✅', color: 'border-t-green-400' },
] as const

const LOCALSTORAGE_KEY = 'sitepins-upvoted'

export default function FeedbackBoard() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [upvoted, setUpvoted] = useState<Set<number>>(new Set())
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [dbSetupRequired, setDbSetupRequired] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCALSTORAGE_KEY)
      if (stored) {
        setUpvoted(new Set(JSON.parse(stored) as number[]))
      }
    } catch {}
  }, [])

  const fetchFeedback = useCallback(async () => {
    try {
      const res = await fetch('/api/feedback')
      if (res.ok) {
        const data = await res.json() as { feedback: Feedback[]; setup_required?: boolean }
        setFeedback(data.feedback ?? [])
        if (data.setup_required) setDbSetupRequired(true)
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchFeedback()
  }, [fetchFeedback])

  const handleUpvote = useCallback(async (id: number) => {
    try {
      await fetch(`/api/feedback/${id}/upvote`, { method: 'POST' })
      const newUpvoted = new Set(upvoted).add(id)
      setUpvoted(newUpvoted)
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(Array.from(newUpvoted)))
      // Update count in local state
      setFeedback(prev => prev.map(f => f.id === id ? { ...f, upvotes: f.upvotes + 1 } : f))
      // Update selectedFeedback if open
      setSelectedFeedback(prev => prev?.id === id ? { ...prev, upvotes: prev.upvotes + 1 } : prev)
    } catch {}
  }, [upvoted])

  const handleSubmit = async (data: { title: string; details: string; type: string }) => {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to submit')
    setSubmitSuccess(true)
    setTimeout(() => setSubmitSuccess(false), 4000)
    await fetchFeedback()
  }

  const byStatus = (status: string) =>
    feedback
      .filter(f => f.status === status)
      .sort((a, b) => b.upvotes - a.upvotes)

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Feedback Board</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm">
            Share ideas, report bugs, and vote on what matters most.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="shrink-0 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Feedback
        </button>
      </div>

      {/* DB setup banner */}
      {dbSetupRequired && (
        <div className="mb-6 px-4 py-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Database setup pending — feedback will appear once D1 is configured.
        </div>
      )}

      {/* Success banner */}
      {submitSuccess && (
        <div className="mb-6 px-4 py-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Thanks! Your feedback has been submitted.
        </div>
      )}

      {/* Kanban grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map(col => (
            <div key={col.id} className="bg-slate-100 dark:bg-slate-800 rounded-2xl h-64 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map(col => {
            const items = byStatus(col.id)
            return (
              <div key={col.id} className={`bg-slate-100 dark:bg-slate-800/50 rounded-2xl border-t-4 ${col.color} overflow-hidden`}>
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{col.emoji}</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{col.label}</span>
                  </div>
                  <span className="text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full px-2 py-0.5">
                    {items.length}
                  </span>
                </div>

                <div className="px-3 pb-3 space-y-2 kanban-col">
                  {items.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-8">No items yet</p>
                  ) : (
                    items.map(item => (
                      <FeedbackCard
                        key={item.id}
                        id={item.id}
                        title={item.title}
                        details={item.details}
                        type={item.type}
                        upvotes={item.upvotes}
                        hasUpvoted={upvoted.has(item.id)}
                        onUpvote={handleUpvote}
                        onClick={() => setSelectedFeedback(item)}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Submit modal */}
      {showModal && (
        <FeedbackModal
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}

      {/* Detail modal */}
      {selectedFeedback && (
        <FeedbackDetailModal
          feedback={selectedFeedback}
          hasUpvoted={upvoted.has(selectedFeedback.id)}
          onClose={() => setSelectedFeedback(null)}
          onUpvote={handleUpvote}
        />
      )}
    </div>
  )
}
