"use client";

import { useState, useRef, useEffect } from "react";
import { chatWithDocument } from "@/actions/orchestrate";
import { Message, RetrievedNode } from "@/lib/types";

interface Props {
  docId: string;
  docName: string;
  onRetrievedNodes?: (nodes: RetrievedNode[]) => void;
}

export default function ChatWindow({ docId, docName, onRetrievedNodes }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [lastNodes, setLastNodes] = useState<RetrievedNode[]>([]);
  const [lastThinking, setLastThinking] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { setMessages([]); setLastNodes([]); setLastThinking(""); setSourcesOpen(false); }, [docId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);
    try {
      const result = await chatWithDocument(docId, userMsg.content, newMsgs);
      setMessages(prev => [...prev, { role: "assistant", content: result.answer || "Sorry, no answer found." }]);
      if (Array.isArray(result.retrieved_nodes) && result.retrieved_nodes.length) {
        setLastNodes(result.retrieved_nodes);
        setLastThinking(result.thinking || "");
        onRetrievedNodes?.(result.retrieved_nodes);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "12px", overflow: "hidden",
    }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
        {messages.length === 0 && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "48px 24px", gap: "12px" }}>
            <div style={{ width: "52px", height: "52px", border: "1px solid var(--border)", borderRadius: "14px", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div>
              <p style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>Ask anything</p>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                The tree index navigates to the right page range in <em style={{ color: "var(--text-secondary)" }}>{docName}</em>
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "80%", padding: "10px 14px",
              borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              fontSize: "14px", lineHeight: 1.6,
              background: msg.role === "user" ? "var(--accent)" : "var(--surface-2)",
              color: msg.role === "user" ? "white" : "var(--text-primary)",
              border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex" }}>
            <div style={{ padding: "10px 16px", borderRadius: "16px 16px 16px 4px", background: "var(--surface-2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "10px", color: "var(--text-muted)", fontSize: "13px" }}>
              <span style={{ display: "flex", gap: "4px" }}>
                {[0,1,2].map(i => (
                  <span key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)", display: "inline-block", animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite` }} />
                ))}
              </span>
              Searching tree…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Sources panel — now showing start_index→end_index page ranges */}
      {lastNodes.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}>
          <button onClick={() => setSourcesOpen(o => !o)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--amber)", fontSize: "12px", fontWeight: 500 }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              {lastNodes.length} section{lastNodes.length !== 1 ? "s" : ""} retrieved
              <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                (pp.{Math.min(...lastNodes.map(n => n.start_index))}–{Math.max(...lastNodes.map(n => n.end_index))})
              </span>
            </span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: sourcesOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {sourcesOpen && (
            <div style={{ padding: "0 12px 12px", maxHeight: "220px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
              {lastThinking && (
                <div style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "8px 10px", marginBottom: "4px" }}>
                  <strong style={{ fontStyle: "normal", color: "var(--text-secondary)" }}>Tree reasoning: </strong>{lastThinking}
                </div>
              )}
              {lastNodes.map(node => (
                <div key={node.node_id} style={{ fontSize: "12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{node.title}</span>
                    <span style={{ color: "var(--amber)", fontSize: "11px", background: "var(--amber-dim)", border: "1px solid rgba(245,158,11,0.2)", padding: "1px 6px", borderRadius: "4px", flexShrink: 0 }}>
                      pp.{node.start_index}–{node.end_index}
                    </span>
                  </div>
                  {node.summary && (
                    <p style={{ margin: "0 0 6px", color: "var(--text-secondary)", lineHeight: 1.5, fontStyle: "italic", fontSize: "11px" }}>
                      {node.summary}
                    </p>
                  )}
                  <p style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {node.page_content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} style={{ display: "flex", gap: "10px", padding: "12px 16px", borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
        <input
          type="text" value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask a question about this document…"
          disabled={loading}
          style={{ flex: 1, padding: "9px 14px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "13px", color: "var(--text-primary)", outline: "none", transition: "border-color 0.15s" }}
          onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
          onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
        />
        <button type="submit" disabled={loading || !input.trim()} style={{ width: "38px", height: "38px", background: loading || !input.trim() ? "var(--surface-2)" : "var(--accent)", border: "1px solid var(--border)", borderRadius: "8px", cursor: loading || !input.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={loading || !input.trim() ? "var(--text-muted)" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </form>

      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:scale(0.8);opacity:0.5} 40%{transform:scale(1);opacity:1} }
      `}</style>
    </div>
  );
}
