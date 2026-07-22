"use client";

import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

interface ErrorAlertProps {
  message: string;
  onDismiss: () => void;
  className?: string;
}

export const ErrorAlert = ({
  message,
  onDismiss,
  className = "",
}: ErrorAlertProps) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm flex items-center justify-between gap-3 ${className}`}
        >
          <span>{message}</span>
          <button
            onClick={onDismiss}
            className="text-destructive hover:text-destructive/80 transition-colors shrink-0"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
