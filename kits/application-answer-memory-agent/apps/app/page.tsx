'use client';

import { useState } from 'react';
import { generateDraftAnswer } from '@/actions/orchestrate';
import AnswerForm from '@/components/AnswerForm';
import AnswerResult from '@/components/AnswerResult';
import ErrorMessage from '@/components/ErrorMessage';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (newQuestion: string, pastAnswers: string) => {
    setLoading(true);
    setError(null);

    const result = await generateDraftAnswer({
      new_question: newQuestion,
      past_answers: pastAnswers,
    });

    if (result.success && result.data) {
      setResponse(result.data.response);
    } else {
      setError(result.error || 'Something went wrong drafting your answer.');
    }

    setLoading(false);
  };

  const reset = () => {
    setResponse(null);
    setError(null);
  };

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <header className="mb-10">
          <p className="text-xs font-medium uppercase tracking-wide mb-3 text-(--accent)">
            Application Answer Memory Agent
          </p>
          <h1 className="font-display text-3xl mb-3 text-(--ink)">
            Don't rewrite the same answer twice.
          </h1>
          <p className="text-sm leading-relaxed text-[#57534e]">
            Paste what you've already written for other applications, then
            paste a new question. The agent adapts your real answers to fit
            it — it won't invent anything you haven't actually said.
          </p>
        </header>

        {!response && (
          <AnswerForm onSubmit={handleSubmit} disabled={loading} />
        )}

        {error && <div className="mt-6"><ErrorMessage message={error} onRetry={reset} /></div>}

        {response && (
          <div className="mt-2">
            <AnswerResult response={response} onReset={reset} />
          </div>
        )}

        <footer className="mt-16 border-t pt-6 text-xs border-(--rule) text-[#a8a29e]">
          Built on Lamatic.ai
        </footer>
      </div>
    </main>
  );
}
