// components/Header.tsx
"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function Header() {
  return (
    <motion.header
      className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-slate-950/80 backdrop-blur-xl"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left — TrustGuard Logo + Name */}
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 shrink-0">
            <Image
              src="/trustguard-logo.png"
              alt="TrustGuard AI Logo"
              fill
              sizes="36px"
              className="rounded-lg object-cover"
              priority
            />
          </div>
          <span className="hidden sm:block text-sm font-semibold text-white/80 tracking-wide">
            TrustGuard AI
          </span>
        </div>

        {/* Center — Title */}
        <div className="hidden sm absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
          <span className="text-base font-bold text-white tracking-tight">
            TrustGuard AI
          </span>
          <span className="text-[10px] text-cyan-400/80 tracking-widest uppercase font-medium">
            Fraud &amp; Scam Detector
          </span>
        </div>

        {/* Right — GitHub + Lamatic */}
        <div className="flex items-center gap-3">
          {/* GitHub icon */}
          <a
            href="https://github.com/Lamatic/AgentKit/tree/main/kits/trustguard-ai"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Repository"
            className="flex items-center justify-center h-8 w-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] transition-colors"
          >
            <svg
              className="h-4 w-4 text-slate-300"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
          </a>

          {/* Lamatic logo */}
          <a
            href="https://lamatic.ai"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Lamatic AI"
            className="flex items-center justify-center h-8 px-2 rounded-lg bg-white/[1.00] hover:bg-white/[0.80] border border-white/[0.08] transition-colors"
          >
            {/* Try to load user-supplied lamatic-logo.png, fall back to text */}
            <Image
              src="/lamatic-logo.png"
              alt="Lamatic AI"
              width={68}
              height={20}
              className="object-contain h-5 w-auto"
              onError={(e) => {
                // Hide broken image, show text fallback handled in JSX below
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <span className="lamatic-text-fallback text-xs font-semibold text-cyan-400 hidden">
              Lamatic
            </span>
          </a>
        </div>
      </div>
    </motion.header>
  );
}
