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
      <div style={{ textAlign: "center", padding: "32px 12px", color: "var(--text-muted)" }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 8px", display: "block", opacity: 0.4 }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        </svg>
        <p style={{ margin: 0, fontSize: "12px" }}>No documents yet.</p>
        <p style={{ margin: "4px 0 0", fontSize: "11px", opacity: 0.7 }}>Upload a PDF to get started.</p>
      </div>
    );
  }

  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
      {documents.map((doc) => {
        const active = selectedId === doc.doc_id;
        return (
          <li key={doc.doc_id}>
            <button
              onClick={() => onSelect(doc)}
              style={{
                width: "100%", textAlign: "left",
                padding: "8px 10px",
                borderRadius: "8px",
                border: "none",
                background: active ? "var(--accent-dim)" : "transparent",
                cursor: "pointer",
                display: "flex", alignItems: "flex-start", gap: "10px",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--surface-2)"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke={active ? "var(--accent-hover)" : "var(--text-muted)"}
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ marginTop: "2px", flexShrink: 0 }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
              <div style={{ minWidth: 0 }}>
                <p style={{
                  margin: 0, fontSize: "12px", fontWeight: 500,
                  color: active ? "var(--accent-hover)" : "var(--text-secondary)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {doc.file_name}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--text-muted)" }}>
                  {doc.tree_node_count} nodes · {new Date(doc.created_at).toLocaleDateString()}
                </p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
