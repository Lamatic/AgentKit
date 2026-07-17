import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#12141A",
        panel: "#1B1E27",
        border: "#2A2E3A",
        ink: "#E4E6EB",
        muted: "#7D8394",
        bull: "#4FAE8A",
        bear: "#C4574B",
        signal: "#D8A657",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
};

export default config;
