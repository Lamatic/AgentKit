"use client";

import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import {
  runDebateSetup,
  runDebateRound,
  runDebateJudge,
  type DebateSetup,
  type DebateTurn,
  type DebateVerdict,
  type Position,
} from "@/actions/orchestrate";

type Phase = "idle" | "framing" | "debating" | "judging" | "done" | "error";

type Step =
  | { kind: "setup" }
  | { kind: "round"; round: number; side: "A" | "B" }
  | { kind: "judge" };

type SavedDebate = {
  id: string;
  savedAt: string;
  topic: string;
  setup: DebateSetup;
  transcript: DebateTurn[];
  verdict: DebateVerdict;
};

const HISTORY_KEY = "debate-arena-history";
const MAX_HISTORY = 20;
const MAX_ROUNDS = 10;

// Mirrors the shape server actions already validate on the way in -- history
// comes back out of localStorage, which can be edited, corrupted, or left
// over from an older version of this app, so it gets the same treatment.
const PositionSchema = z.object({
  label: z.string(),
  stance: z.string(),
});

const SavedDebateSchema = z.object({
  id: z.string(),
  savedAt: z.string(),
  topic: z.string(),
  setup: z.object({
    cleanTopic: z.string(),
    positionA: PositionSchema,
    positionB: PositionSchema,
    context: z.string(),
  }),
  transcript: z.array(
    z.object({
      round: z.number(),
      side: z.enum(["A", "B"]),
      label: z.string(),
      statement: z.string(),
      keyPoint: z.string(),
    })
  ),
  verdict: z.object({
    prosA: z.array(z.string()),
    consA: z.array(z.string()),
    prosB: z.array(z.string()),
    consB: z.array(z.string()),
    strongestArgA: z.string(),
    strongestArgB: z.string(),
    recommendation: z.string(),
    confidence: z.enum(["low", "medium", "high"]),
    caveats: z.array(z.string()),
  }),
});

function loadHistory(): SavedDebate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Drop any entries that don't match the expected shape instead of
    // trusting them blindly -- a stale or hand-edited record shouldn't be
    // able to crash the page when the history panel is opened.
    return parsed.filter((entry): entry is SavedDebate => SavedDebateSchema.safeParse(entry).success);
  } catch {
    return [];
  }
}

function saveHistory(entries: SavedDebate[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
  } catch {
    // localStorage unavailable (private browsing, quota, etc.) -- history just won't persist
  }
}

function confidenceClass(confidence: DebateVerdict["confidence"]): string {
  return `confidence-tag ${confidence}`;
}

function slugify(text: string): string {
  return text
    .slice(0, 40)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "debate";
}

function debateToMarkdown(
  topic: string,
  setup: DebateSetup,
  transcript: DebateTurn[],
  verdict: DebateVerdict
): string {
  const lines: string[] = [];
  lines.push(`# Debate: ${setup.cleanTopic}`);
  lines.push("");
  lines.push(`_Original question: ${topic}_`);
  lines.push("");
  lines.push(`## Positions`);
  lines.push(`- **${setup.positionA.label}**: ${setup.positionA.stance}`);
  lines.push(`- **${setup.positionB.label}**: ${setup.positionB.stance}`);
  lines.push("");
  lines.push(`## Transcript`);
  lines.push("");
  for (const turn of transcript) {
    lines.push(`### Round ${turn.round} — ${turn.label}`);
    lines.push(turn.statement);
    lines.push("");
  }
  lines.push(`## Verdict`);
  lines.push("");
  lines.push(`**Confidence:** ${verdict.confidence}`);
  lines.push("");
  lines.push(`**${setup.positionA.label} — Pros**`);
  verdict.prosA.forEach((p) => lines.push(`- ${p}`));
  lines.push("");
  lines.push(`**${setup.positionA.label} — Cons**`);
  verdict.consA.forEach((c) => lines.push(`- ${c}`));
  lines.push("");
  lines.push(`**${setup.positionB.label} — Pros**`);
  verdict.prosB.forEach((p) => lines.push(`- ${p}`));
  lines.push("");
  lines.push(`**${setup.positionB.label} — Cons**`);
  verdict.consB.forEach((c) => lines.push(`- ${c}`));
  lines.push("");
  lines.push(`**Recommendation:** ${verdict.recommendation}`);
  if (verdict.caveats.length > 0) {
    lines.push("");
    lines.push(`**Caveats:** ${verdict.caveats.join(" · ")}`);
  }
  return lines.join("\n");
}

export default function Home() {
  const [topic, setTopic] = useState("");
  const [rounds, setRounds] = useState(2);
  const [roundsInput, setRoundsInput] = useState("2");
  const [phase, setPhase] = useState<Phase>("idle");
  const [setup, setSetup] = useState<DebateSetup | null>(null);
  const [transcript, setTranscript] = useState<DebateTurn[]>([]);
  const [verdict, setVerdict] = useState<DebateVerdict | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [thinking, setThinking] = useState<string | null>(null);
  const [regeneratingRound, setRegeneratingRound] = useState<number | null>(null);
  const [history, setHistory] = useState<SavedDebate[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const ctxRef = useRef<{ cleanTopic: string; positionA: Position; positionB: Position } | null>(null);
  const failedStepRef = useRef<Step | null>(null);

  const isRunning = phase === "framing" || phase === "debating" || phase === "judging";

  const parsedRoundsInput = Number(roundsInput);
  const roundsError =
    roundsInput.trim() === ""
      ? "Enter a number of rounds."
      : !Number.isInteger(parsedRoundsInput)
      ? "Rounds must be a whole number."
      : parsedRoundsInput < 1
      ? "Rounds can't be less than 1."
      : parsedRoundsInput > MAX_ROUNDS
      ? `Rounds can't be more than ${MAX_ROUNDS}.`
      : null;

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  function resetAll() {
    setError(null);
    setSetup(null);
    setTranscript([]);
    setVerdict(null);
    setPhase("idle");
    setThinking(null);
    setRegeneratingRound(null);
    ctxRef.current = null;
    failedStepRef.current = null;
  }

  async function runStep(step: Step, localTranscript: DebateTurn[]): Promise<void> {
    const ctx = ctxRef.current;

    if (step.kind === "setup") {
      setPhase("framing");
      setThinking("Framing the debate and picking two opposing positions...");

      const res = await runDebateSetup(topic);
      if (!res.success) {
        failedStepRef.current = step;
        setError(res.error);
        setPhase("error");
        setThinking(null);
        return;
      }

      setSetup(res.data);
      ctxRef.current = {
        cleanTopic: res.data.cleanTopic,
        positionA: res.data.positionA,
        positionB: res.data.positionB,
      };
      await runStep({ kind: "round", round: 1, side: "A" }, localTranscript);
      return;
    }

    if (step.kind === "round") {
      if (!ctx) return;
      setPhase("debating");

      const isRebuttal = step.round > 1;
      const position = step.side === "A" ? ctx.positionA : ctx.positionB;
      const opponentPosition = step.side === "A" ? ctx.positionB : ctx.positionA;
      setThinking(`Round ${step.round}: ${position.label} is ${isRebuttal ? "responding" : "opening"}...`);

      const res = await runDebateRound({
        topic: ctx.cleanTopic,
        position,
        opponentPosition,
        transcript: localTranscript,
        round: step.round,
        side: step.side,
        isRebuttal,
      });

      if (!res.success) {
        failedStepRef.current = step;
        setError(res.error);
        setPhase("error");
        setThinking(null);
        return;
      }

      localTranscript.push(res.data);
      setTranscript([...localTranscript]);

      const next: Step =
        step.side === "A"
          ? { kind: "round", round: step.round, side: "B" }
          : step.round < rounds
          ? { kind: "round", round: step.round + 1, side: "A" }
          : { kind: "judge" };
      await runStep(next, localTranscript);
      return;
    }

    if (step.kind === "judge") {
      if (!ctx) return;
      setPhase("judging");
      setThinking("The judge is weighing both sides...");

      const res = await runDebateJudge({
        topic: ctx.cleanTopic,
        positionA: ctx.positionA,
        positionB: ctx.positionB,
        transcript: localTranscript,
      });

      if (!res.success) {
        failedStepRef.current = step;
        setError(res.error);
        setPhase("error");
        setThinking(null);
        return;
      }

      setVerdict(res.data);
      setPhase("done");
      setThinking(null);
      failedStepRef.current = null;

      const entry: SavedDebate = {
        id: `${Date.now()}`,
        savedAt: new Date().toISOString(),
        topic,
        setup: {
          cleanTopic: ctx.cleanTopic,
          positionA: ctx.positionA,
          positionB: ctx.positionB,
          context: "",
        },
        transcript: localTranscript,
        verdict: res.data,
      };
      setHistory((prev) => {
        const updated = [entry, ...prev].slice(0, MAX_HISTORY);
        saveHistory(updated);
        return updated;
      });
    }
  }

  async function startDebate() {
    if (!topic.trim()) {
      setError("Describe the decision or question you want debated first.");
      setPhase("error");
      return;
    }
    resetAll();
    await runStep({ kind: "setup" }, []);
  }

  async function retryFailedStep() {
    const step = failedStepRef.current;
    if (!step) return;
    setError(null);
    await runStep(step, [...transcript]);
  }

  async function regenerateRound(turnIndex: number) {
    const ctx = ctxRef.current;
    const turn = transcript[turnIndex];
    if (!ctx || !turn) return;

    setRegeneratingRound(turnIndex);
    setError(null);

    const position = turn.side === "A" ? ctx.positionA : ctx.positionB;
    const opponentPosition = turn.side === "A" ? ctx.positionB : ctx.positionA;
    const priorTranscript = transcript.slice(0, turnIndex);

    const res = await runDebateRound({
      topic: ctx.cleanTopic,
      position,
      opponentPosition,
      transcript: priorTranscript,
      round: turn.round,
      side: turn.side,
      isRebuttal: turn.round > 1,
    });

    setRegeneratingRound(null);

    if (!res.success) {
      setError(res.error);
      return;
    }

    const updated = [...transcript];
    updated[turnIndex] = res.data;
    setTranscript(updated);

    // Regenerating the last turn invalidates any verdict/history entry that
    // was judged against the statement it replaced -- re-run the judge on
    // the corrected transcript so the displayed verdict, the download, and
    // the saved history entry all stay consistent with what's on screen.
    if (verdict) {
      await runStep({ kind: "judge" }, updated);
    }
  }

  function downloadMarkdown() {
    if (!setup || !verdict) return;
    const md = debateToMarkdown(topic, setup, transcript, verdict);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `debate-${slugify(setup.cleanTopic)}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function clearHistory() {
    setHistory([]);
    saveHistory([]);
  }

  function loadFromHistory(entry: SavedDebate) {
    setTopic(entry.topic);
    setSetup(entry.setup);
    setTranscript(entry.transcript);
    setVerdict(entry.verdict);
    setPhase("done");
    setError(null);
    setThinking(null);
    failedStepRef.current = null;
    ctxRef.current = {
      cleanTopic: entry.setup.cleanTopic,
      positionA: entry.setup.positionA,
      positionB: entry.setup.positionB,
    };
    setShowHistory(false);
  }

  return (
    <main>
      <div className="top-row">
        <div>
          <h1>Debate Arena</h1>
          <p className="subtitle">
            Pose any tradeoff or decision. Two AI agents will argue opposing sides, then an impartial judge
            weighs in with a verdict.
          </p>
        </div>
        <button
          type="button"
          className="ghost-button"
          onClick={() => setShowHistory((v) => !v)}
        >
          History {history.length > 0 ? `(${history.length})` : ""}
        </button>
      </div>

      {showHistory && (
        <div className="history-panel">
          {history.length === 0 ? (
            <p className="thinking">No saved debates yet -- finish one and it will show up here.</p>
          ) : (
            <>
              <ul className="history-list">
                {history.map((entry) => (
                  <li key={entry.id}>
                    <button type="button" onClick={() => loadFromHistory(entry)}>
                      <span className="history-topic">{entry.setup.cleanTopic}</span>
                      <span className="history-date">{new Date(entry.savedAt).toLocaleString()}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" className="ghost-button danger" onClick={clearHistory}>
                Clear history
              </button>
            </>
          )}
        </div>
      )}

      <label htmlFor="topic" className="sr-only">
        Decision or question to debate
      </label>
      <textarea
        id="topic"
        rows={3}
        placeholder='e.g. "Should our team use microservices or a monolith?" or "Should I take the job with more pay or the one with better work-life balance?"'
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        disabled={isRunning}
      />

      <div className="controls-row">
        <label htmlFor="rounds" className="rounds-label">
          Rounds:
        </label>
        <input
          id="rounds"
          type="number"
          min={1}
          max={MAX_ROUNDS}
          value={roundsInput}
          onChange={(e) => {
            const raw = e.target.value;
            setRoundsInput(raw);

            // Only commit to the numeric `rounds` state once the typed value
            // is a valid whole number in range -- otherwise leave `rounds` at
            // its last valid value and let the inline error below do the
            // talking, instead of silently clamping mid-keystroke (which
            // made the field feel uneditable).
            const next = Number(raw);
            if (raw.trim() !== "" && Number.isInteger(next) && next >= 1 && next <= MAX_ROUNDS) {
              setRounds(next);
            }
          }}
          disabled={isRunning}
        />
        <button onClick={startDebate} disabled={isRunning || !!roundsError}>
          {isRunning ? "Debating..." : "Start Debate"}
        </button>
      </div>

      {roundsError && <p className="field-error">{roundsError}</p>}

      {error && (
        <div className="error-banner" role="alert">
          {error}
          {phase === "error" && failedStepRef.current && (
            <button type="button" className="retry-button" onClick={retryFailedStep}>
              Retry
            </button>
          )}
        </div>
      )}
      {thinking && <p className="thinking">{thinking}</p>}

      {setup && (
        <div className="positions-banner">
          <div className="position-card a">
            <div className="label">{setup.positionA.label}</div>
            <div className="stance">{setup.positionA.stance}</div>
          </div>
          <div className="position-card b">
            <div className="label">{setup.positionB.label}</div>
            <div className="stance">{setup.positionB.stance}</div>
          </div>
        </div>
      )}

      {transcript.length > 0 && (
        <div className="transcript">
          {transcript.map((turn, i) => (
            <div key={i} className={`bubble ${turn.side.toLowerCase()}`}>
              <div className="round-tag">
                Round {turn.round} · {turn.label}
              </div>
              {turn.statement}
              {/* Only the most recent turn can be regenerated -- earlier
                  turns already have rebuttals written against them, so
                  replacing one would leave the transcript arguing against
                  a statement that no longer exists. */}
              {!isRunning && i === transcript.length - 1 && (
                <button
                  type="button"
                  className="regenerate-button"
                  onClick={() => regenerateRound(i)}
                  disabled={regeneratingRound !== null}
                >
                  {regeneratingRound === i ? "Regenerating..." : "Regenerate"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {verdict && (
        <div className="verdict-panel">
          <h2>
            Judge&apos;s Verdict
            <span className={confidenceClass(verdict.confidence)}>{verdict.confidence} confidence</span>
          </h2>

          <div className="matrix">
            <div className="matrix-col">
              <h3>{setup?.positionA.label} — Pros</h3>
              <ul>
                {verdict.prosA.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
              <h3>Cons</h3>
              <ul>
                {verdict.consA.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
            <div className="matrix-col">
              <h3>{setup?.positionB.label} — Pros</h3>
              <ul>
                {verdict.prosB.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
              <h3>Cons</h3>
              <ul>
                {verdict.consB.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="recommendation">
            <strong>Recommendation:</strong> {verdict.recommendation}
          </div>

          {verdict.caveats.length > 0 && (
            <div className="caveats">
              <strong>Caveats:</strong> {verdict.caveats.join(" · ")}
            </div>
          )}

          <button type="button" className="ghost-button" onClick={downloadMarkdown}>
            Download as Markdown
          </button>
        </div>
      )}
    </main>
  );
}
