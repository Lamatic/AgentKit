"use client";

import { useEffect, useState } from "react";
import { getLibrary } from "../../actions/orchestrate";

export default function LibraryPage() {
  const [words, setWords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [difficulty, setDifficulty] = useState<string | undefined>(undefined);

  useEffect(() => {
    getLibrary({ user_id: "demo-user", difficulty, page, pageSize }).then((res) => {
      setWords(res.words);
      setTotal(res.total);
    });
  }, [page, difficulty]);

  const hasNext = page * pageSize < total;

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Your vocabulary library</h1>

      <div className="flex gap-2 mb-4">
        {["all", "beginner", "intermediate", "advanced"].map((d) => (
          <button
            key={d}
            onClick={() => {
              setDifficulty(d === "all" ? undefined : d);
              setPage(1);
            }}
            className={`px-3 py-1 rounded border ${
              (difficulty ?? "all") === d ? "bg-black text-white" : ""
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">Word</th>
            <th>Meaning</th>
            <th>Source</th>
            <th>Difficulty</th>
          </tr>
        </thead>
        <tbody>
        {words.map((w, i) => (
            <tr key={`${w.term}-${i}`} className="border-b">
              <td className="py-2 font-medium">{w.term}</td>
              <td>{w.meaning}</td>
              <td>{w.source_title}</td>
              <td>{w.difficulty}</td>
            </tr>
          ))}
          {words.length === 0 && (
            <tr>
              <td colSpan={4} className="py-6 text-center text-gray-500">
                No saved words yet — extract some vocabulary to get started.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex gap-2 mt-4">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="border rounded px-3 py-1 disabled:opacity-50"
        >
          Prev
        </button>
        <button
          disabled={!hasNext}
          onClick={() => setPage((p) => p + 1)}
          className="border rounded px-3 py-1 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </main>
  );
}