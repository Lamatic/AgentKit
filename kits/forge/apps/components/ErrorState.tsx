"use client";

import { RefreshCcw, Home } from "lucide-react";
import { GalaxyButton } from "@/components/GalaxyButton";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

function CautionGraphic() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
      <path d="M20 4L36 32H4L20 4Z" fill="url(#cautionGrad1)" fillOpacity="0.2" stroke="url(#cautionGrad2)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M20 14V22" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="20" cy="28" r="1.5" fill="#ffffff" />
      <defs>
        <linearGradient id="cautionGrad1" x1="20" y1="4" x2="20" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ef4444" />
          <stop offset="1" stopColor="#ef4444" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="cautionGrad2" x1="20" y1="4" x2="20" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#ef4444" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function ErrorState({ 
  message = "Something went wrong while processing your request. Please try again later.", 
  onRetry 
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
      {/* Icon Container - Matching landing page card style */}
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex items-center justify-center mb-6 shadow-inner relative z-10 mx-auto">
          <CautionGraphic />
        </div>
        
        {/* Glow effect behind the icon */}
        <div className="absolute inset-0 bg-rose-500/10 blur-3xl -z-10 rounded-full" />
      </div>

      <h2 className="text-3xl font-bold mb-4 text-white">Oops!</h2>
      <p className="text-text-secondary max-w-[400px] mb-10 leading-relaxed">
        {message}
      </p>

      <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
        {onRetry && (
          <GalaxyButton 
            text="Try Again" 
            onClick={onRetry} 
            icon={<RefreshCcw className="w-4 h-4" />}
            showArrow={false}
          />
        )}
        
        <GalaxyButton 
          text="Back to Home" 
          href="/" 
          icon={<Home className="w-4 h-4" />}
          showArrow={false}
        />
      </div>
    </div>
  );
}
