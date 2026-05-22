import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'ja-bg': 'var(--ja-bg)',
        'ja-bg2': 'var(--ja-bg2)',
        'ja-bg3': 'var(--ja-bg3)',
        'ja-text': 'var(--ja-text)',
        'ja-text2': 'var(--ja-text2)',
        'ja-text3': 'var(--ja-text3)',
        'ja-accent': 'var(--ja-accent)',
        'ja-accent-hover': 'var(--ja-accent-hover)',
        'ja-green': 'var(--ja-green)',
        'ja-border': 'var(--ja-border)',
      },
    },
  },
  plugins: [],
}

export default config
