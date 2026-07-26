import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        p1: "#dc2626",
        p2: "#ea580c",
        p3: "#ca8a04",
        p4: "#16a34a"
      }
    }
  },
  plugins: []
};

export default config;