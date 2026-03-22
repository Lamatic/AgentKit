"use client";

import { Document } from "@/lib/types";

interface Props {
  documents: Document[];
  selectedId: string | null;
  onSelect: (doc: Document) => void;
}

export default function DocumentList({ documents, selectedId, onSelect }: Props) {
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
        return (
          <li key={doc.doc_id} style={{ animation: `float-in 0.3s ${idx * 0.04}s var(--ease) both` }}>
            <button
              onClick={() => onSelect(doc)}
              style={{
                width: "100%", textAlign: "left",
                padding: "9px 10px",
                borderRadius: "var(--radius-md)",
                border: active ? "1px solid rgba(45,212,191,0.3)" : "1px solid transparent",
                background: active ? "var(--accent-dim)" : "transparent",
                cursor: "pointer",
                display: "flex", alignItems: "flex-start", gap: "9px",
                transition: "all 0.18s var(--ease)",
                outline: "none",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--surface-2)"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              {/* File type dot */}
              <div style={{
                width: "28px", height: "28px", borderRadius: "7px", flexShrink: 0,
                background: active ? "rgba(45,212,191,0.15)" : "var(--surface-3)",
                border: `1px solid ${active ? "rgba(45,212,191,0.25)" : "var(--border)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginTop: "1px",
                transition: "all 0.18s var(--ease)",
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
                  letterSpacing: "-0.01em",
                  transition: "color 0.18s",
                }}>
                  {doc.file_name}
                </p>
                <p style={{
                  margin: 0,
                  fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)",
                  letterSpacing: "0.01em",
                }}>
                  {doc.tree_node_count} nodes · {new Date(doc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>

              {active && (
                <div style={{
                  width: "4px", height: "4px", borderRadius: "50%",
                  background: "var(--accent)",
                  marginTop: "8px", flexShrink: 0,
                  boxShadow: "0 0 6px var(--accent)",
                }} />
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
