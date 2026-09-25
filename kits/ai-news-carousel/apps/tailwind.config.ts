import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0B0B0F',
        surface: '#131318',
        surfaceHigh: '#1B1B23',
        border: '#26262F',
        ink: '#F2F1ED',
        inkMuted: '#8E8D9B',
        accent: '#7C5CFF',
        accentDim: '#A99FE0',
        pending: '#E8B84B',
        posted: '#5FD98A',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
