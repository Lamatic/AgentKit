"use client";

import { useState, useEffect } from "react";
import { processTicket } from "@/actions/orchestrate";
import type { TicketPayload, FlowResult } from "@/lib/lamatic-client";

type LogEntry = { ticket: TicketPayload; result: FlowResult };

export default function Page() {
  const [tickets, setTickets] = useState<TicketPayload[]>([]);
  const [index, setIndex] = useState(0);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/data/synthetic_tickets.json")
      .then((r) => r.json())
      .then((data) => setTickets(data.tickets));
  }, []);

  // NOTE: this app sends only the current ticket — no client-side batching.
  // The real flow does correlation server-side: Vector Search
  // (searchNode_739) retrieves candidates from the flow's own vector store,
  // and the ticket is also indexed into that store on every submission
  // (vectorizeNode_148 → vectorNode_896), so the store builds up as you
  // step through the queue.
  async function stepForward() {
    if (index >= tickets.length) return;
    setLoading(true);
    const ticket = tickets[index];
    const result = await processTicket(ticket);
    setLog((prev) => [{ ticket, result }, ...prev]);
    setIndex((i) => i + 1);
    setLoading(false);
  }

  return (
    <div className="container">
      <h1>Outage Detector</h1>
      <p className="subtitle">
        Steps through {tickets.length || "..."} synthetic tickets one at a
        time. Each submission both queries and writes to the flow's vector
        store, so the store builds up as you go — a hidden cluster
        (T-1005, T-1007, T-1011) and two decoys (T-1009, T-1017) are in
        there. Watch the right panel for when it catches on.
      </p>

      <button onClick={stepForward} disabled={loading || index >= tickets.length}>
        {loading ? "Processing…" : `Submit next ticket (${index}/${tickets.length})`}
      </button>

      <div className="grid">
        <div className="panel">
          <h3>Ticket queue</h3>
          {tickets.slice(Math.max(0, index - 1), index + 3).map((t, i) => (
            <div key={t.ticket_id} className={`ticket-row ${i === 1 ? "active" : ""}`}>
              <strong>{t.ticket_id}</strong> · {t.account_name} ({t.account_tier})
              <div>{t.subject}</div>
            </div>
          ))}
        </div>

        <div className="panel">
          <h3>Flow output</h3>
          {log.length === 0 && <p>No tickets submitted yet.</p>}
          {log.map((entry, i) => {
            const flagged = entry.result.status === "Condition 1";
            return (
              <div key={i} className="ticket-row">
                <span className={`badge ${flagged ? "flagged" : "normal"}`}>
                  {flagged ? "flagged" : "normal"}
                </span>
                <strong>{entry.ticket.ticket_id}</strong> — {entry.ticket.subject}
                <div className="detail-row">
                  <span className="detail-label">Confidence:</span> {entry.result.confidence}
                </div>
                {entry.result.matched_ticket_ids.length > 0 && (
                  <div className="detail-row">
                    <span className="detail-label">Matched:</span>{" "}
                    {entry.result.matched_ticket_ids.join(", ")}
                  </div>
                )}
                {entry.result.suspected_component && (
                  <div className="detail-row">
                    <span className="detail-label">Suspected component:</span>{" "}
                    {entry.result.suspected_component}
                  </div>
                )}
                {entry.result.reasoning && (
                  <div className="detail-row">{entry.result.reasoning}</div>
                )}
                {flagged && entry.result.internal_note && (
                  <div className="detail-row">
                    <span className="detail-label">Internal note:</span>{" "}
                    {entry.result.internal_note}
                  </div>
                )}
                {flagged && entry.result.customer_message && (
                  <div className="detail-row">
                    <span className="detail-label">Customer message:</span>{" "}
                    {entry.result.customer_message}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
