/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        parchment: "#EDE6D6",
        parchmentDark: "#E1D7BF",
        ink: "#1B2A4A",
        pine: "#1F3A3D",
        marigold: "#E8A33D",
        stamp: "#B23A2E",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        mono: ["var(--font-mono)"],
        body: ["var(--font-body)"],
      },
    },
  },
  plugins: [],
};
