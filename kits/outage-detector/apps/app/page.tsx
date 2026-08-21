"use client";

import { useState, useEffect } from "react";
import { processTicket } from "@/actions/orchestrate";
import type { TicketPayload, FlowResult } from "@/lib/lamatic-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    <div className="mx-auto max-w-[880px] px-6 pb-20 pt-10">
      <h1 className="text-2xl font-semibold mb-1">Outage Detector</h1>
      <p className="text-muted text-[0.95rem] leading-relaxed mb-7">
        Steps through {tickets.length || "..."} synthetic tickets one at a
        time. Each submission both queries and writes to the flow&apos;s
        vector store, so the store builds up as you go — a hidden cluster
        (T-1005, T-1007, T-1011) and two decoys (T-1009, T-1017) are in
        there. Watch the right panel for when it catches on.
      </p>

      <Button onClick={stepForward} disabled={loading || index >= tickets.length}>
        {loading ? "Processing…" : `Submit next ticket (${index}/${tickets.length})`}
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
        <div className="bg-panel border border-panel-border rounded-[10px] p-4">
          <h3 className="mt-0 mb-3 text-sm uppercase tracking-wide text-muted">
            Ticket queue
          </h3>
          {(() => {
            const sliceStart = Math.max(0, index - 1);
            return tickets.slice(sliceStart, index + 3).map((t, i) => (
              <div
                key={t.ticket_id}
                className={cn(
                  "py-2.5 text-[0.9rem] border-b border-panel-border last:border-none",
                  sliceStart + i === index && "text-foreground font-semibold"
                )}
              >
                <strong>{t.ticket_id}</strong> · {t.account_name} ({t.account_tier})
                <div>{t.subject}</div>
              </div>
            ));
          })()}
        </div>

        <div className="bg-panel border border-panel-border rounded-[10px] p-4">
          <h3 className="mt-0 mb-3 text-sm uppercase tracking-wide text-muted">
            Flow output
          </h3>
          {log.length === 0 && <p>No tickets submitted yet.</p>}
          {log.map((entry, i) => {
            const flagged = entry.result.status === "Condition 1";
            return (
              <div
                key={i}
                className="py-2.5 text-[0.9rem] border-b border-panel-border last:border-none"
              >
                <span
                  className={cn(
                    "inline-block px-2 py-0.5 rounded-full text-xs font-semibold mr-2",
                    flagged
                      ? "bg-flagged text-flagged-foreground"
                      : "bg-normal text-normal-foreground"
                  )}
                >
                  {flagged ? "flagged" : "normal"}
                </span>
                <strong>{entry.ticket.ticket_id}</strong> — {entry.ticket.subject}
                <div className="mt-1 text-[0.85rem] text-subtle">
                  <span className="text-dim">Confidence:</span> {entry.result.confidence}
                </div>
                {entry.result.matched_ticket_ids.length > 0 && (
                  <div className="mt-1 text-[0.85rem] text-subtle">
                    <span className="text-dim">Matched:</span>{" "}
                    {entry.result.matched_ticket_ids.join(", ")}
                  </div>
                )}
                {entry.result.suspected_component && (
                  <div className="mt-1 text-[0.85rem] text-subtle">
                    <span className="text-dim">Suspected component:</span>{" "}
                    {entry.result.suspected_component}
                  </div>
                )}
                {entry.result.reasoning && (
                  <div className="mt-1 text-[0.85rem] text-subtle">{entry.result.reasoning}</div>
                )}
                {flagged && entry.result.internal_note && (
                  <div className="mt-1 text-[0.85rem] text-subtle">
                    <span className="text-dim">Internal note:</span>{" "}
                    {entry.result.internal_note}
                  </div>
                )}
                {flagged && entry.result.customer_message && (
                  <div className="mt-1 text-[0.85rem] text-subtle">
                    <span className="text-dim">Customer message:</span>{" "}
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

