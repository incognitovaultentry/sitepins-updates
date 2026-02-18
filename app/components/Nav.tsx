'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { useState } from 'react'

const ExternalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 shrink-0">
    <path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
  </svg>
)

const navLinkClass = (active: boolean) =>
  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    active
      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
  }`

export default function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">

          {/* Logo */}
          <a href="https://sitepins.com" className="flex items-center hover:opacity-80 transition-opacity shrink-0">
            <div className="bg-slate-900 dark:bg-transparent px-2 py-1 rounded-lg">
              <Image src="/logo.svg" alt="Sitepins" width={80} height={25} priority />
            </div>
          </a>

          {/* Internal nav — always visible */}
          <nav className="flex items-center gap-1">
            <Link href="/" className={navLinkClass(pathname === '/')}>Roadmap</Link>
            <Link href="/changelog" className={navLinkClass(pathname === '/changelog')}>Changelog</Link>
          </nav>

          {/* Desktop external links */}
          <nav className="hidden sm:flex items-center gap-1">
            <a href="https://docs.sitepins.com" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800">
              Docs <ExternalIcon />
            </a>
            <a href="https://sitepins.com/contact" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800">
              Contact <ExternalIcon />
            </a>
          </nav>

          {/* Mobile hamburger — Docs + Contact only */}
          <button
            className="sm:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            onClick={() => setOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {open ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="sm:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-1">
          <a href="https://docs.sitepins.com" target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            Docs <ExternalIcon />
          </a>
          <a href="https://sitepins.com/contact" target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            Contact <ExternalIcon />
          </a>
        </div>
      )}
    </header>
  )
}
