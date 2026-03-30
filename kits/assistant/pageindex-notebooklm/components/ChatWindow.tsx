"use client";

import { useState, useRef, useEffect } from "react";
import { chatWithDocument } from "@/actions/orchestrate";
import { ChatResponse, Message, RetrievedNode } from "@/lib/types";
import { MessageSquare, Bot, Search, ChevronDown, Send } from "lucide-react";
import DOMPurify from "dompurify";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

// Lightweight markdown → HTML (no external deps)
function renderMarkdown(text: string): string {
  const html = text
    // Headings
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Bullet list items (* or -)
    .replace(/^[*-] (.+)$/gm, "<li>$1</li>")
    // Numbered list items
    .replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>")
    // Wrap consecutive <li> blocks in <ul>
    .replace(/((?:<li>[\s\S]*?<\/li>\s*)+)/g, (match) => `<ul>${match}</ul>`)
    // Horizontal rule
    .replace(/^---$/gm, "<hr />")
    // Paragraphs: double newline → <p> break
    .replace(/\n{2,}/g, "</p><p>")
    // Single newline → <br />
    .replace(/\n/g, "<br />")
    // Wrap in paragraph
    .replace(/^/, "<p>")
    .replace(/$/, "</p>");
  return DOMPurify.sanitize(html);
}

interface Props {
  docId: string;
  docName: string;
  onRetrievedNodes?: (nodes: RetrievedNode[]) => void;
}

export default function ChatWindow({ docId, docName, onRetrievedNodes }: Props) {
  const storageKey = `chat_${docId}`;
  const historyKey = `chat_history_${docId}`;

  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === "undefined") return [];
    try { const s = localStorage.getItem(storageKey); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [lastNodes, setLastNodes] = useState<RetrievedNode[]>([]);
  const [lastThinking, setLastThinking] = useState("");
  // Raw Lamatic API message history — passed back each turn for multi-turn context
  const [lamaticHistory, setLamaticHistory] = useState<Array<{ role: string; content: string }>>(() => {
    if (typeof window === "undefined") return [];
    try { const s = localStorage.getItem(historyKey); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const bottomRef = useRef<HTMLDivElement>(null);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(messages)); } catch { /* quota exceeded */ }
  }, [messages, storageKey]);

  // Persist lamatic history
  useEffect(() => {
    try { localStorage.setItem(historyKey, JSON.stringify(lamaticHistory)); } catch { /* quota exceeded */ }
  }, [lamaticHistory, historyKey]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  // When docId changes, restore from localStorage (lazy init already handles initial mount)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`chat_${docId}`);
      setMessages(saved ? JSON.parse(saved) : []);
      const savedHistory = localStorage.getItem(`chat_history_${docId}`);
      setLamaticHistory(savedHistory ? JSON.parse(savedHistory) : []);
    } catch {
      setMessages([]);
      setLamaticHistory([]);
    }
    setLastNodes([]); setLastThinking(""); setSourcesOpen(false);
  }, [docId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);
    try {
      const result = await chatWithDocument(docId, userMsg.content, lamaticHistory) as unknown as ChatResponse & { messages: unknown };
      const assistantContent = result.answer || "No answer found.";
      setMessages(prev => [...prev, { role: "assistant", content: assistantContent }]);

      // Update Lamatic history for the next turn
      // Try to use the flow-returned messages first
      let nextHistory: Array<{ role: string; content: string }> | null = null;
      if (result.messages) {
        const parsed = typeof result.messages === "string"
          ? (() => { 
              try { 
                return JSON.parse(result.messages as string); 
              } catch (e) { 
                console.warn("Failed to parse result.messages:", e, result.messages);
                return null; 
              } 
            })()
          : result.messages;
        if (Array.isArray(parsed) && parsed.length) nextHistory = parsed;
      }
      // Fallback: build history from UI messages if flow didn't return it
      if (!nextHistory) {
        nextHistory = [...newMsgs, { role: "assistant", content: assistantContent }].map(m => ({
          role: m.role,
          content: m.content,
        }));
      }
      setLamaticHistory(nextHistory);

      if (Array.isArray(result.retrieved_nodes) && result.retrieved_nodes.length) {
        setLastNodes(result.retrieved_nodes);
        setLastThinking(result.thinking || "");
        onRetrievedNodes?.(result.retrieved_nodes);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally { setLoading(false); }
  }

  return (
    <Card 
      className="flex flex-col h-full overflow-hidden"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--shadow-md)"
      }}
    >

      {/* ── Chat header ── */}
      <div style={{
        padding: "12px 16px",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: "10px",
        flexShrink: 0,
        background: "var(--surface-1)",
      }}>
        <div style={{
          width: "8px", height: "8px", borderRadius: "50%",
          background: loading ? "var(--amber)" : "var(--green)",
          boxShadow: loading ? "0 0 8px var(--amber)" : "0 0 8px var(--green)",
          transition: "all 0.3s",
        }} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-2)", letterSpacing: "0.03em" }}>
          {loading ? "Searching tree…" : "READY"}
        </span>
        <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {docName}
        </span>
      </div>

      {/* ── Messages ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 18px", display: "flex", flexDirection: "column", gap: "14px" }}>

        {messages.length === 0 && (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            textAlign: "center", padding: "48px 24px", gap: "16px",
            animation: "float-in 0.5s var(--ease) both",
          }}>
            <div style={{
              width: "54px", height: "54px",
              background: "var(--surface-2)",
              border: "1px solid var(--border-md)",
              borderRadius: "var(--radius-lg)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <MessageSquare size={22} color="var(--text-3)" strokeWidth={1.5} />
            </div>
            <div>
              <p style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: 600, color: "var(--text-1)", letterSpacing: "-0.02em" }}>
                Ask anything
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-2)", lineHeight: 1.6, maxWidth: "260px" }}>
                The tree index navigates to the right section in{" "}
                <em style={{ color: "var(--accent)", fontStyle: "normal" }}>{docName}</em>
              </p>
            </div>

            {/* Suggested prompts */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center", maxWidth: "340px" }}>
              {["Summarize this document", "What are the key findings?", "Explain the main argument"].map(q => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  style={{
                    padding: "5px 11px", borderRadius: "20px",
                    background: "var(--surface-2)", border: "1px solid var(--border)",
                    color: "var(--text-2)", fontSize: "12px", cursor: "pointer",
                    transition: "all 0.18s var(--ease)", fontFamily: "var(--font-display)",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(45,212,191,0.3)"; e.currentTarget.style.color = "var(--accent)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-2)"; }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              animation: msg.role === "user" ? "msg-in-user 0.3s var(--ease) both" : "msg-in-ai 0.3s var(--ease) both",
            }}
          >
            {msg.role === "assistant" && (
              <div style={{
                width: "26px", height: "26px", borderRadius: "8px",
                background: "var(--accent-dim)", border: "1px solid rgba(45,212,191,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, alignSelf: "flex-end", margin: "0 8px 2px 0",
              }}>
                <Bot size={11} color="var(--accent)" strokeWidth={2.5} />
              </div>
            )}
            <div style={{
              maxWidth: "78%",
              padding: msg.role === "user" ? "10px 14px" : "12px 16px",
              borderRadius: msg.role === "user"
                ? "18px 18px 5px 18px"
                : "18px 18px 18px 5px",
              fontSize: "14px", lineHeight: 1.65,
              background: msg.role === "user"
                ? "var(--accent)"
                : "var(--surface-2)",
              color: msg.role === "user" ? "#041a17" : "var(--text-1)",
              fontWeight: msg.role === "user" ? 500 : 400,
              border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
              boxShadow: msg.role === "user" ? "0 4px 14px rgba(45,212,191,0.2)" : "none",
              letterSpacing: "-0.005em",
            }}
            {...(msg.role === "assistant"
              ? { dangerouslySetInnerHTML: { __html: renderMarkdown(msg.content) } }
              : { children: msg.content }
            )}
            />
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
            <div style={{
              width: "26px", height: "26px", borderRadius: "8px",
              background: "var(--accent-dim)", border: "1px solid rgba(45,212,191,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Bot size={11} color="var(--accent)" strokeWidth={2.5} />
            </div>
            <div style={{ padding: "12px 16px", borderRadius: "18px 18px 18px 5px", background: "var(--surface-2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ display: "flex", gap: "5px" }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    width: "5px", height: "5px", borderRadius: "50%",
                    background: "var(--accent)", display: "inline-block",
                    animation: `pulse-dot 1.2s ${i * 0.18}s ease-in-out infinite`,
                  }} />
                ))}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-3)" }}>
                navigating tree
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Sources panel ── */}
      {lastNodes.length > 0 && (
        <Collapsible 
          open={sourcesOpen}
          onOpenChange={setSourcesOpen}
          style={{ borderTop: "1px solid var(--border)", background: "var(--surface-1)" }}
        >
          <CollapsibleTrigger asChild>
            <button
              style={{
                width: "100%", background: "none", border: "none", cursor: "pointer",
                padding: "9px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
                color: "var(--amber)", outline: "none",
              }}
            >
            <span style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <Search size={12} strokeWidth={2} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", fontWeight: 500, letterSpacing: "0.04em" }}>
                {lastNodes.length} SECTION{lastNodes.length !== 1 ? "S" : ""} RETRIEVED
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)" }}>
                pp.{Math.min(...lastNodes.map(n => n.start_index))}–{Math.max(...lastNodes.map(n => n.end_index))}
              </span>
            </span>
            <ChevronDown size={13} strokeWidth={2.5} style={{ transform: sourcesOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.22s var(--ease)" }} />
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div style={{ padding: "0 12px 12px", maxHeight: "220px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
              {lastThinking && (
                <div style={{
                  fontSize: "11px", color: "var(--text-2)", fontStyle: "italic",
                  background: "var(--surface-2)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)", padding: "10px 12px", marginBottom: "4px",
                  borderLeft: "2px solid var(--accent)",
                }}>
                  <strong style={{ fontStyle: "normal", color: "var(--text-2)", fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    Tree reasoning
                  </strong>
                  <br />
                  <span style={{ marginTop: "4px", display: "block", lineHeight: 1.5 }}>{lastThinking}</span>
                </div>
              )}
              {lastNodes.map(node => (
                <div key={node.node_id} style={{
                  fontSize: "12px",
                  background: "var(--surface-2)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)", padding: "10px 12px",
                  transition: "border-color 0.18s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-1)", fontSize: "12.5px" }}>{node.title}</span>
                    <span className="badge badge-amber">pp.{node.start_index}–{node.end_index}</span>
                  </div>
                  {node.summary && (
                    <p style={{ margin: "0 0 5px", color: "var(--text-2)", lineHeight: 1.5, fontStyle: "italic", fontSize: "11px" }}>
                      {node.summary}
                    </p>
                  )}
                  <p style={{ margin: 0, color: "var(--text-3)", lineHeight: 1.5, fontSize: "11px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {node.page_content}
                  </p>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* ── Input ── */}
      <form
        onSubmit={handleSend}
        style={{
          display: "flex", gap: "8px", padding: "12px 14px",
          borderTop: "1px solid var(--border)",
          background: "var(--surface-1)",
          flexShrink: 0,
        }}
      >
        <input
          className="input"
          type="text" value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask a question about this document…"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn btn-accent btn-icon"
          style={{ width: "42px", height: "42px" }}
          title="Send"
        >
          <Send size={15} strokeWidth={2.5} />
        </button>
      </form>
    </Card>
  );
}
