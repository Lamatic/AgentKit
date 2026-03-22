"use client";

import { useState, useEffect, useCallback } from "react";
import { listDocuments, getDocumentTree } from "@/actions/orchestrate";
import { Document, TreeNode, RetrievedNode } from "@/lib/types";
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

  const fetchDocuments = useCallback(async () => {
    setListLoading(true);
    try {
      const result = await listDocuments();
      if (Array.isArray(result?.documents)) setDocuments(result.documents);
    } catch {
      // silent
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  async function handleSelectDoc(doc: Document) {
    setSelectedDoc(doc);
    setHighlightedIds([]);
    setActiveTab("chat");
    setTreeLoading(true);
    try {
      const result = await getDocumentTree(doc.doc_id);
      if (Array.isArray(result?.tree)) setTree(result.tree);
    } catch {
      setTree([]);
    } finally {
      setTreeLoading(false);
    }
  }

  function handleRetrievedNodes(nodes: RetrievedNode[]) {
    setHighlightedIds(nodes.map((n) => n.node_id));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <header style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
        padding: "0 24px",
        height: "56px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flexShrink: 0,
      }}>
        <div style={{
          width: "32px", height: "32px",
          background: "var(--accent)",
          borderRadius: "8px",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
            PageIndex NotebookLM
          </h1>
          <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)" }}>
            Vectorless RAG · Tree-structured retrieval
          </p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{
            fontSize: "11px", color: "var(--accent-hover)",
            background: "var(--accent-dim)",
            border: "1px solid rgba(99,102,241,0.25)",
            padding: "3px 10px",
            borderRadius: "20px",
            fontWeight: 500,
          }}>
            Powered by PageIndex + Groq
          </span>
        </div>
      </header>

      {/* Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <aside style={{
          width: "260px",
          flexShrink: 0,
          borderRight: "1px solid var(--border)",
          background: "var(--surface)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* Upload */}
          <div style={{ padding: "16px", borderBottom: "1px solid var(--border)" }}>
            <DocumentUpload onUploaded={fetchDocuments} />
          </div>

          {/* Documents list */}
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{
              padding: "12px 16px 8px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Documents
              </span>
              <button
                onClick={fetchDocuments}
                disabled={listLoading}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: "4px", borderRadius: "6px",
                  color: "var(--text-muted)",
                  display: "flex", alignItems: "center",
                  transition: "color 0.15s, background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
                title="Refresh"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ animation: listLoading ? "spin 1s linear infinite" : "none" }}>
                  <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 8px" }}>
              <DocumentList
                documents={documents}
                selectedId={selectedDoc?.doc_id || null}
                onSelect={handleSelectDoc}
              />
            </div>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {selectedDoc ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* Tab bar */}
              <div style={{
                padding: "12px 20px",
                borderBottom: "1px solid var(--border)",
                background: "var(--surface)",
                display: "flex", alignItems: "center", gap: "4px",
              }}>
                {(["chat", "tree"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "8px",
                      border: "none",
                      fontSize: "13px",
                      fontWeight: 500,
                      cursor: "pointer",
                      display: "flex", alignItems: "center", gap: "6px",
                      transition: "all 0.15s",
                      background: activeTab === tab ? "var(--accent)" : "transparent",
                      color: activeTab === tab ? "white" : "var(--text-secondary)",
                    }}
                  >
                    {tab === "chat" ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                      </svg>
                    )}
                    {tab === "chat" ? "Chat" : "Tree Index"}
                    {tab === "tree" && highlightedIds.length > 0 && (
                      <span style={{
                        background: "var(--amber)", color: "#000",
                        fontSize: "10px", fontWeight: 700,
                        padding: "1px 6px", borderRadius: "10px",
                      }}>
                        {highlightedIds.length}
                      </span>
                    )}
                  </button>
                ))}
                <span style={{
                  marginLeft: "auto",
                  fontSize: "12px", color: "var(--text-muted)",
                  maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {selectedDoc.file_name}
                </span>
              </div>

              {/* Content */}
              <div style={{ flex: 1, overflow: "hidden", padding: "20px" }}>
                {activeTab === "chat" ? (
                  <ChatWindow
                    docId={selectedDoc.doc_id}
                    docName={selectedDoc.file_name}
                    onRetrievedNodes={handleRetrievedNodes}
                  />
                ) : (
                  <div style={{ height: "100%", overflowY: "auto" }}>
                    {treeLoading ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", gap: "10px", color: "var(--text-muted)", fontSize: "14px" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                          <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                        </svg>
                        Loading tree…
                      </div>
                    ) : tree.length > 0 ? (
                      <TreeViewer tree={tree} fileName={selectedDoc.file_name} highlightedIds={highlightedIds} />
                    ) : (
                      <div style={{ textAlign: "center", paddingTop: "48px", color: "var(--text-muted)", fontSize: "14px" }}>
                        No tree structure available.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ textAlign: "center", maxWidth: "360px" }}>
                <div style={{
                  width: "64px", height: "64px", margin: "0 auto 20px",
                  background: "var(--surface-2)", border: "1px solid var(--border)",
                  borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                  </svg>
                </div>
                <p style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 600, color: "var(--text-primary)" }}>
                  Select a document
                </p>
                <p style={{ margin: "0 0 24px", fontSize: "14px", color: "var(--text-secondary)" }}>
                  Upload a PDF or pick one from the sidebar to start chatting.
                </p>
                <div style={{
                  background: "var(--surface-2)", border: "1px solid var(--border)",
                  borderRadius: "12px", padding: "16px",
                  fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.7,
                  textAlign: "left",
                }}>
                  <strong style={{ color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>How PageIndex works</strong>
                  Builds a hierarchical tree index — like a table of contents optimised for AI. The LLM navigates the tree to find relevant sections, then fetches verbatim page content. No vectors, no chunking.
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
