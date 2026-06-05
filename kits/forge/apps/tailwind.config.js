/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'base': '#0c0c10',
        'surface': '#14141a',
        'elevated': '#1c1c24',
        'border-custom': '#2a2a35',
        'accent': '#6366f1',
        'accent-hover': '#4f52e0',
        'text-primary': '#f0f0f5',
        'text-secondary': '#8888a0',
        'text-muted': '#55556a',
        'success': '#22c55e',
        'danger': '#ef4444',
        'doc-bg': '#fafaf8',
        'doc-text': '#1a1a1a',
        aurora: {
          1: "#4f46e5", // Indigo
          2: "#0ea5e9", // Sky
          3: "#8b5cf6", // Violet
          4: "#ec4899", // Pink
        }
      },
      fontFamily: {
        sans: ['Google Sans', 'DM Sans', 'sans-serif'],
        serif: ['Lora', 'serif'],
      },
      borderRadius: {
        'card': '12px',
      },
      maxWidth: {
        'wizard': '680px',
        'document': '800px',
      },
      minHeight: {
        'btn': '44px',
      },
      animation: {
        'aurora-wave': 'aurora 15s ease-in-out infinite alternate',
      },
      keyframes: {
        aurora: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
      }
    },
  },
  plugins: [],
}
