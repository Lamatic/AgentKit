"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = {
  role: "customer" | "assistant";
  text: string;
};

type Slot = { date: string; time: string };

type Phase = "intake" | "awaiting_confirmation" | "confirmed";

export default function Home() {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Hi! What service would you like to book, and for when?",
    },
  ]);
  const [phase, setPhase] = useState<Phase>("intake");
  const [proposedSlots, setProposedSlots] = useState<Slot[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, proposedSlots]);

  function appendAssistant(text: string) {
    setMessages((prev) => [...prev, { role: "assistant", text }]);
  }

  async function runScheduling() {
    const res = await fetch("/api/scheduling", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Scheduling Agent call failed");

    appendAssistant(data.message);
    const slots = data.proposed_slots ?? [];
    setProposedSlots(slots);
    setPhase(slots.length > 0 ? "awaiting_confirmation" : "intake");
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "customer", text }]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Intake Agent call failed");

      if (data.needs_clarification) {
        appendAssistant(data.clarifying_question);
      } else {
        appendAssistant("Got it — let me check availability for you.");
        await runScheduling();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmSlot(slot: Slot) {
    if (loading) return;
    setLoading(true);
    setError(null);

    setMessages((prev) => [
      ...prev,
      { role: "customer", text: `I'll take ${slot.date} at ${slot.time}.` },
    ]);
    setProposedSlots([]);

    try {
      const res = await fetch("/api/confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, confirmed_slot: slot }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Confirmation Agent call failed");

      appendAssistant(data.confirmation_message);
      setPhase(data.booked ? "confirmed" : "awaiting_confirmation");
      if (!data.booked) {
        // Slot was taken in the meantime — let the customer pick again.
        await runScheduling();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      // Whatever failed, there are no slots left on screen to click and phase may still be
      // "awaiting_confirmation" from before this call — fall back to "intake" so the customer
      // can type a new request instead of being stuck behind a disabled input.
      setPhase("intake");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 p-4 dark:border-zinc-800">
        <h1 className="text-lg font-semibold text-black dark:text-zinc-50">
          Local Service Booking Agent
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Demo chat — Intake → Scheduling → Confirmation
        </p>
      </header>

      <main aria-live="polite" className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              m.role === "customer"
                ? "ml-auto bg-black text-zinc-50 dark:bg-zinc-50 dark:text-black"
                : "bg-zinc-200 text-black dark:bg-zinc-800 dark:text-zinc-50"
            }`}
          >
            {m.text}
          </div>
        ))}

        {phase === "awaiting_confirmation" && proposedSlots.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {proposedSlots.map((slot, i) => (
              <button
                key={i}
                type="button"
                disabled={loading}
                onClick={() => handleConfirmSlot(slot)}
                className="rounded-full border border-zinc-300 px-3 py-1 text-sm text-black hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
              >
                {slot.date} at {slot.time}
              </button>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div ref={bottomRef} />
      </main>

      {phase !== "confirmed" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2 border-t border-zinc-200 p-4 dark:border-zinc-800"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading || phase !== "intake"}
            aria-label="Chat message"
            placeholder={
              phase === "intake" ? "Type a message…" : "Pick a slot above to continue"
            }
            className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
          <button
            type="submit"
            disabled={loading || phase !== "intake"}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-zinc-50 disabled:opacity-50 dark:bg-zinc-50 dark:text-black"
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
}
