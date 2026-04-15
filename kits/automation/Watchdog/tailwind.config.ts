import type { Config } from "tailwindcss";

const config: Config = {
  // 1. Tell Tailwind to scan your Watchdog files
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
};
export default config;