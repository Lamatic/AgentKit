/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--canvas)",
        surface: "var(--surface)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        line: "var(--line)",
        teal: {
          DEFAULT: "var(--teal)",
          soft: "var(--teal-soft)",
        },
        brass: {
          DEFAULT: "var(--brass)",
          soft: "var(--brass-soft)",
        },
        clay: "var(--clay)",
      },
      fontFamily: {
        sans: "var(--font-sans)",
        serif: "var(--font-serif)",
        mono: "var(--font-mono)",
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};
