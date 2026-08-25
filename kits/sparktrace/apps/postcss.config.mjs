/**
 * Tailwind v4 compiles through PostCSS — without this config the
 * `@import "tailwindcss"` in app/globals.css is never expanded and the
 * app builds successfully but ships with no utility CSS at all.
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
