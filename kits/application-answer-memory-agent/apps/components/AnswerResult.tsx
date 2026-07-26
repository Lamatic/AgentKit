'use client';

interface AnswerResultProps {
  response: string;
  onReset: () => void;
}

export default function AnswerResult({ response, onReset }: AnswerResultProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border p-5 border-(--rule) bg-(--accent-soft)">
        <p className="text-xs font-medium uppercase tracking-wide mb-3 text-(--accent)">
          Drafted answer
        </p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-(--ink)">
          {response}
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => navigator.clipboard.writeText(response)}
          className="rounded-md border px-4 py-2 text-sm font-medium transition border-(--rule)"
        >
          Copy
        </button>
        <button
          onClick={onReset}
          className="rounded-md px-4 py-2 text-sm font-medium text-white transition bg-(--accent)"
        >
          Draft another
        </button>
      </div>

      <p className="text-xs text-[#78716c]">
        Review this before submitting it anywhere — it's a starting point,
        not a final answer.
      </p>
    </div>
  );
}
