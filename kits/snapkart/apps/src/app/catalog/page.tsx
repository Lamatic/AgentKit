"use client"
import { useState } from "react"
import { uploadCatalog } from "@/actions/webhook"
import { FULL_CATALOG } from "@/lib/fullCatalog"
import { useToast } from "@/components/Toaster"
import { IconPackage, IconUpload, IconAlertTriangle, IconCheck } from "@/components/icons"

interface ParsedItem {
  name?: string
  price?: number
  stock?: boolean
  unit?: string
}

const DEFAULT = [
  { name: "Surf Excel 500g", aliases: "surf excel chota wala", unit: "packet", price: 45, stock: true },
  { name: "Maggi Noodles 70g", aliases: "maggi, maggie", unit: "piece", price: 14, stock: true },
]

export default function CatalogPage() {
  const [text, setText] = useState(JSON.stringify(DEFAULT, null, 2))
  const [status, setStatus] = useState("idle")
  const [msg, setMsg] = useState("")
  const [err, setErr] = useState("")
  const { showToast } = useToast()

  function tryParse(v: string): ParsedItem[] | null {
    try {
      const p = JSON.parse(v)
      if (!Array.isArray(p)) throw new Error("Must be an array")
      return p
    } catch {
      return null
    }
  }

  function validate(v: string): ParsedItem[] | null {
    const p = tryParse(v)
    if (p === null) {
      try {
        JSON.parse(v)
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Invalid JSON")
        return null
      }
      setErr("Must be an array")
      return null
    }
    setErr("")
    return p
  }

  const parsed = tryParse(text)

  async function upload() {
    const items = validate(text)
    if (!items) return
    setStatus("loading")
    setMsg("")
    try {
      await uploadCatalog(items)
      setStatus("success")
      setMsg(items.length + " items sent. Allow 30s for indexing.")
      showToast("Catalog pushed to index", "success")
    } catch (e) {
      const message = e instanceof Error ? e.message : "Upload failed"
      setStatus("error")
      setMsg("Error: " + message)
      showToast(message, "error")
    }
  }

  function loadFullCatalog() {
    setText(JSON.stringify(FULL_CATALOG, null, 2))
    setStatus("idle")
    setMsg("")
    setErr("")
  }

  return (
    <div className="fade-up">
      <h1 style={{ fontSize: "30px", fontWeight: 700, letterSpacing: "-0.6px", marginBottom: "6px" }}>Catalog</h1>
      <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "28px" }}>Edit your inventory and push it to the vector index your agent searches.</p>

      <div className="surface" style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", padding: "13px 18px", borderBottom: "1px solid var(--border)", background: "var(--paper)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", fontWeight: 700, color: "var(--muted)", letterSpacing: "0.3px" }}>
            <IconPackage size={14} strokeWidth={2} />
            catalog.json
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {err ? (
              <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--danger)", fontWeight: 600 }}>
                <IconAlertTriangle size={13} /> {err}
              </span>
            ) : (
              <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--mint)", fontWeight: 600 }}>
                <IconCheck size={13} strokeWidth={2.6} /> Valid JSON
              </span>
            )}
            <button
              type="button"
              className="btn"
              onClick={loadFullCatalog}
              aria-label="Load full 40-item catalog into the editor"
              style={{ background: "var(--white)", border: "1px solid var(--border-strong)", color: "var(--leaf)", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", fontWeight: 700, boxShadow: "var(--shadow-xs)" }}
            >
              Load full 40-item catalog
            </button>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); validate(e.target.value) }}
          rows={18}
          aria-label="Catalog JSON editor"
          spellCheck={false}
          style={{ width: "100%", fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", lineHeight: 1.7, border: "none", padding: "18px", outline: "none", resize: "vertical", display: "block", background: "var(--white)" }}
        />
      </div>

      <button
        onClick={upload}
        disabled={status === "loading" || !!err}
        aria-label="Push catalog to index"
        className="btn"
        style={{
          marginTop: "14px",
          background: status === "loading" || !!err ? "var(--muted)" : "linear-gradient(135deg, var(--mint), var(--leaf))",
          color: "var(--white)",
          border: "none",
          borderRadius: "12px",
          padding: "13px 24px",
          fontSize: "15px",
          fontWeight: 700,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "9px",
          boxShadow: status === "loading" || !!err ? "none" : "0 6px 18px rgba(45,122,45,0.3)",
          opacity: status === "loading" || !!err ? 0.7 : 1,
        }}
      >
        <IconUpload size={16} />
        {status === "loading" ? "Indexing..." : "Push to Catalog Index"}
      </button>

      {msg && (
        <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px", padding: "12px 16px", borderRadius: "var(--radius-md)", background: status === "success" ? "var(--success-bg)" : "#fff3e0", color: status === "success" ? "#1e6b1e" : "var(--warning)", fontSize: "14px", fontWeight: 500 }}>
          {status === "success" ? <IconCheck size={15} strokeWidth={2.4} /> : <IconAlertTriangle size={15} />}
          {msg}
        </div>
      )}

      <div style={{ marginTop: "44px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "18px" }}>
          <h2 style={{ fontSize: "19px", fontWeight: 700, letterSpacing: "-0.3px" }}>Preview</h2>
          {parsed && <p style={{ fontSize: "13px", color: "var(--muted)", fontFamily: "'JetBrains Mono', monospace" }}>{parsed.length} items</p>}
        </div>

        {!parsed ? (
          <div className="surface" style={{ textAlign: "center", padding: "44px 16px", color: "var(--muted)", fontSize: "14px" }}>
            Fix the JSON above to preview the catalog
          </div>
        ) : parsed.length === 0 ? (
          <div className="surface" style={{ textAlign: "center", padding: "44px 16px", color: "var(--muted)", fontSize: "14px" }}>
            No items in catalog
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "14px" }}>
            {parsed.map((item, i) => {
              const inStock = item.stock !== false
              return (
                <div key={i} className="surface surface-hover" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <div style={{ height: "4px", background: inStock ? "linear-gradient(90deg, var(--mint), var(--glow))" : "linear-gradient(90deg, var(--danger), #ef9a9a)" }} />
                  <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "9px" }}>
                    <p style={{ fontSize: "14px", fontWeight: 700, lineHeight: 1.4, letterSpacing: "-0.1px" }}>{item.name || "Unnamed item"}</p>
                    <p style={{ fontSize: "17px", fontWeight: 700, color: "var(--leaf)", fontFamily: "'JetBrains Mono', monospace" }}>
                      {typeof item.price === "number" ? "₹" + item.price : "—"}
                      {item.unit && <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--muted)", fontFamily: "'Space Grotesk', sans-serif" }}> / {item.unit}</span>}
                    </p>
                    <span
                      style={{
                        alignSelf: "flex-start",
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: "20px",
                        background: inStock ? "var(--success-bg)" : "var(--danger-bg)",
                        color: inStock ? "#1e6b1e" : "var(--danger)",
                      }}
                    >
                      {inStock ? "In stock" : "Out of stock"}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
