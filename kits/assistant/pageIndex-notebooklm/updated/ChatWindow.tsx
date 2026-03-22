"use client";

import { useState, useRef, useEffect } from "react";
import { chatWithDocument } from "@/actions/orchestrate";
import { Message, RetrievedNode } from "@/lib/types";
import { Send, Loader2, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import clsx from "clsx";

interface Props {
  docId: string;
  docName: string;
  onRetrievedNodes?: (nodes: RetrievedNode[]) => void;
}

export default function ChatWindow({ docId, docName, onRetrievedNodes }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const [lastNodes, setLastNodes] = useState<RetrievedNode[]>([]);
  const [lastThinking, setLastThinking] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const result = await chatWithDocument(docId, userMsg.content, newMessages);

      const assistantMsg: Message = {
        role: "assistant",
        content: result.answer || "Sorry, I could not find an answer.",
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (result.retrieved_nodes && Array.isArray(result.retrieved_nodes)) {
        setLastNodes(result.retrieved_nodes);
        setLastThinking(result.thinking || "");
        onRetrievedNodes?.(result.retrieved_nodes);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
        <BookOpen className="w-4 h-4 text-indigo-600" />
        <span className="text-sm font-medium text-gray-800 truncate">
          Chatting with: {docName}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            <p className="text-2xl mb-2">💬</p>
            <p className="font-medium text-gray-600">Ask anything about this document</p>
            <p className="mt-1">The tree index will navigate to the right sections.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={clsx(
              "flex",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={clsx(
                "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-sm"
                  : "bg-gray-100 text-gray-800 rounded-bl-sm"
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              <span className="text-sm text-gray-500">Searching document tree...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Retrieved sources panel */}
      {lastNodes.length > 0 && (
        <div className="border-t border-gray-100 bg-amber-50">
          <button
            onClick={() =>
              setExpandedSource(expandedSource ? null : "sources")
            }
            className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors"
          >
            <span>
              Retrieved {lastNodes.length} section{lastNodes.length !== 1 ? "s" : ""} from document
            </span>
            {expandedSource ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {expandedSource && (
            <div className="px-4 pb-3 space-y-2 max-h-48 overflow-y-auto">
              {lastThinking && (
                <div className="text-xs text-amber-700 bg-amber-100 rounded-lg p-2 italic">
                  <span className="font-medium not-italic">Tree reasoning: </span>
                  {lastThinking}
                </div>
              )}
              {lastNodes.map((node) => (
                <div
                  key={node.node_id}
                  className="text-xs bg-white border border-amber-200 rounded-lg p-2"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-800">{node.title}</span>
                    <span className="text-gray-400">pp.{node.start_index}–{node.end_index}</span>
                  </div>
                  <p className="text-gray-600 line-clamp-3">{node.page_content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 p-3 border-t border-gray-100"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about this document..."
          disabled={loading}
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
