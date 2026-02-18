'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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

interface ColumnState {
  items: Feedback[]
  total: number
  offset: number
  hasMore: boolean
  loading: boolean
  initialized: boolean
}

const COLUMNS = [
  { id: 'open',      label: 'Open',         emoji: '📬', color: 'border-t-blue-400' },
  { id: 'planned',   label: 'Planned',       emoji: '🗓️', color: 'border-t-purple-400' },
  { id: 'building',  label: 'Building Now',  emoji: '🔨', color: 'border-t-orange-400' },
  { id: 'completed', label: 'Completed',     emoji: '✅', color: 'border-t-green-400' },
] as const

const PAGE_SIZE = 10
const LOCALSTORAGE_KEY = 'sitepins-upvoted'

const defaultColumnState = (): ColumnState => ({
  items: [], total: 0, offset: 0, hasMore: true, loading: false, initialized: false,
})

export default function FeedbackBoard() {
  const [columns, setColumns] = useState<Record<string, ColumnState>>({
    open: defaultColumnState(),
    planned: defaultColumnState(),
    building: defaultColumnState(),
    completed: defaultColumnState(),
  })
  const [showModal, setShowModal] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [upvoted, setUpvoted] = useState<Set<number>>(new Set())
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [dbSetupRequired, setDbSetupRequired] = useState(false)

  const sentinelRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCALSTORAGE_KEY)
      if (stored) setUpvoted(new Set(JSON.parse(stored) as number[]))
    } catch {}
  }, [])

  const fetchMore = useCallback(async (status: string, explicitOffset?: number) => {
    setColumns(prev => {
      const col = prev[status]
      if (col.loading || (!col.hasMore && explicitOffset === undefined)) return prev
      return { ...prev, [status]: { ...col, loading: true } }
    })

    try {
      const col = columns[status]
      const offset = explicitOffset ?? col.offset
      const res = await fetch(`/api/feedback?status=${status}&limit=${PAGE_SIZE}&offset=${offset}`)
      if (!res.ok) return

      const data = await res.json() as {
        feedback: Feedback[]
        total: number
        hasMore: boolean
        setup_required?: boolean
      }

      if (data.setup_required) setDbSetupRequired(true)

      setColumns(prev => {
        const existing = prev[status]
        const existingIds = new Set(existing.items.map(i => i.id))
        const newItems = (data.feedback ?? []).filter(i => !existingIds.has(i.id))
        return {
          ...prev,
          [status]: {
            items: [...existing.items, ...newItems],
            total: data.total ?? existing.total,
            offset: (explicitOffset ?? existing.offset) + (data.feedback?.length ?? 0),
            hasMore: data.hasMore,
            loading: false,
            initialized: true,
          },
        }
      })
    } catch {
      setColumns(prev => ({
        ...prev,
        [status]: { ...prev[status], loading: false, initialized: true },
      }))
    }
  }, [columns])

  // Initial load for all columns
  useEffect(() => {
    COLUMNS.forEach(col => {
      if (!columns[col.id].initialized && !columns[col.id].loading) {
        fetchMore(col.id)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // IntersectionObserver for each column sentinel
  useEffect(() => {
    const observers: IntersectionObserver[] = []

    COLUMNS.forEach(col => {
      const sentinel = sentinelRefs.current[col.id]
      if (!sentinel) return

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setColumns(prev => {
              const c = prev[col.id]
              if (!c.loading && c.hasMore && c.initialized) {
                fetchMore(col.id)
              }
              return prev
            })
          }
        },
        { threshold: 0.1 }
      )
      observer.observe(sentinel)
      observers.push(observer)
    })

    return () => observers.forEach(o => o.disconnect())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns])

  const handleUpvote = useCallback(async (id: number) => {
    try {
      await fetch(`/api/feedback/${id}/upvote`, { method: 'POST' })
      const newUpvoted = new Set(upvoted).add(id)
      setUpvoted(newUpvoted)
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(Array.from(newUpvoted)))
      setColumns(prev => {
        const updated = { ...prev }
        for (const status of Object.keys(updated)) {
          updated[status] = {
            ...updated[status],
            items: updated[status].items.map(f =>
              f.id === id ? { ...f, upvotes: f.upvotes + 1 } : f
            ),
          }
        }
        return updated
      })
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
    // Reset open column and reload from offset 0
    setColumns(prev => ({ ...prev, open: { ...defaultColumnState(), loading: true } }))
    const res2 = await fetch(`/api/feedback?status=open&limit=${PAGE_SIZE}&offset=0`)
    if (res2.ok) {
      const data = await res2.json() as { feedback: Feedback[]; total: number; hasMore: boolean }
      setColumns(prev => ({
        ...prev,
        open: {
          items: data.feedback ?? [],
          total: data.total ?? 0,
          offset: data.feedback?.length ?? 0,
          hasMore: data.hasMore,
          loading: false,
          initialized: true,
        },
      }))
    }
  }

  const allInitialized = COLUMNS.every(c => columns[c.id].initialized)

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
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

      {dbSetupRequired && (
        <div className="mb-6 px-4 py-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Database setup pending — feedback will appear once D1 is configured.
        </div>
      )}

      {submitSuccess && (
        <div className="mb-6 px-4 py-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          Thanks! Your feedback has been submitted.
        </div>
      )}

      {/* Kanban */}
      {!allInitialized ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {COLUMNS.map(col => (
            <div key={col.id} className="bg-slate-100 dark:bg-slate-800 rounded-2xl h-64 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-start">
          {COLUMNS.map(col => {
            const state = columns[col.id]
            return (
              <div key={col.id} className={`bg-slate-100 dark:bg-slate-800/50 rounded-2xl border-t-4 ${col.color} overflow-hidden`}>
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{col.emoji}</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{col.label}</span>
                  </div>
                  <span className="text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full px-2 py-0.5">
                    {state.total || state.items.length}
                  </span>
                </div>

                <div className="px-3 pb-3 space-y-2 max-h-[400px] sm:max-h-[600px] overflow-y-auto">
                  {state.items.length === 0 && !state.loading ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-8">No items yet</p>
                  ) : (
                    state.items.map(item => (
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

                  {/* Sentinel for infinite scroll */}
                  {state.hasMore && (
                    <div
                      ref={el => { sentinelRefs.current[col.id] = el }}
                      className="py-2 flex justify-center"
                    >
                      {state.loading && (
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <FeedbackModal onClose={() => setShowModal(false)} onSubmit={handleSubmit} />
      )}

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
