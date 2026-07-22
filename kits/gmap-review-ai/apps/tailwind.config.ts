import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    // Add this to make sure Tailwind sees your components folder outside the app folder
    "./src/**/*.{js,ts,jsx,tsx,mdx}", 
  ],
  theme: {
    extend: {
      colors: {
        // Ensuring teal matches your Apex Velocity design
        teal: {
          400: "#2dd4bf",
        },
      },
      // This part makes the "prose" classes look high-end on black
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '100ch', // Better readability width
          },
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    // Add animations plugin if you want the fade-in effects to work
    require("tailwindcss-animate"), 
  ],
};

export default config;