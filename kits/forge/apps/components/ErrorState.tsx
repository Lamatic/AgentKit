"use client";

import { RefreshCcw, Home } from "lucide-react";
import Link from "next/link";
import GalaxyButton from "@/components/GalaxyButton";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({ 
  message = "Something went wrong while processing your request. Please try again later.", 
  onRetry 
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
      {/* Sprite Animation Container */}
      <div className="relative mb-8">
        <div className="error-sprite mx-auto" />
        
        {/* Glow effect behind the sprite */}
        <div className="absolute inset-0 bg-accent/20 blur-3xl -z-10 rounded-full" />
      </div>

      <h2 className="text-3xl font-bold mb-4 text-white">Oops!</h2>
      <p className="text-text-secondary max-w-[400px] mb-10 leading-relaxed">
        {message}
      </p>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        {onRetry && (
          <GalaxyButton onClick={onRetry}>
            <RefreshCcw className="w-4 h-4 mr-2" />
            Try Again
          </GalaxyButton>
        )}
        
        <Link href="/">
          <button className="px-6 py-3 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all flex items-center gap-2 text-sm font-medium">
            <Home className="w-4 h-4" />
            Back to Home
          </button>
        </Link>
      </div>
    </div>
  );
}
