"use client";

import React from "react";

const GithubIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

const LinkedinIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.72a1.49 1.49 0 1 0 0 2.98 1.49 1.49 0 0 0 0-2.98z" />
  </svg>
);

export function Footer() {
  return (
    <footer className="py-12 border-t border-[#E2E2DF] bg-[#FFFFFF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: Logo & Title */}
        <button
          onClick={() => {
            const element = document.getElementById("hero-section");
            if (element) {
              element.scrollIntoView({ behavior: "smooth" });
            }
          }}
          className="flex items-center gap-3 cursor-pointer border-none bg-transparent p-0 text-left"
          aria-label="Scroll to top"
        >
          <div className="w-6 h-6 bg-[#FCDD2D] border border-[#0D0D0B] flex items-center justify-center font-mono text-[10px] font-bold text-[#0D0D0B]">
            SP
          </div>
          <span className="font-display font-bold text-sm text-[#0D0D0B] tracking-tight">
            ScalePilot
          </span>
        </button>

        {/* Center: Social Profile Links (GitHub & LinkedIn) */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/Samakcha"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Profile"
            className="p-2 border border-[#0D0D0B] bg-[#F8F8F6] hover:bg-[#FCDD2D] text-[#0D0D0B] transition-colors cursor-pointer"
          >
            <GithubIcon className="w-4 h-4" />
          </a>
          <a
            href="https://www.linkedin.com/in/samakcha-mishra-3aa51028a/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn Profile"
            className="p-2 border border-[#0D0D0B] bg-[#F8F8F6] hover:bg-[#FCDD2D] text-[#0D0D0B] transition-colors cursor-pointer"
          >
            <LinkedinIcon className="w-4 h-4" />
          </a>
        </div>

        {/* Right: Tagline */}
        <div className="font-mono text-[11px] text-[#555550] uppercase tracking-wider font-bold">
          Built by engineers, for engineers.
        </div>
      </div>
    </footer>
  );
}
