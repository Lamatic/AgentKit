"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, Check, AlertCircle, Upload } from "lucide-react";
import { uploadDocument } from "@/actions/orchestrate";
import { UploadResponse } from "@/lib/types";

interface Props { onUploaded: () => void; }
type Status = "idle" | "uploading" | "success" | "error";

export default function DocumentUpload({ onUploaded }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);

  async function processFile(file: File) {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);

    // Only PDFs are supported — the upstream flow does not handle Markdown.
    const allowedTypes = ["application/pdf"];
    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith(".pdf")) {
      setStatus("error");
      setMessage("Only PDF files are supported.");
      // Schedule reset so the picker can be re-opened (matches success/error paths).
      resetTimerRef.current = setTimeout(() => { setStatus("idle"); setMessage(""); }, 3500);
      return;
    }
    setStatus("uploading");
    try {
      const dataUrl = await fileToDataUrl(file);
      // Split "data:<mime>;base64,<data>" → { mime_type, file_base64 }
      const [meta, file_base64] = dataUrl.split(",");
      const mime_type = meta.replace("data:", "").replace(";base64", "");
      const result = (await uploadDocument(file.name, { file_base64, mime_type })) as unknown as UploadResponse;
      setStatus("success");
      setMessage(`${result.tree_node_count} nodes indexed`);
      onUploaded();
    } catch {
      setStatus("error"); setMessage("Upload failed. Check your flow.");
    }
    resetTimerRef.current = setTimeout(() => { setStatus("idle"); setMessage(""); }, 3500);
  }

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  const isIdle = status === "idle";

  return (
    // tabIndex + role + onKeyDown make the upload zone keyboard-accessible.
    // Keyboard users can Tab to it and press Enter or Space to open the picker.
    <div
      role="button"
      tabIndex={isIdle ? 0 : -1}
      aria-label="Upload document — click or drop a PDF file"
      onClick={() => isIdle && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (!isIdle) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); }}
      style={{
        borderRadius: "var(--radius-md)",
        padding: "14px 12px",
        cursor: isIdle ? "pointer" : "default",
        border: `1.5px dashed ${
          dragging ? "var(--accent)" :
          status === "success" ? "var(--green)" :
          status === "error" ? "var(--red)" :
          status === "uploading" ? "rgba(45,212,191,0.3)" :
          "var(--border-md)"
        }`,
        background: dragging
          ? "var(--accent-dim)"
          : status === "success"
          ? "rgba(52,211,153,0.06)"
          : status === "error"
          ? "rgba(248,113,113,0.06)"
          : "var(--surface-2)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: "5px",
        textAlign: "center",
        transition: "all 0.22s var(--ease)",
        position: "relative", overflow: "hidden",
        boxShadow: dragging ? "var(--glow)" : "none",
      }}
    >
      <input
        ref={inputRef} type="file" accept=".pdf"
        style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ""; }}
      />

      {status === "uploading" && (
        <>
          {/* Progress shimmer line */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "2px",
            background: "linear-gradient(90deg, transparent, var(--accent), transparent)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s linear infinite",
          }} />
          <Loader2 size={18} stroke="var(--accent)" strokeWidth={2.5} style={{ animation: "spin 0.8s linear infinite" }} />
          <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "var(--accent)" }}>Indexing…</p>
          <p style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)" }}>
            Building tree structure
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(52,211,153,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Check size={14} stroke="var(--green)" strokeWidth={2.5} />
          </div>
          <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "var(--green)" }}>Indexed</p>
          <p style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)" }}>{message}</p>
        </>
      )}

      {status === "error" && (
        <>
          <AlertCircle size={16} stroke="var(--red)" strokeWidth={2} />
          <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "var(--red)" }}>Failed</p>
          <p style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)", maxWidth: "160px" }}>{message}</p>
        </>
      )}

      {isIdle && (
        <>
          <div style={{
            width: "32px", height: "32px", borderRadius: "var(--radius-sm)",
            background: "var(--surface-3)",
            border: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.18s var(--ease)",
          }}>
            <Upload size={15} stroke={dragging ? "var(--accent)" : "var(--text-2)"} strokeWidth={2} />
          </div>
          <p style={{ margin: 0, fontSize: "12.5px", fontWeight: 600, color: "var(--text-1)" }}>
            Upload document
          </p>
          <p style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)" }}>
            PDF · drop or click
          </p>
        </>
      )}
    </div>
  );
}
