"use client";

import { Github, Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-16 pb-8 text-center">
      <div className="flex items-center justify-center space-x-2 text-text-tertiary text-sm">
        <Zap className="w-3.5 h-3.5 text-primary-500" />
        <span>Powered by</span>
        <span className="font-semibold text-text-secondary">Lamatic AI</span>
        <span className="mx-1">·</span>
        <Github className="w-3.5 h-3.5" />
        <span>GitHub Auto Fix Agent</span>
      </div>
    </footer>
  );
}
