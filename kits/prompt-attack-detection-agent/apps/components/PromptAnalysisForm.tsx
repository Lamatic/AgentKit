"use client";

import { useState } from "react";

interface Props {
  onSubmit: (prompt: string) => void;
}

/**
 * Form used to submit prompts for security analysis.
 */
export default function PromptAnalysisForm({ onSubmit }: Props) {
  const [prompt, setPrompt] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(prompt);
      }}
      className="space-y-6"
    >
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Paste a prompt to analyze..."
        className="h-72 w-full rounded-xl border border-gray-300 bg-white p-4 font-mono text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <button
        type="submit"
        className="rounded-xl bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
      >
        Analyze Prompt
      </button>
    </form>
  );
}
