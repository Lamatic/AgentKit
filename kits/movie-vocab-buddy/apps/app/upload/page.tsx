"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { extractVocabulary } from "../../actions/orchestrate";

export default function UploadPage() {
  const [transcript, setTranscript] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const result = await extractVocabulary({
        transcript_text: transcript,
        source_title: title,
        user_id: "demo-user", // replace with real auth
      });
      if (!result.words || result.words.length === 0) {
        setError(
          "The extraction completed but no vocabulary came back. This usually isn't about transcript length — " +
            "if this keeps happening, the database connection may need attention (see the terminal/server logs)."
        );
        return;
      }
      sessionStorage.setItem("extractedWords", JSON.stringify(result));
      router.push("/words");
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong extracting vocabulary. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Paste a transcript or subtitles</h1>
      <input
        className="w-full border rounded p-2 mb-3"
        placeholder="Movie or show title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="w-full border rounded p-2 h-64 mb-4"
        placeholder="Paste subtitle text or transcript here..."
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
      />
      <button
        className="bg-black text-white rounded px-4 py-2 disabled:opacity-50"
        disabled={loading || !transcript || !title}
        onClick={handleSubmit}
      >
        {loading ? "Extracting..." : "Extract vocabulary"}
      </button>
      {error && (
        <p className="mt-3 text-sm text-red-600 border border-red-200 bg-red-50 rounded p-3">
          {error}
        </p>
      )}
    </main>
  );
}
