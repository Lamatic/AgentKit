"use client";

import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

interface ErrorResultProps {
  error?: string;
}

export default function ErrorResult({ error }: ErrorResultProps) {
  return (
    <motion.div
      key="error"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="bg-red-50 border border-red-200/60 rounded-2xl p-6 flex items-start space-x-3"
    >
      <div className="bg-red-100 p-2 rounded-full shrink-0 mt-0.5">
        <AlertCircle className="h-5 w-5 text-red-500" />
      </div>
      <div>
        <h3 className="font-bold text-red-900 mb-1 text-lg">Agent Error</h3>
        <p className="text-red-700 text-sm leading-relaxed">
          {error ||
            "An unknown error occurred while trying to process the issue."}
        </p>
      </div>
    </motion.div>
  );
}
