import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sitepins: {
          blue: '#3B82F6',
          dark: '#0F172A',
          gray: '#64748B',
        },
      },
    },
  },
  plugins: [],
}

export default config
