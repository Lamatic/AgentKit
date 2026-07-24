// components/Header.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Github } from "lucide-react";

/**
 * Sticky top navigation header for the TrustGuard AI application.
 *
 * Renders the TrustGuard logo and name on the left, a centred title block
 * (hidden on mobile), and external links to the GitHub repository and the
 * Lamatic AI website on the right.  Slides down from the top of the viewport
 * on initial mount with a smooth easing transition.
 *
 * @returns A sticky animated `<header>` element with brand identity and
 *   navigation links.
 */
export default function Header() {
  const [logoFailed, setLogoFailed] = useState(false);

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
        <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 flex-col items-center">
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
            <Github className="h-4 w-4 text-slate-300" aria-hidden="true" />
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
            {!logoFailed ? (
              <Image
                src="/lamatic-logo.png"
                alt="Lamatic AI"
                width={68}
                height={20}
                className="object-contain h-5 w-auto"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <span className="lamatic-text-fallback text-xs font-semibold text-cyan-400">
                Lamatic
              </span>
            )}
          </a>
        </div>
      </div>
    </motion.header>
  );
}
