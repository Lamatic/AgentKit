"use client";

import { useState, useRef } from "react";
import { uploadDocument } from "@/actions/orchestrate";
import { UploadResponse } from "@/lib/types";

interface Props { onUploaded: () => void; }
type Status = "idle" | "uploading" | "success" | "error";

export default function DocumentUpload({ onUploaded }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function processFile(file: File) {
    if (!file.type.includes("pdf") && !file.name.endsWith(".md")) {
      setStatus("error");
      setMessage("Only PDF and Markdown files are supported.");
      return;
    }
    setStatus("uploading");
    try {
      const dataUrl = await fileToDataUrl(file);
      const result = (await uploadDocument(dataUrl, file.name)) as UploadResponse;
      if (result?.error) { setStatus("error"); setMessage(result.error); }
      else { setStatus("success"); setMessage(`${result.tree_node_count} nodes indexed`); onUploaded(); }
    } catch {
      setStatus("error"); setMessage("Upload failed. Check your flow.");
    }
    setTimeout(() => { setStatus("idle"); setMessage(""); }, 3500);
  }

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  const iconColor = dragging ? "var(--accent)" : status === "success" ? "var(--green)" : status === "error" ? "var(--red)" : "var(--text-muted)";
  const borderColor = dragging ? "var(--accent)" : status === "success" ? "var(--green)" : status === "error" ? "var(--red)" : "var(--border)";

  return (
    <div
      onClick={() => status === "idle" && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); }}
      style={{
        border: `1px dashed ${borderColor}`,
        borderRadius: "10px",
        padding: "16px",
        cursor: status === "idle" ? "pointer" : "default",
        background: dragging ? "var(--accent-dim)" : "var(--surface-2)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
        textAlign: "center",
        transition: "all 0.2s",
      }}
    >
      <input ref={inputRef} type="file" accept=".pdf,.md" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ""; }} />

      {status === "uploading" ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-hover)", fontSize: "13px", fontWeight: 500 }}>
            <svg style={{ animation: "spin 1s linear infinite" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Indexing document…
          </div>
          <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)" }}>Building tree structure</p>
        </>
      ) : status === "success" ? (
        <>
          <div style={{ color: "var(--green)", fontSize: "13px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Ready
          </div>
          <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)" }}>{message}</p>
        </>
      ) : status === "error" ? (
        <>
          <div style={{ color: "var(--red)", fontSize: "13px", fontWeight: 500 }}>Upload failed</div>
          <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)" }}>{message}</p>
        </>
      ) : (
        <>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <p style={{ margin: 0, fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>Upload a document</p>
          <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)" }}>PDF or Markdown · drag & drop</p>
        </>
      )}
    </div>
  );
}
