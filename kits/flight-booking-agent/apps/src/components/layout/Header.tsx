"use client";

import { Plane, Sparkles, History } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { APP_CONFIG } from "@/lib/constants";

interface HeaderProps {
  bookingsCount: number;
  onBookingsClick: () => void;
}

export const Header = ({ bookingsCount, onBookingsClick }: HeaderProps) => {
  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative z-10 border-b border-white/5 backdrop-blur-sm bg-slate-900/50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <Plane className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {APP_CONFIG.name}
              </h1>
              <p className="text-xs text-slate-400">{APP_CONFIG.tagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={onBookingsClick}
              className="flex items-center gap-2"
              aria-label="Bookings"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Bookings</span>
              {bookingsCount > 0 && (
                <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                  {bookingsCount}
                </span>
              )}
            </Button>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="hidden sm:inline">AI-powered</span>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};
