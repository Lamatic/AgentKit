"use client";

import { useEffect, useState } from "react";
import { getLatestWeeklyQuiz, recordQuizAttempt } from "../../actions/orchestrate";

const USER_ID = "demo-user";

type FillBlank = string | { question: string; correct_answer: string };

type QuizItem = {
  term: string;
  mcq: { question: string; options: string[]; correct_answer: string };
  fill_blank: FillBlank;
};

function fillBlankText(fb: FillBlank): string {
  return typeof fb === "string" ? fb : fb?.question ?? "";
}

function isValidQuizItem(q: any): q is QuizItem {
  return (
    q &&
    typeof q.term === "string" &&
    q.mcq &&
    typeof q.mcq.question === "string" &&
    Array.isArray(q.mcq.options) &&
    typeof q.mcq.correct_answer === "string"
  );
}

export default function WeeklyQuizPage() {
  const [quiz, setQuiz] = useState<QuizItem[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLatestWeeklyQuiz({ user_id: USER_ID })
      .then((res) => {
        setQuiz((res.quiz ?? []).filter(isValidQuizItem));
        setGeneratedAt(res.generatedAt);
      })
      .finally(() => setLoading(false));
  }, []);

  function handleAnswer(term: string, opt: string, isFirstAnswer: boolean) {
    setAnswers((a) => ({ ...a, [term]: opt }));
    if (isFirstAnswer) {
      const item = quiz.find((q) => q.term === term);
      const correct = item?.mcq.correct_answer === opt;
      recordQuizAttempt({ user_id: USER_ID, term, correct: !!correct }).catch((err) =>
        console.error("[weekly-quiz] failed to record attempt:", err)
      );
    }
  }

  if (loading) return <p className="p-6">Loading this week's quiz…</p>;

  if (quiz.length === 0) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">This week's review</h1>
        <p className="text-gray-600">
          No quiz yet — one generates automatically every Monday from the words
          you've saved. Check back after your next round of vocabulary.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-1">This week's review</h1>
      {generatedAt && (
        <p className="text-sm text-gray-500 mb-4">
          Generated {new Date(generatedAt).toLocaleDateString()}
        </p>
      )}
      {quiz.map((q) => {
        const picked = answers[q.term];
        const isCorrect = picked === q.mcq.correct_answer;
        return (
          <div key={q.term} className="border rounded p-4 mb-4">
            <p className="font-medium mb-2">{q.mcq.question}</p>
            {q.mcq.options.map((opt) => (
              <label key={opt} className="block">
                <input
                  type="radio"
                  name={`q-${q.term}`}
                  className="mr-2"
                  checked={picked === opt}
                  onChange={() => handleAnswer(q.term, opt, picked === undefined)}
                />
                {opt}
              </label>
            ))}
            {picked && (
              <p className={`mt-2 text-sm ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                {isCorrect ? "Correct!" : `Not quite — answer: ${q.mcq.correct_answer}`}
              </p>
            )}
            <p className="mt-2 text-sm text-gray-500 italic">
              Fill in the blank: {fillBlankText(q.fill_blank)}
            </p>
          </div>
        );
      })}
    </main>
  );
}