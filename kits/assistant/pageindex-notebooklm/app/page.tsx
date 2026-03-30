"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { listDocuments, getDocumentTree } from "@/actions/orchestrate";
import { Document, TreeNode, RetrievedNode } from "@/lib/types";
import { BookOpen } from "lucide-react";
import DocumentUpload from "@/components/DocumentUpload";
import DocumentList from "@/components/DocumentList";
import ChatWindow from "@/components/ChatWindow";
import TreeViewer from "@/components/TreeViewer";

export default function Page() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"chat" | "tree">("chat");
  // Monotonic counter used to cancel stale tree-fetch results
  const treeRequestIdRef = useRef(0);

  const fetchDocuments = useCallback(async () => {
    setListLoading(true);
    try {
      const result = await listDocuments();
      if (Array.isArray(result?.documents)) setDocuments(result.documents);
    } catch { /* silent */ } finally { setListLoading(false); }
  }, []);

  // One-time migration: clear localStorage chat data corrupted by the old
  // persist-effect bug (which wrote one doc's messages into another doc's slot).
  // Bump CHAT_STORAGE_VERSION whenever a breaking change requires a fresh wipe.
  const CHAT_STORAGE_VERSION = "2";
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("chat_storage_version") !== CHAT_STORAGE_VERSION) {
      Object.keys(localStorage)
        .filter(k => k.startsWith("chat_"))
        .forEach(k => localStorage.removeItem(k));
      localStorage.setItem("chat_storage_version", CHAT_STORAGE_VERSION);
    }
  }, []);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  async function handleSelectDoc(doc: Document) {
    setSelectedDoc(doc);
    setHighlightedIds([]);
    setActiveTab("chat");
    setTreeLoading(true);
    // Capture this request's id; if the user selects another doc before this
    // resolves, requestId will no longer match the ref and we discard the result.
    const requestId = ++treeRequestIdRef.current;
    try {
      const result = await getDocumentTree(doc.doc_id);
      if (requestId !== treeRequestIdRef.current) return; // stale — discard
      if (Array.isArray(result?.tree)) setTree(result.tree);
    } catch {
      if (requestId !== treeRequestIdRef.current) return;
      setTree([]);
    } finally {
      if (requestId === treeRequestIdRef.current) setTreeLoading(false);
    }
  }

  function handleRetrievedNodes(nodes: RetrievedNode[]) {
    setHighlightedIds(nodes.map((n) => n.node_id));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg)", overflow: "hidden" }}>

      {/* ── Header ─────────────────────────────────── */}
      <header style={{
        position: "relative",
        height: "54px",
        display: "flex", alignItems: "center",
        padding: "0 20px",
        gap: "10px",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
        flexShrink: 0,
        zIndex: 10,
      }}>
        {/* Logo mark */}
        <div style={{
          width: "30px", height: "30px",
          background: "var(--accent)",
          borderRadius: "8px",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          boxShadow: "0 0 16px rgba(45,212,191,0.3)",
        }}>
          <BookOpen size={15} color="#041a17" strokeWidth={2.5} />
        </div>

        <div>
          <h1 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600, color: "var(--text-1)", letterSpacing: "-0.01em" }}>
            PageIndex
          </h1>
          <p style={{ margin: 0, fontSize: "10.5px", fontFamily: "var(--font-mono)", color: "var(--text-3)", letterSpacing: "0.02em" }}>
            Document Intelligence
          </p>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Live indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{
              width: "6px", height: "6px", borderRadius: "50%", background: "var(--green)",
              animation: "glow-pulse 2s ease-in-out infinite",
              boxShadow: "0 0 6px var(--green)",
            }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)", letterSpacing: "0.05em" }}>
              ONLINE
            </span>
          </div>

          <div style={{ width: "1px", height: "16px", background: "var(--border)" }} />

          <span className="badge badge-accent">
            Groq · PageIndex
          </span>
        </div>

        {/* Accent line bottom */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "1px",
          background: "linear-gradient(90deg, transparent 0%, rgba(45,212,191,0.2) 50%, transparent 100%)",
        }} />
      </header>

      {/* ── Demo notice ── */}
      <div style={{
        padding: "6px 20px",
        background: "rgba(251,191,36,0.07)",
        borderBottom: "1px solid rgba(251,191,36,0.18)",
        display: "flex", alignItems: "center", gap: "8px",
        flexShrink: 0,
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "var(--amber)", letterSpacing: "0.01em" }}>
          Demo project · Document processing is limited to 30–50 pages · Chat history is not stored persistently
        </span>
      </div>

      {/* ── Body ───────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Sidebar ─── */}
        <aside style={{
          width: "252px",
          flexShrink: 0,
          borderRight: "1px solid var(--border)",
          background: "var(--surface)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* Upload zone */}
          <div style={{ padding: "14px 12px", borderBottom: "1px solid var(--border)" }}>
            <DocumentUpload onUploaded={fetchDocuments} />
          </div>

          {/* Documents label */}
          <div style={{
            padding: "14px 16px 8px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span className="section-label">
              Library
            </span>
            <button
              className="btn btn-ghost btn-icon"
              onClick={fetchDocuments}
              disabled={listLoading}
              title="Refresh"
              style={{ width: "26px", height: "26px", borderRadius: "var(--radius-sm)", border: "none" }}
            >
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ animation: listLoading ? "spin 0.9s linear infinite" : "none" }}
              >
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            </button>
          </div>

          {/* Doc list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 12px" }}>
            <DocumentList
              documents={documents}
              selectedId={selectedDoc?.doc_id || null}
              onSelect={handleSelectDoc}
              onDeleted={(deletedDocId) => {
                fetchDocuments();
                setSelectedDoc(prev => prev?.doc_id === deletedDocId ? null : prev);
              }}
            />
          </div>

          {/* Footer brand */}
          <div style={{
            padding: "10px 16px",
            borderTop: "1px solid var(--border)",
            display: "flex", alignItems: "center", gap: "6px",
          }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-3)", letterSpacing: "0.06em" }}>
              VECTORLESS RAG · TREE RETRIEVAL
            </span>
          </div>
        </aside>

        {/* ── Main ─── */}
        <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", background: "var(--bg-alt)" }}>
          {selectedDoc ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

              {/* Tab bar */}
              <div style={{
                padding: "10px 18px",
                borderBottom: "1px solid var(--border)",
                background: "var(--surface)",
                display: "flex", alignItems: "center", gap: "4px",
              }}>
                {(["chat", "tree"] as const).map((tab) => (
                  <button
                    key={tab}
                    className={`tab ${activeTab === tab ? "active" : ""}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === "chat" ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="8" y1="6" x2="21" y2="6"/>
                        <line x1="8" y1="12" x2="21" y2="12"/>
                        <line x1="8" y1="18" x2="21" y2="18"/>
                        <line x1="3" y1="6" x2="3.01" y2="6"/>
                        <line x1="3" y1="12" x2="3.01" y2="12"/>
                        <line x1="3" y1="18" x2="3.01" y2="18"/>
                      </svg>
                    )}
                    {tab === "chat" ? "Chat" : "Tree Index"}
                    {tab === "tree" && highlightedIds.length > 0 && (
                      <span className="badge badge-amber" style={{ padding: "0 5px", fontSize: "9px" }}>
                        {highlightedIds.length}
                      </span>
                    )}
                  </button>
                ))}

                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "var(--text-3)",
                    maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {selectedDoc.file_name}
                  </span>
                </div>
              </div>

              {/* Content — both panels stay mounted to preserve state */}
              <div style={{ flex: 1, overflow: "hidden", padding: "18px", display: activeTab === "chat" ? "block" : "none", height: "100%" }}>
                <ChatWindow
                  key={selectedDoc.doc_id}
                  docId={selectedDoc.doc_id}
                  docName={selectedDoc.file_name}
                  onRetrievedNodes={handleRetrievedNodes}
                />
              </div>
              <div style={{ flex: 1, overflow: "hidden", padding: "18px", display: activeTab === "tree" ? "block" : "none", height: "100%" }}>
                <div style={{ height: "100%", overflowY: "auto" }}>
                  {treeLoading ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", gap: "10px" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-3)" }}>
                        Building tree…
                      </span>
                    </div>
                  ) : tree.length > 0 ? (
                    <TreeViewer tree={tree} fileName={selectedDoc.file_name} highlightedIds={highlightedIds} />
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-3)", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                      No tree structure available.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Empty state */
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ textAlign: "center", maxWidth: "400px", animation: "float-in 0.6s var(--ease) both" }}>
                {/* Large icon */}
                <div style={{
                  width: "72px", height: "72px", margin: "0 auto 24px",
                  background: "var(--surface-1)",
                  border: "1px solid var(--border-md)",
                  borderRadius: "20px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "var(--shadow-md)",
                }}>
                  <BookOpen size={32} color="var(--text-3)" strokeWidth={1.5} />
                </div>

                <p style={{ margin: "0 0 10px", fontSize: "22px", fontWeight: 600, color: "var(--text-1)", letterSpacing: "-0.03em" }}>
                  Select a document
                </p>
                <p style={{ margin: "0 0 28px", fontSize: "14px", color: "var(--text-2)", lineHeight: 1.6 }}>
                  Upload a PDF and pick it from the sidebar to start an AI conversation.
                </p>

                {/* Info card */}
                <div style={{
                  background: "var(--surface-1)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "18px 20px",
                  textAlign: "left",
                  position: "relative", overflow: "hidden",
                }}>
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: "1px",
                    background: "linear-gradient(90deg, transparent, var(--accent), transparent)",
                    opacity: 0.4,
                  }} />
                  <p style={{ margin: "0 0 10px", fontSize: "11.5px", fontWeight: 600, color: "var(--accent)", fontFamily: "var(--font-mono)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    How it works
                  </p>
                  {[
                    ["🌳", "Tree Index", "Builds a hierarchical map of your document like a smart table of contents."],
                    ["🔍", "Agentic Search", "The LLM navigates the tree to find exactly the right section."],
                    ["📄", "Verbatim Retrieval", "Returns exact page content — no chunking, no hallucination."],
                  ].map(([icon, title, desc]) => (
                    <div key={title as string} style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                      <span style={{ fontSize: "14px", flexShrink: 0, marginTop: "1px" }}>{icon}</span>
                      <div>
                        <p style={{ margin: "0 0 1px", fontSize: "12px", fontWeight: 600, color: "var(--text-1)" }}>{title as string}</p>
                        <p style={{ margin: 0, fontSize: "11px", color: "var(--text-2)", lineHeight: 1.5 }}>{desc as string}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
