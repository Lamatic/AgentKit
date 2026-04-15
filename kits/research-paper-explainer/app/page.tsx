"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Level = "high-school" | "undergraduate" | "expert";
type Tab = "explain" | "quiz";

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface QuizState {
  questions: QuizQuestion[];
  answers: (number | null)[];
  submitted: boolean;
}

const LEVELS: { value: Level; label: string; desc: string }[] = [
  { value: "high-school", label: "Simple", desc: "High school level" },
  { value: "undergraduate", label: "Intermediate", desc: "Undergrad level" },
  { value: "expert", label: "Expert", desc: "Domain specialist" },
];

export default function HomePage() {
  const [paperContent, setPaperContent] = useState("");
  const [level, setLevel] = useState<Level>("undergraduate");
  const [tab, setTab] = useState<Tab>("explain");
  const [numQuestions, setNumQuestions] = useState(5);

  const [explanation, setExplanation] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExplain() {
    if (!paperContent.trim()) return;
    setLoading(true);
    setError(null);
    setExplanation(null);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperContent, level }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setExplanation(typeof data.explanation === "string" ? data.explanation : JSON.stringify(data.explanation, null, 2));
      setTab("explain");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleQuiz() {
    if (!paperContent.trim()) return;
    setLoading(true);
    setError(null);
    setQuiz(null);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperContent, numQuestions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setQuiz({
        questions: data.questions,
        answers: new Array(data.questions.length).fill(null),
        submitted: false,
      });
      setTab("quiz");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function handleAnswer(qIdx: number, optIdx: number) {
    if (!quiz || quiz.submitted) return;
    setQuiz((prev) => {
      if (!prev) return prev;
      const answers = [...prev.answers];
      answers[qIdx] = optIdx;
      return { ...prev, answers };
    });
  }

  function handleSubmitQuiz() {
    setQuiz((prev) => prev ? { ...prev, submitted: true } : prev);
  }

  const score = quiz?.submitted
    ? quiz.questions.filter((q, i) => quiz.answers[i] === q.correct).length
    : null;

  return (
    <div className="min-h-screen" style={{ background: "var(--paper)" }}>
      {/* Header */}
      <header style={{ borderBottom: "1.5px solid var(--border)", background: "var(--cream)" }}>
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl" style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}>
              Paper<span style={{ color: "var(--amber)" }}>Lens</span>
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)", fontFamily: "DM Mono, monospace" }}>
              Research Paper Explainer & Quiz · Lamatic AgentKit
            </p>
          </div>
          <div
            className="text-xs px-3 py-1.5 rounded-full"
            style={{ background: "var(--amber-pale)", color: "var(--amber)", border: "1px solid #e8c97a", fontFamily: "DM Mono, monospace" }}
          >
            ✦ AI-Powered
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* LEFT PANEL — Input */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <div>
              <label className="block text-xs font-medium mb-2 uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                Paper Abstract or Content
              </label>
              <textarea
                className="w-full rounded-xl p-4 text-sm leading-relaxed resize-none transition-all duration-200"
                style={{
                  background: "#fff",
                  border: "1.5px solid var(--border)",
                  color: "var(--ink)",
                  minHeight: "240px",
                  outline: "none",
                  fontFamily: "DM Sans, sans-serif",
                }}
                placeholder="Paste your research paper abstract, introduction, or full text here…"
                value={paperContent}
                onChange={(e) => setPaperContent(e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = "var(--amber)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
              <p className="text-xs mt-1.5" style={{ color: "var(--muted)" }}>
                {paperContent.length} chars · min 50 required
              </p>
            </div>

            {/* Level selector */}
            <div>
              <label className="block text-xs font-medium mb-2 uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                Explanation Level
              </label>
              <div className="flex gap-2">
                {LEVELS.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => setLevel(l.value)}
                    className="flex-1 py-2.5 px-2 rounded-lg text-sm transition-all duration-150"
                    style={{
                      background: level === l.value ? "var(--amber)" : "#fff",
                      color: level === l.value ? "#fff" : "var(--ink)",
                      border: `1.5px solid ${level === l.value ? "var(--amber)" : "var(--border)"}`,
                      fontWeight: level === l.value ? 600 : 400,
                    }}
                  >
                    <div>{l.label}</div>
                    <div className="text-xs opacity-70 mt-0.5">{l.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quiz count */}
            <div>
              <label className="block text-xs font-medium mb-2 uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                Quiz Questions: <span style={{ color: "var(--amber)" }}>{numQuestions}</span>
              </label>
              <input
                type="range"
                min={3}
                max={10}
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="w-full"
                style={{ accentColor: "var(--amber)" }}
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: "var(--muted)" }}>
                <span>3</span><span>10</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleExplain}
                disabled={loading || paperContent.length < 50}
                className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  background: loading ? "var(--border)" : "var(--amber)",
                  color: loading ? "var(--muted)" : "#fff",
                  cursor: loading || paperContent.length < 50 ? "not-allowed" : "pointer",
                  opacity: paperContent.length < 50 ? 0.5 : 1,
                }}
              >
                {loading && tab === "explain" ? "Explaining…" : "✦ Explain This Paper"}
              </button>
              <button
                onClick={handleQuiz}
                disabled={loading || paperContent.length < 50}
                className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  background: "#fff",
                  color: "var(--ink)",
                  border: "1.5px solid var(--border)",
                  cursor: loading || paperContent.length < 50 ? "not-allowed" : "pointer",
                  opacity: paperContent.length < 50 ? 0.5 : 1,
                }}
              >
                {loading && tab === "quiz" ? "Generating Quiz…" : "◈ Generate Quiz"}
              </button>
            </div>

            {/* Loading indicator */}
            {loading && (
              <div className="flex items-center gap-3 py-2 animate-fade-in">
                <span className="loading-dot" />
                <span className="loading-dot" />
                <span className="loading-dot" />
                <span className="text-sm" style={{ color: "var(--muted)" }}>
                  Agent is thinking…
                </span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                className="rounded-xl p-4 text-sm animate-fade-in"
                style={{ background: "#fdf2f2", border: "1px solid #f5c6c6", color: "var(--error)" }}
              >
                ⚠ {error}
              </div>
            )}
          </div>

          {/* RIGHT PANEL — Output */}
          <div className="lg:col-span-3">
            {/* Tab switcher */}
            {(explanation || quiz) && (
              <div className="flex gap-1 mb-5" style={{ borderBottom: "1.5px solid var(--border)", paddingBottom: "0" }}>
                {explanation && (
                  <button
                    onClick={() => setTab("explain")}
                    className="px-5 py-2.5 text-sm font-medium transition-all"
                    style={{
                      borderBottom: tab === "explain" ? "2.5px solid var(--amber)" : "2.5px solid transparent",
                      color: tab === "explain" ? "var(--amber)" : "var(--muted)",
                      marginBottom: "-1.5px",
                    }}
                  >
                    Explanation
                  </button>
                )}
                {quiz && (
                  <button
                    onClick={() => setTab("quiz")}
                    className="px-5 py-2.5 text-sm font-medium transition-all"
                    style={{
                      borderBottom: tab === "quiz" ? "2.5px solid var(--amber)" : "2.5px solid transparent",
                      color: tab === "quiz" ? "var(--amber)" : "var(--muted)",
                      marginBottom: "-1.5px",
                    }}
                  >
                    Quiz {score !== null && `(${score}/${quiz.questions.length})`}
                  </button>
                )}
              </div>
            )}

            {/* Explanation output */}
            {tab === "explain" && explanation && (
              <div
                className="rounded-2xl p-7 animate-fade-in"
                style={{ background: "#fff", border: "1.5px solid var(--border)" }}
              >
                <div className="flex items-center gap-2 mb-5">
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-mono"
                    style={{ background: "var(--amber-pale)", color: "var(--amber)", border: "1px solid #e8c97a" }}
                  >
                    {LEVELS.find((l) => l.value === level)?.label} level
                  </span>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>Powered by Lamatic Flow</span>
                </div>
                <div className="prose text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{explanation}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Quiz output */}
            {tab === "quiz" && quiz && (
              <div className="flex flex-col gap-5 animate-fade-in">
                {quiz.questions.map((q, qi) => {
                  const answered = quiz.answers[qi];
                  const isCorrect = answered === q.correct;
                  return (
                    <div
                      key={qi}
                      className="rounded-2xl p-6"
                      style={{
                        background: "#fff",
                        border: `1.5px solid ${quiz.submitted && answered !== null ? (isCorrect ? "#a8d5b5" : "#f5c6c6") : "var(--border)"}`,
                      }}
                    >
                      <p className="text-sm font-semibold mb-4" style={{ color: "var(--ink)" }}>
                        <span style={{ color: "var(--amber)", fontFamily: "DM Mono, monospace" }}>Q{qi + 1}. </span>
                        {q.question}
                      </p>
                      <div className="flex flex-col gap-2">
                        {q.options.map((opt, oi) => {
                          let bg = "#f9f6f0";
                          let border = "var(--border)";
                          let color = "var(--ink)";
                          if (quiz.submitted) {
                            if (oi === q.correct) { bg = "#d4edda"; border = "#5cb85c"; color = "#155724"; }
                            else if (oi === answered) { bg = "#fde8e8"; border = "#e57373"; color = "#7b2020"; }
                          } else if (answered === oi) {
                            bg = "var(--amber-pale)"; border = "var(--amber)";
                          }
                          return (
                            <button
                              key={oi}
                              onClick={() => handleAnswer(qi, oi)}
                              disabled={quiz.submitted}
                              className="text-left px-4 py-3 rounded-xl text-sm transition-all duration-150"
                              style={{ background: bg, border: `1.5px solid ${border}`, color, cursor: quiz.submitted ? "default" : "pointer" }}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      {quiz.submitted && (
                        <p className="mt-3 text-xs leading-relaxed animate-fade-in" style={{ color: "var(--muted)" }}>
                          💡 {q.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}

                {!quiz.submitted && (
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={quiz.answers.includes(null)}
                    className="w-full py-3.5 rounded-xl text-sm font-semibold mt-1 transition-all"
                    style={{
                      background: quiz.answers.includes(null) ? "var(--border)" : "var(--ink)",
                      color: quiz.answers.includes(null) ? "var(--muted)" : "#fff",
                      cursor: quiz.answers.includes(null) ? "not-allowed" : "pointer",
                    }}
                  >
                    Submit Answers
                  </button>
                )}

                {quiz.submitted && score !== null && (
                  <div
                    className="rounded-2xl p-6 text-center animate-fade-in"
                    style={{ background: "var(--cream)", border: "1.5px solid var(--border)" }}
                  >
                    <p className="font-serif text-4xl" style={{ color: "var(--amber)" }}>
                      {score}/{quiz.questions.length}
                    </p>
                    <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                      {score === quiz.questions.length
                        ? "Perfect score! 🎉"
                        : score >= quiz.questions.length * 0.7
                        ? "Great understanding! 👏"
                        : "Keep reading — you'll get there! 📖"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {!explanation && !quiz && !loading && (
              <div
                className="rounded-2xl p-10 flex flex-col items-center justify-center text-center"
                style={{ background: "var(--cream)", border: "1.5px dashed var(--border)", minHeight: "360px" }}
              >
                <p className="font-serif text-5xl mb-4" style={{ color: "var(--border)" }}>◎</p>
                <p className="font-serif text-xl mb-2" style={{ color: "var(--muted)" }}>Your results will appear here</p>
                <p className="text-sm" style={{ color: "var(--border)" }}>
                  Paste a research paper and hit Explain or Generate Quiz
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-6" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            Built with <span style={{ color: "var(--amber)" }}>Lamatic AgentKit</span> · by Aman Kumar
          </p>
          <p className="text-xs font-mono" style={{ color: "var(--border)" }}>
            research-paper-explainer v1.0.0
          </p>
        </div>
      </footer>
    </div>
  );
}
