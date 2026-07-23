"use client";

import { useState } from "react";
import { getBottleneckBrief, askAboutOrder, type Order, OrderStat } from "@/actions/orchestrate";

const sampleOrders: Order[] = [
  { id: "PO-014", dueDate: "2026-07-25", stages: ["Cutting", "Assembly", "Finishing", "Packing"], currentStage: "Assembly", stageEnteredDate: "2026-07-10", quantity: "500", completedQuantity: "210" },
  { id: "PO-015", dueDate: "2026-08-15", stages: ["Cutting", "Assembly", "Finishing", "Packing"], currentStage: "Cutting", stageEnteredDate: "2026-07-16", quantity: "300", completedQuantity: "290" },
  { id: "PO-016", dueDate: "2026-07-18", stages: ["Cutting", "Assembly", "Finishing", "Packing"], currentStage: "Finishing", stageEnteredDate: "2026-07-05", quantity: "800", completedQuantity: "400" },
];

type ChatMessage = { role: "user" | "assistant"; content: string };

export default function Home() {
  const [ordersText, setOrdersText] = useState(JSON.stringify(sampleOrders, null, 2));
  const [brief, setBrief] = useState("");
  const [stats, setStats] = useState<OrderStat[]>([]);
  const [briefError, setBriefError] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const [emailDraft, setEmailDraft] = useState("");
  const [showEmailDraft, setShowEmailDraft] = useState(false);
  const [copied, setCopied] = useState(false);

  const [orderId, setOrderId] = useState("");
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>({});

  async function handleAnalyze() {
    setAnalyzing(true);
    setBriefError(false);
    setShowEmailDraft(false);
    setCopied(false);
    try {
      const orders: Order[] = JSON.parse(ordersText);
      const result = await getBottleneckBrief(orders);
      setBrief(result.brief);
      setStats(result.stats);
      setEmailDraft(result.emailDraft ?? "");
    } catch {
      setBrief("Couldn't parse or analyze that order data — check it's valid JSON.");
      setBriefError(true);
      setStats([]);
      setEmailDraft("");
    }
    setAnalyzing(false);
  }

  function severity(s: OrderStat) {
    if (s.error || s.daysUntilDue === undefined) return { label: "Invalid Data", color: "red" };
    if (s.daysUntilDue < 0) return { label: "Overdue", color: "red" };
    if (s.atRisk) return { label: "At Risk", color: "yellow" };
    return { label: "On Track", color: "green" };
  }

  async function handleAsk() {
    if (!orderId.trim() || !question.trim() || asking) return;
    const id = orderId.trim();
    setAsking(true);

    const userMsg: ChatMessage = { role: "user", content: question };
    setChats((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), userMsg] }));
    const askedQuestion = question;
    setQuestion("");

    try {
      const orders: Order[] = JSON.parse(ordersText);
      const answer = await askAboutOrder(orders, id, askedQuestion);
      setChats((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), { role: "assistant", content: answer }] }));
    } catch {
      setChats((prev) => ({
        ...prev,
        [id]: [...(prev[id] ?? []), { role: "assistant", content: "Something went wrong asking about that order." }],
      }));
    }
    setAsking(false);
  }

  function handleQuestionKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleAsk();
  }

  const activeThread = orderId.trim() ? chats[orderId.trim()] ?? [] : [];

  return (
    <>
      <nav className="nav">
        <span className="nav-brand">Built with Lamatic AgentKit</span>
        <div className="nav-flows">
          <span className="pill">⚡ Lamatic Flow: Production Brief</span>
          <span className="pill">⚡ Lamatic Flow: Order Q&A</span>
        </div>
      </nav>

      <div className="container">
        <div className="header">
          <span className="eyebrow">Floor Ops Briefing</span>
          <h1>Production <span className="accent-word">Bottleneck</span> Brief</h1>
          <p>
            Drop in order data and get a prioritized brief on what's at risk —
            then ask follow-up questions about any specific order.
          </p>
        </div>

        <div className="grid">
          <div className="card">
            <h2>Order Data</h2>
            <div className="integration-note">
              <span className="integration-dot" />
              Demo input — in production this feeds from your ERP or database via API
            </div>
            <textarea value={ordersText} onChange={(e) => setOrdersText(e.target.value)} rows={10} />
            <div className="button-row">
              <button onClick={handleAnalyze} disabled={analyzing}>
                {analyzing ? (<><span className="spinner" />Analyzing</>) : "Analyze"}
              </button>
            </div>
            <p className="hint">
              Expects an array of orders with id, dueDate, stages, currentStage,
              stageEnteredDate, quantity, and completedQuantity.
            </p>

            {stats.length > 0 && (
              <div className="table-wrap">
                <table className="stats-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Stage</th>
                      <th>Days Left</th>
                      <th>% Complete</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map((s) => {
                      if (s.error) {
                        return (
                          <tr key={s.id} className="row-error">
                            <td className="mono">{s.id}</td>
                            <td colSpan={3}>{s.error}</td>
                            <td><span className="badge badge-red">Data Error</span></td>
                          </tr>
                        );
                      }
                      const sev = severity(s);
                      return (
                        <tr key={s.id}>
                          <td className="mono">{s.id}</td>
                          <td>{s.currentStage}</td>
                          <td className="mono">{s.daysUntilDue}</td>
                          <td className="mono">{s.pctComplete}%</td>
                          <td><span className={`badge badge-${sev.color}`}>{sev.label}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {brief && <div className={`result ${briefError ? "error" : ""}`}>{brief}</div>}

            {emailDraft && (
              <div className="email-draft">
                <button
                  className="email-draft-toggle"
                  onClick={() => setShowEmailDraft(!showEmailDraft)}
                >
                  <span className="email-draft-icon">✉</span>
                  <span className="email-draft-title">
                    {showEmailDraft ? "Email Draft" : "Email Draft Ready"}
                  </span>
                  <span className={`email-draft-chevron ${showEmailDraft ? "open" : ""}`}>▾</span>
                </button>

                {showEmailDraft && (
                  <div className="email-draft-body">
                    <div className="email-draft-label">Draft — not sent</div>
                    <pre className="email-body">{emailDraft}</pre>
                    <div className="button-row">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(emailDraft);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1500);
                        }}
                      >
                        {copied ? "Copied ✓" : "Copy to Clipboard"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="card">
            <h2>Ask About a Specific Order</h2>
            <input
              placeholder="Order ID (e.g. PO-016)"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="order-id-input"
            />

            <div className="chat-thread">
              {activeThread.length === 0 ? (
                <div className="chat-empty">
                  {orderId.trim() ? `No questions asked about ${orderId.trim()} yet.` : "Enter an order ID to start a thread."}
                </div>
              ) : (
                <>
                  <div className="chat-thread-label">Thread for {orderId.trim()}</div>
                  {activeThread.map((msg, i) => (
                    <div key={i} className={`chat-bubble chat-${msg.role}`}>
                      {msg.content}
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="qa-input-wrap">
              <input
                placeholder="Your question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleQuestionKeyDown}
                className="qa-question-input"
              />
              <button className="qa-send-btn" onClick={handleAsk} disabled={asking} aria-label="Ask">
                {asking ? <span className="spinner spinner-inline" /> : <span className="send-icon">➤</span>}
              </button>
            </div>
            <p className="hint">Try: PO-016 — "Why is this order flagged?" then "What should I do about it?"</p>
          </div>
        </div>
      </div>
    </>
  );
}