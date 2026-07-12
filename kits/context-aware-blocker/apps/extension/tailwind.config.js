/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.{html,js}", "./components/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#0a0a0a',        // True black background
          card: '#151515',      // Dark charcoal for cards
          cardHover: '#1f1f1f', // Slightly lighter for hover states
          primary: '#e83a3a',   // Lamatic Official Red
          primaryHover: '#f94f4f',
          text: '#f8fafc',      // Primary white text
          textMuted: '#94a3b8', // Secondary grey text
          border: 'rgba(232, 58, 58, 0.2)' // Red border for cards
        }
      },
      borderRadius: {
        'brand': '1.5rem',      // Very rounded corners (24px) for cards
        'pill': '9999px',       // Pill shaped buttons
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'], // Clean modern font
      }
    },
  },
  plugins: [],
}
