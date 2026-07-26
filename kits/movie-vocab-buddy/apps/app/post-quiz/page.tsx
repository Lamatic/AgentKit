"use client";

import { useEffect, useState } from "react";
import { generatePostMovieQuiz, recordQuizAttempt } from "../../actions/orchestrate";

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

// The flow occasionally returns a quiz item missing its mcq (e.g. one word's
// generation got cut short). Guard the render against that instead of
// crashing the whole page on `undefined.question`.
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

export default function PostQuizPage() {
  const [quiz, setQuiz] = useState<QuizItem[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [sourceWords, setSourceWords] = useState<any[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem("extractedWords");
    if (!stored) {
      setLoading(false);
      return;
    }
    const { words } = JSON.parse(stored);
    setSourceWords(words ?? []);
    generatePostMovieQuiz({ extracted_words_json: JSON.stringify(words ?? []) }).then((res) => {
      const valid = (res.quiz ?? []).filter(isValidQuizItem);
      setQuiz(valid);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="p-6">Building your quiz...</p>;

  if (quiz.length === 0) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <p className="text-gray-600">
          No quiz to show — extract some vocabulary first.
        </p>
      </main>
    );
  }

  function handleAnswer(key: string, term: string, opt: string, isFirstAnswer: boolean) {
    setAnswers((a) => ({ ...a, [key]: opt }));
    // Only log the first pick per question — re-clicking to "fix" an answer
    // shouldn't inflate the mistake count for a word the user already knows.
    if (isFirstAnswer) {
      const item = quiz.find((q) => q.term === term);
      const correct = item?.mcq.correct_answer === opt;
      const meaning = sourceWords.find((w) => w.term === term)?.meaning;
      recordQuizAttempt({ user_id: USER_ID, term, meaning, correct: !!correct }).catch((err) =>
        console.error("[post-quiz] failed to record attempt:", err)
      );
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Quick check</h1>
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
      <div className="flex gap-4 mt-2">
        <a href="/library" className="text-blue-600 underline">
          View your full library
        </a>
        <a href="/review" className="text-blue-600 underline">
          Review missed words
        </a>
      </div>
    </main>
  );
}
