"use client";

import { motion } from "motion/react";
import { Suggestion } from "@/types";

interface SuggestionsProps {
  suggestions: Suggestion[];
  onSelect: (query: string) => void;
}

export const Suggestions = ({ suggestions, onSelect }: SuggestionsProps) => {
  return (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="flex flex-wrap gap-2 justify-center mt-4"
    >
      {suggestions.map((suggestion, index) => (
        <motion.button
          key={index}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(suggestion.query)}
          className="px-4 py-1.5 text-xs bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/30 rounded-full text-slate-300 transition-all duration-200"
        >
          {suggestion.label}
        </motion.button>
      ))}
    </motion.div>
  );
};
