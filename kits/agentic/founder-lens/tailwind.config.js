/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        aurora: {
          1: "var(--aurora-1)",
          2: "var(--aurora-2)",
          3: "var(--aurora-3)",
          4: "var(--aurora-4)",
        }
      },
      backgroundImage: {
        'dot-grid': 'radial-gradient(circle at center, rgba(255,255,255,0.15) 1px, transparent 1px)',
      },
      backgroundSize: {
        'dot': '24px 24px',
      },
      animation: {
        'aurora-wave': 'aurora 15s ease-in-out infinite alternate',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        aurora: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        }
      }
    },
  },
  plugins: [],
};
