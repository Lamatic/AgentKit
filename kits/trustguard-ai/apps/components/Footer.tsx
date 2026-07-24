// components/Footer.tsx
"use client";

import { motion } from "framer-motion";

/**
 * Application footer displayed at the bottom of every page.
 *
 * Renders a row of technology attribution links (Next.js, Tailwind CSS,
 * Lamatic AI, Gemini) alongside a copyright notice.  Animates in after the
 * rest of the page content with a 0.6 s delay to avoid competing with
 * primary interactive elements during load.
 *
 * @returns An animated `<footer>` element with tech attribution and copyright.
 */
export default function Footer() {
  return (
    <motion.footer
      className="mt-24 border-t border-white/[0.06] py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6, duration: 0.6 }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap justify-center sm:justify-start">
          <span>Built with</span>
          <span className="text-slate-400 font-medium">Next.js</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400 font-medium">Tailwind CSS</span>
          <span className="text-slate-600">·</span>
          <a
            href="https://lamatic.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent-cyan)] font-medium hover:text-[var(--accent-cyan)]/80 transition-colors"
          >
            Lamatic AI
          </a>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400 font-medium">Gemini</span>
        </p>

        <p className="text-xs text-slate-600">
          TrustGuard AI &copy; {new Date().getFullYear()}
        </p>
      </div>
    </motion.footer>
  );
}
