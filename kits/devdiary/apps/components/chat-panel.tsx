"use client";

import { useRef, useState } from "react";
import { Loader2, MessageSquareText, Send, CalendarRange } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { askDiary } from "@/actions/orchestrate";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const DIGEST_QUERY =
  "Give me a weekly digest: summarize everything I worked on in the last 7 days, grouped by project, in chronological order.";

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function send(query: string) {
    if (!query.trim() || loading) return;
    setMessages((prev) => [...prev, { role: "user", content: query }]);
    setInput("");
    setLoading(true);

    const result = await askDiary(query);
    setLoading(false);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: result.success && result.data ? result.data.answer : `⚠️ ${result.error ?? "Something went wrong"}`,
      },
    ]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  return (
    <section className="flex h-full min-h-[480px] flex-col rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
      <div className="mb-1 flex items-center gap-2">
        <MessageSquareText className="h-5 w-5 text-sky-500" />
        <h2 className="text-lg font-semibold text-zinc-100">Ask your diary</h2>
      </div>
      <p className="mb-4 text-sm text-zinc-400">
        &quot;What did I work on last week?&quot; · &quot;When did I touch the auth flow?&quot;
      </p>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-sm text-zinc-600">
            Your work history is one question away.
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={
              msg.role === "user"
                ? "ml-8 rounded-xl bg-sky-950/40 border border-sky-900/50 px-4 py-2.5 text-sm text-sky-100"
                : "mr-8 rounded-xl bg-zinc-900/70 border border-zinc-800 px-4 py-2.5 text-sm text-zinc-200"
            }
          >
            <div className="prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && (
          <div className="mr-8 flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Searching your diary...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => send(DIGEST_QUERY)}
          disabled={loading}
          title="Weekly digest"
          className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300 transition hover:border-sky-700 hover:text-sky-300 disabled:opacity-40"
        >
          <CalendarRange className="h-3.5 w-3.5" /> Weekly digest
        </button>
        <input
          className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-sky-600 disabled:opacity-50"
          placeholder="Ask about your work..."
          value={input}
          disabled={loading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && send(input)}
        />
        <button
          onClick={() => send(input)}
          disabled={loading || !input.trim()}
          className="rounded-lg bg-sky-600 px-3 py-2 text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
