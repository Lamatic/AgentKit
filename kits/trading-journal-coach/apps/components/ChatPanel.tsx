"use client";

import { useState } from "react";
import { chatWithJournal } from "@/actions/orchestrate";
import type { Analysis } from "@/lib/types";

type Msg = { role: "user" | "bot"; text: string };
const SUGGEST = ["What's my worst habit?", "How much did revenge trading cost me?", "Am I sizing too big?"];

export default function ChatPanel({ analysis }: { analysis: Analysis }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    setMsgs((m) => [...m, { role: "user", text: question }]);
    setQ("");
    setBusy(true);
    const res = await chatWithJournal(question, analysis);
    setBusy(false);
    setMsgs((m) => [...m, { role: "bot", text: res.ok ? res.answer || "" : res.error || "Something went wrong" }]);
  }

  return (
    <div className="panel chat">
      <h3>Chat with your journal</h3>
      <div className="suggest">
        {SUGGEST.map((s) => (
          <button className="chip" key={s} onClick={() => send(s)} disabled={busy}>
            {s}
          </button>
        ))}
      </div>
      <div className="messages">
        {msgs.length === 0 && (
          <div className="sub" style={{ margin: 0 }}>
            Ask about your patterns, sizing, or your rules.
          </div>
        )}
        {msgs.map((m, i) => (
          <div className={`msg ${m.role}`} key={i}>
            {m.text}
          </div>
        ))}
        {busy && <div className="msg bot">…</div>}
      </div>
      <form
        className="chatbar"
        onSubmit={(e) => {
          e.preventDefault();
          send(q);
        }}
      >
        <input
          aria-label="Ask a question about your journal"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask a question…"
          disabled={busy}
        />
        <button className="btn" type="submit" disabled={busy || !q.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
