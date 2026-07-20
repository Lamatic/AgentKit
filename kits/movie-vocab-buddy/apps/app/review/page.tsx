"use client";

import { useEffect, useState } from "react";
import { getWordsToReview, generatePostMovieQuiz, recordQuizAttempt } from "../../actions/orchestrate";

const USER_ID = "demo-user";

type FillBlank = string | { question: string; correct_answer: string };

type QuizItem = {
  term: string;
  mcq: { question: string; options: string[]; correct_answer: string };
  fill_blank: FillBlank;
};

function fillBlankText(fb: FillBlank): string {
  return typeof fb === "string" ? fb : fb.question;
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

export default function ReviewPage() {
  const [quiz, setQuiz] = useState<QuizItem[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [noMistakes, setNoMistakes] = useState(false);

  useEffect(() => {
    (async () => {
      const { words } = await getWordsToReview({ user_id: USER_ID, limit: 8 });
      if (words.length === 0) {
        setNoMistakes(true);
        setLoading(false);
        return;
      }
      // Reuse the existing quiz-generation flow, feeding it just the words
      // that have been missed before instead of a fresh extraction batch.
      const wordsForQuiz = words.map((w: any) => ({
        term: w.term,
        meaning: w.meaning ?? "",
      }));
      const res = await generatePostMovieQuiz({ extracted_words_json: JSON.stringify(wordsForQuiz) });
      const valid = (res.quiz ?? []).filter(isValidQuizItem);
      setQuiz(valid);
      setLoading(false);
    })();
  }, []);

  function handleAnswer(key: string, term: string, opt: string, isFirstAnswer: boolean) {
    setAnswers((a) => ({ ...a, [key]: opt }));
    if (isFirstAnswer) {
      const item = quiz.find((q) => q.term === term);
      const correct = item?.mcq.correct_answer === opt;
      recordQuizAttempt({ user_id: USER_ID, term, correct: !!correct }).catch((err) =>
        console.error("[review] failed to record attempt:", err)
      );
    }
  }

  if (loading) return <p className="p-6">Pulling together your trickiest words...</p>;

  if (noMistakes) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Review missed words</h1>
        <p className="text-gray-600">
          No missed words yet — take a quiz first, and anything you get wrong
          will show up here for extra practice.
        </p>
      </main>
    );
  }

  if (quiz.length === 0) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <p className="text-gray-600">Couldn't build a review quiz right now — try again shortly.</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-1">Review missed words</h1>
      <p className="text-sm text-gray-500 mb-4">
        Focused practice on the words you've gotten wrong most often.
      </p>
      {quiz.map((q, i) => {
        const key = `${q.term}-${i}`;
        const picked = answers[key];
        const isCorrect = picked === q.mcq.correct_answer;
        return (
          <div key={key} className="border rounded p-4 mb-4">
            <p className="font-medium mb-2">{q.mcq.question}</p>
            <div className="space-y-1">
              {q.mcq.options.map((opt) => (
                <label key={opt} className="block">
                  <input
                    type="radio"
                    name={`mcq-${i}`}
                    className="mr-2"
                    checked={picked === opt}
                    onChange={() => handleAnswer(key, q.term, opt, picked === undefined)}
                  />
                  {opt}
                </label>
              ))}
            </div>
            {picked && (
              <p className={`mt-2 text-sm ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                {isCorrect ? "Correct!" : `Not quite — answer: ${q.mcq.correct_answer}`}
              </p>
            )}
            <p className="mt-3 text-sm text-gray-600 italic">{fillBlankText(q.fill_blank)}</p>
          </div>
        );
      })}
      <a href="/library" className="text-blue-600 underline">
        View your full library
      </a>
    </main>
  );
}
