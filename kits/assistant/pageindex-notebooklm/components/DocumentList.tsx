"use client";

import { useState } from "react";
import { Document } from "@/lib/types";
import { deleteDocument } from "@/actions/orchestrate";

interface Props {
  documents: Document[];
  selectedId: string | null;
  onSelect: (doc: Document) => void;
  onDeleted?: () => void;
}

export default function DocumentList({ documents, selectedId, onSelect, onDeleted }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(doc_id: string) {
    setDeletingId(doc_id);
    setConfirmId(null);
    try {
      await deleteDocument(doc_id);
      onDeleted?.();
    } catch {
      // silently ignore — list refresh will reflect reality
    } finally {
      setDeletingId(null);
    }
  }

  if (documents.length === 0) {
    return (
      <div style={{ padding: "28px 12px", textAlign: "center" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ margin: "0 auto 10px", display: "block" }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <p style={{ margin: "0 0 3px", fontSize: "12px", color: "var(--text-2)", fontWeight: 500 }}>
          No documents yet
        </p>
        <p style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)" }}>
          Upload a PDF to get started
        </p>
      </div>
    );
  }

  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
      {documents.map((doc, idx) => {
        const active = selectedId === doc.doc_id;
        const isConfirming = confirmId === doc.doc_id;
        const isDeleting = deletingId === doc.doc_id;

        return (
          <li key={doc.doc_id} style={{ animation: `float-in 0.3s ${idx * 0.04}s var(--ease) both`, position: "relative" }}>
            <button
              onClick={() => !isConfirming && onSelect(doc)}
              style={{
                width: "100%", textAlign: "left",
                padding: "9px 10px",
                borderRadius: "var(--radius-md)",
                border: active ? "1px solid rgba(45,212,191,0.3)" : "1px solid transparent",
                background: active ? "var(--accent-dim)" : "transparent",
                cursor: isConfirming ? "default" : "pointer",
                display: "flex", alignItems: "flex-start", gap: "9px",
                transition: "all 0.18s var(--ease)",
                outline: "none",
              }}
              onMouseEnter={e => { if (!active && !isConfirming) e.currentTarget.style.background = "var(--surface-2)"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? "var(--accent-dim)" : "transparent"; }}
            >
              {/* File icon */}
              <div style={{
                width: "28px", height: "28px", borderRadius: "7px", flexShrink: 0,
                background: active ? "rgba(45,212,191,0.15)" : "var(--surface-3)",
                border: `1px solid ${active ? "rgba(45,212,191,0.25)" : "var(--border)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginTop: "1px", transition: "all 0.18s var(--ease)",
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke={active ? "var(--accent)" : "var(--text-3)"}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{
                  margin: "0 0 2px", fontSize: "12.5px", fontWeight: 500,
                  color: active ? "var(--accent)" : "var(--text-1)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  letterSpacing: "-0.01em", transition: "color 0.18s",
                }}>
                  {doc.file_name}
                </p>
                <p style={{
                  margin: 0, fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)",
                  letterSpacing: "0.01em",
                }}>
                  {doc.tree_node_count} nodes · {new Date(doc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>

              {/* Inline trash icon / spinner */}
              <div style={{ marginLeft: "auto", flexShrink: 0, display: "flex", alignItems: "center", marginTop: "1px" }}>
                {isDeleting ? (
                  <svg style={{ animation: "spin 0.8s linear infinite" }} width="13" height="13" viewBox="0 0 24 24"
                    fill="none" stroke="var(--text-3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                ) : !isConfirming ? (
                  <div
                    onClick={e => { e.stopPropagation(); setConfirmId(doc.doc_id); }}
                    title="Delete document"
                    className="doc-delete-btn"
                    style={{
                      width: "22px", height: "22px", borderRadius: "var(--radius-sm)",
                      border: "1px solid transparent",
                      background: "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", opacity: 0,
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.opacity = "1";
                      e.currentTarget.style.background = "rgba(248,113,113,0.12)";
                      e.currentTarget.style.borderColor = "rgba(248,113,113,0.3)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.opacity = "0";
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.borderColor = "transparent";
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                      stroke="var(--red)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6M14 11v6"/>
                      <path d="M9 6V4h6v2"/>
                    </svg>
                  </div>
                ) : (
                  <div style={{
                    width: "4px", height: "4px", borderRadius: "50%",
                    background: "var(--red)", flexShrink: 0,
                    boxShadow: "0 0 6px var(--red)",
                  }} />
                )}
              </div>

              {active && !isConfirming && (
                <div style={{
                  width: "4px", height: "4px", borderRadius: "50%",
                  background: "var(--accent)", marginTop: "8px", flexShrink: 0,
                  boxShadow: "0 0 6px var(--accent)",
                }} />
              )}
            </button>

            {/* Confirm/Cancel strip below the row */}
            {isConfirming && (
              <div style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "5px 10px 5px 47px",
                animation: "float-in 0.2s var(--ease) both",
              }}>
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: "10px",
                  color: "var(--text-3)", marginRight: "auto",
                }}>
                  Delete this doc?
                </span>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(doc.doc_id); }}
                  title="Confirm delete"
                  style={{
                    padding: "3px 10px", borderRadius: "var(--radius-sm)",
                    border: "1px solid rgba(248,113,113,0.4)",
                    background: "rgba(248,113,113,0.12)",
                    color: "var(--red)", fontSize: "10px", fontWeight: 600,
                    cursor: "pointer", fontFamily: "var(--font-mono)",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(248,113,113,0.25)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(248,113,113,0.12)"; }}
                >
                  Delete
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setConfirmId(null); }}
                  title="Cancel"
                  style={{
                    padding: "3px 10px", borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)",
                    background: "var(--surface-3)",
                    color: "var(--text-3)", fontSize: "10px",
                    cursor: "pointer", fontFamily: "var(--font-mono)",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "var(--text-2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "var(--surface-3)"; e.currentTarget.style.color = "var(--text-3)"; }}
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Make delete btn visible on row hover via CSS */}
            <style>{`
              li:hover .doc-delete-btn { opacity: 0.5 !important; }
              li:hover .doc-delete-btn:hover { opacity: 1 !important; }
            `}</style>
          </li>
        );
      })}
    </ul>
  );
}
