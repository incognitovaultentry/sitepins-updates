import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Nav from './components/Nav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sitepins Updates',
  description: 'Public feedback board and changelog for Sitepins',
  openGraph: {
    title: 'Sitepins Updates',
    description: 'Share feedback and track what we\'re building',
    url: 'https://updates.sitepins.com',
    siteName: 'Sitepins',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50`}>
        <Nav />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-200 dark:border-slate-800 mt-16 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>
            Built with ❤️ by{' '}
            <a href="https://sitepins.com" className="underline hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              Sitepins
            </a>
          </p>
        </footer>
      </body>
    </html>
  )
}
