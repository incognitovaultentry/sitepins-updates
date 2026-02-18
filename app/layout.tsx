import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Nav from './components/Nav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sitepins Roadmap, Feedback and Changelog',
  description: 'Public feedback board and changelog for Sitepins',
  openGraph: {
    title: 'Sitepins Roadmap, Feedback and Changelog',
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
      </body>
    </html>
  )
}
