"use client";

import { useState } from "react";
import { getBottleneckBrief, askAboutOrder, type Order, OrderStat } from "@/actions/orchestrate";

const sampleOrders: Order[] = [
  { id: "PO-014", dueDate: "2026-07-25", stages: ["Cutting", "Assembly", "Finishing", "Packing"], currentStage: "Assembly", stageEnteredDate: "2026-07-10", quantity: "500", completedQuantity: "210" },
  { id: "PO-015", dueDate: "2026-08-15", stages: ["Cutting", "Assembly", "Finishing", "Packing"], currentStage: "Cutting", stageEnteredDate: "2026-07-16", quantity: "300", completedQuantity: "290" },
  { id: "PO-016", dueDate: "2026-07-18", stages: ["Cutting", "Assembly", "Finishing", "Packing"], currentStage: "Finishing", stageEnteredDate: "2026-07-05", quantity: "800", completedQuantity: "400" },
];

export default function Home() {
  const [ordersText, setOrdersText] = useState(JSON.stringify(sampleOrders, null, 2));
  const [brief, setBrief] = useState("");
  const [stats, setStats] = useState<OrderStat[]>([])
  const [briefError, setBriefError] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const [orderId, setOrderId] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [answerError, setAnswerError] = useState(false);
  const [asking, setAsking] = useState(false);

  async function handleAnalyze() {
    setAnalyzing(true);
    setBriefError(false);
    try {
      const orders: Order[] = JSON.parse(ordersText);
      const result = await getBottleneckBrief(orders);
      setBrief(result.brief);
      setStats(result.stats);
    } catch {
      setBrief("Couldn't parse or analyze that order data — check it's valid JSON.");
      setBriefError(true);
    }
    setAnalyzing(false);
  }

  function severity(s: OrderStat) {
    if (s.daysUntilDue < 0) return { label: "Overdue", color: "red" };
    if (s.atRisk) return { label: "At Risk", color: "yellow" };
    return { label: "On Track", color: "green" };
  }

  async function handleAsk() {
    if (!orderId.trim() || !question.trim() || asking) return;
    setAsking(true);
    setAnswerError(false);
    try {
      const orders: Order[] = JSON.parse(ordersText);
      setAnswer(await askAboutOrder(orders, orderId, question));
    } catch {
      setAnswer("Something went wrong asking about that order.");
      setAnswerError(true);
    }
    setAsking(false);
  }

  function handleQuestionKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleAsk();
  }

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
            Drop in order data from your factory floor or ERP and get a prioritized,
            plain-English brief on what's at risk — then ask follow-up questions about
            any specific order.
          </p>
        </div>

        <div className="grid">
          <div className="card">
            <h2>Order Data</h2>
            <textarea value={ordersText} onChange={(e) => setOrdersText(e.target.value)} rows={10} />
            <div className="button-row">
              <button onClick={handleAnalyze} disabled={analyzing}>
                {analyzing ? (<><span className="spinner" />Analyzing</>) : "Analyze"}
              </button>
            </div>
            <p className="hint">
              Expects an array of orders with id, dueDate, stages, currentStage,
              stageEnteredDate, quantity, and completedQuantity — the fields most
              ERPs already track per order. See the README for the full schema.
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
          </div>

          <div className="card">
            <h2>Ask About a Specific Order</h2>
            <div className="qa-fields">
              <input
                placeholder="Order ID (e.g. PO-016)"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              />
              <input
                placeholder="Your question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleQuestionKeyDown}
              />
              <button onClick={handleAsk} disabled={asking}>
                {asking ? (<><span className="spinner" />Asking</>) : "Ask"}
              </button>
            </div>
            <p className="hint">Try: PO-016 — "Why is this order flagged?"</p>

            {answer && <div className={`result ${answerError ? "error" : ""}`}>{answer}</div>}
          </div>
        </div>
      </div>
    </>
  );
}