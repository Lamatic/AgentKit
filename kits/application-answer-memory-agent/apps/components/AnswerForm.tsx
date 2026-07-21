'use client';

import { useState } from 'react';

interface AnswerFormProps {
  onSubmit: (newQuestion: string, pastAnswers: string) => void;
  disabled?: boolean;
}

export default function AnswerForm({ onSubmit, disabled }: AnswerFormProps) {
  const [newQuestion, setNewQuestion] = useState('');
  const [pastAnswers, setPastAnswers] = useState('');

  const canSubmit = newQuestion.trim() && pastAnswers.trim() && !disabled;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit(newQuestion, pastAnswers);
      }}
      className="space-y-6"
    >
      <div>
        <label
          htmlFor="past_answers"
          className="block text-sm font-medium mb-2"
          style={{ color: 'var(--ink)' }}
        >
          Your past answers
        </label>
        <p className="text-sm mb-2" style={{ color: '#78716c' }}>
          Paste any previous application answers you've written. Format
          doesn't matter — a few Q&amp;A pairs work well.
        </p>
        <textarea
          id="past_answers"
          value={pastAnswers}
          onChange={(e) => setPastAnswers(e.target.value)}
          rows={9}
          placeholder="Q: Why do you want to work with us?&#10;A: ..."
          className="w-full rounded-md border px-4 py-3 text-sm focus:outline-none focus:ring-2"
          style={{
            borderColor: 'var(--rule)',
            background: 'white',
          }}
        />
      </div>

      <div>
        <label
          htmlFor="new_question"
          className="block text-sm font-medium mb-2"
          style={{ color: 'var(--ink)' }}
        >
          New application question
        </label>
        <textarea
          id="new_question"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          rows={3}
          placeholder="e.g. What excites you about this role?"
          className="w-full rounded-md border px-4 py-3 text-sm focus:outline-none focus:ring-2"
          style={{
            borderColor: 'var(--rule)',
            background: 'white',
          }}
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="rounded-md px-5 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40"
        style={{ background: 'var(--accent)' }}
      >
        {disabled ? 'Drafting…' : 'Draft Answer'}
      </button>
    </form>
  );
}
