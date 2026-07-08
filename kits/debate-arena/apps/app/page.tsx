"use client";

import { useState } from "react";
import {
  runDebateSetup,
  runDebateRound,
  runDebateJudge,
  type DebateSetup,
  type DebateTurn,
  type DebateVerdict,
  type Position,
} from "@/actions/orchestrate";

type Phase = "idle" | "framing" | "debating" | "judging" | "done";

export default function Home() {
  const [topic, setTopic] = useState("");
  const [rounds, setRounds] = useState(2);
  const [phase, setPhase] = useState<Phase>("idle");
  const [setup, setSetup] = useState<DebateSetup | null>(null);
  const [transcript, setTranscript] = useState<DebateTurn[]>([]);
  const [verdict, setVerdict] = useState<DebateVerdict | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [thinking, setThinking] = useState<string | null>(null);

  const isRunning = phase === "framing" || phase === "debating" || phase === "judging";

  async function startDebate() {
    setError(null);
    setSetup(null);
    setTranscript([]);
    setVerdict(null);

    if (!topic.trim()) {
      setError("Describe the decision or question you want debated first.");
      return;
    }

    setPhase("framing");
    setThinking("Framing the debate and picking two opposing positions...");

    const setupRes = await runDebateSetup(topic);
    if (!setupRes.success) {
      setError(setupRes.error);
      setPhase("idle");
      setThinking(null);
      return;
    }
    setSetup(setupRes.data);
    setPhase("debating");

    const positionA: Position = setupRes.data.positionA;
    const positionB: Position = setupRes.data.positionB;
    const localTranscript: DebateTurn[] = [];

    for (let round = 1; round <= rounds; round++) {
      const isRebuttal = round > 1;

      setThinking(`Round ${round}: ${positionA.label} is ${isRebuttal ? "responding" : "opening"}...`);
      const aRes = await runDebateRound({
        topic: setupRes.data.cleanTopic,
        position: positionA,
        opponentPosition: positionB,
        transcript: localTranscript,
        round,
        side: "A",
        isRebuttal,
      });
      if (!aRes.success) {
        setError(aRes.error);
        setPhase("idle");
        setThinking(null);
        return;
      }
      localTranscript.push(aRes.data);
      setTranscript([...localTranscript]);

      setThinking(`Round ${round}: ${positionB.label} is ${isRebuttal ? "responding" : "opening"}...`);
      const bRes = await runDebateRound({
        topic: setupRes.data.cleanTopic,
        position: positionB,
        opponentPosition: positionA,
        transcript: localTranscript,
        round,
        side: "B",
        isRebuttal,
      });
      if (!bRes.success) {
        setError(bRes.error);
        setPhase("idle");
        setThinking(null);
        return;
      }
      localTranscript.push(bRes.data);
      setTranscript([...localTranscript]);
    }

    setPhase("judging");
    setThinking("The judge is weighing both sides...");

    const judgeRes = await runDebateJudge({
      topic: setupRes.data.cleanTopic,
      positionA,
      positionB,
      transcript: localTranscript,
    });
    if (!judgeRes.success) {
      setError(judgeRes.error);
      setPhase("idle");
      setThinking(null);
      return;
    }

    setVerdict(judgeRes.data);
    setPhase("done");
    setThinking(null);
  }

  return (
    <main>
      <h1>Debate Arena</h1>
      <p className="subtitle">
        Pose any tradeoff or decision. Two AI agents will argue opposing sides, then an impartial judge
        weighs in with a verdict.
      </p>

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
        <label htmlFor="rounds" style={{ fontSize: "0.85rem", color: "#9aa0ab" }}>
          Rounds:
        </label>
        <select
          id="rounds"
          value={rounds}
          onChange={(e) => setRounds(Number(e.target.value))}
          disabled={isRunning}
          style={{ width: "auto" }}
        >
          <option value={1}>1 (opening statements only)</option>
          <option value={2}>2 (opening + one rebuttal)</option>
          <option value={3}>3 (opening + two rebuttals)</option>
        </select>
        <button onClick={startDebate} disabled={isRunning}>
          {isRunning ? "Debating..." : "Start Debate"}
        </button>
      </div>

      {error && <div className="error-banner" role="alert">{error}</div>}
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
            </div>
          ))}
        </div>
      )}

      {verdict && (
        <div className="verdict-panel">
          <h2>
            Judge&apos;s Verdict
            <span className="confidence-tag">{verdict.confidence} confidence</span>
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
        </div>
      )}
    </main>
  );
}
