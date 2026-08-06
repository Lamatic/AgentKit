"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-green-100 text-green-800",
  intermediate: "bg-yellow-100 text-yellow-800",
  advanced: "bg-red-100 text-red-800",
};

export default function WordsPage() {
  const [words, setWords] = useState<any[]>([]);
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem("extractedWords");
    if (stored) setWords(JSON.parse(stored).words ?? []);
  }, []);

  const visible =
    difficultyFilter === "all" ? words : words.filter((w) => w.difficulty === difficultyFilter);

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">New vocabulary</h1>
      <div className="flex gap-2 mb-6">
        {["all", "beginner", "intermediate", "advanced"].map((d) => (
          <button
            key={d}
            onClick={() => setDifficultyFilter(d)}
            className={`px-3 py-1 rounded border ${difficultyFilter === d ? "bg-black text-white" : ""}`}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="space-y-4">
      {visible.map((w, i) => (
          <div key={`${w.term}-${i}`} className="border rounded p-4">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-lg">{w.term}</h2>
              <span className={`text-xs px-2 py-1 rounded ${DIFFICULTY_COLORS[w.difficulty]}`}>
                {w.difficulty}
              </span>
            </div>
            <p className="mt-1">{w.meaning}</p>
            <p className="mt-2 italic text-sm text-gray-600">"{w.context_line}"</p>
            <ul className="mt-2 text-sm list-disc list-inside text-gray-700">
              <li>{w.example_1}</li>
              <li>{w.example_2}</li>
            </ul>
          </div>
        ))}
      </div>

      <button
        className="mt-6 bg-black text-white rounded px-4 py-2"
        onClick={() => router.push("/post-quiz")}
      >
        Take a quick quiz
      </button>
    </main>
  );
}
