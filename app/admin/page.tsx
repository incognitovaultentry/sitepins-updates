'use client'

import { useEffect, useState, useCallback } from 'react'

const STATUSES = ['open', 'planned', 'building', 'completed'] as const
type Status = typeof STATUSES[number]

const STATUS_LABELS: Record<Status, string> = {
  open: '📬 Open',
  planned: '🗓️ Planned',
  building: '🔨 Building',
  completed: '✅ Completed',
}

const STATUS_COLORS: Record<Status, string> = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  planned: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  building: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
}

interface Feedback {
  id: number
  title: string
  details: string | null
  type: string
  status: Status
  upvotes: number
  created_at: string
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<Status | 'all'>('all')
  const [updating, setUpdating] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  // Check auth on mount
  useEffect(() => {
    fetch('/api/admin/check')
      .then(r => r.json())
      .then(d => setAuthed((d as { authenticated: boolean }).authenticated))
      .catch(() => setAuthed(false))
  }, [])

  const loadFeedback = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/feedback')
      if (res.status === 401) { setAuthed(false); return }
      const data = await res.json() as { feedback: Feedback[] }
      setFeedback(data.feedback ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authed) loadFeedback()
  }, [authed, loadFeedback])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        setAuthed(true)
      } else {
        setLoginError('Wrong password. Try again.')
      }
    } catch {
      setLoginError('Something went wrong.')
    } finally {
      setLoginLoading(false)
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    setAuthed(false)
    setFeedback([])
  }

  async function handleStatusChange(id: number, newStatus: Status) {
    setUpdating(id)
    try {
      await fetch(`/api/admin/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      setFeedback(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f))
    } finally {
      setUpdating(null)
    }
  }

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setDeleting(id)
    try {
      await fetch(`/api/admin/feedback/${id}`, { method: 'DELETE' })
      setFeedback(prev => prev.filter(f => f.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  // Loading state
  if (authed === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  // Login form
  if (!authed) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Admin Panel</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Enter the admin password to continue</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                autoFocus
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {loginError && <p className="text-sm text-red-500">{loginError}</p>}
              <button
                type="submit"
                disabled={loginLoading || !password}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
              >
                {loginLoading ? 'Checking…' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  const filtered = feedback
    .filter(f => filter === 'all' || f.status === filter)
    .filter(f => !search || f.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Panel</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{feedback.length} total items</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search…"
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-48"
        />
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            All ({feedback.length})
          </button>
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              {STATUS_LABELS[s].split(' ')[1]} ({feedback.filter(f => f.status === s).length})
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400 w-8">#</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Title</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400 w-28">Type</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400 w-10">👍</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400 w-44">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">No items found</td>
                </tr>
              ) : filtered.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 text-slate-400 text-xs">{item.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 dark:text-white leading-snug">{item.title}</div>
                    {item.details && (
                      <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{item.details}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{item.type}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{item.upvotes}</td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <select
                        value={item.status}
                        disabled={updating === item.id}
                        onChange={e => handleStatusChange(item.id, e.target.value as Status)}
                        className={`appearance-none pl-2 pr-6 py-1 rounded-md text-xs font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${STATUS_COLORS[item.status]} ${updating === item.id ? 'opacity-50' : ''}`}
                      >
                        {STATUSES.map(s => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                      {updating === item.id && (
                        <span className="ml-2 text-xs text-slate-400">saving…</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      disabled={deleting === item.id}
                      className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50 transition-colors"
                    >
                      {deleting === item.id ? '…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
