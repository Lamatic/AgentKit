"use client"
import { useEffect } from "react"
import { IconAlertTriangle } from "@/components/icons"

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="surface fade-up" style={{ textAlign: "center", padding: "56px 24px", maxWidth: "440px", margin: "48px auto" }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          background: "var(--danger-bg)",
          color: "var(--danger)",
          marginBottom: "18px",
        }}
      >
        <IconAlertTriangle size={24} strokeWidth={1.8} />
      </div>
      <h1 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px", letterSpacing: "-0.2px" }}>Something went wrong</h1>
      <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "26px", lineHeight: 1.6 }}>
        {error.message || "An unexpected error occurred while loading this page."}
      </p>
      <button
        type="button"
        className="btn"
        onClick={() => reset()}
        aria-label="Try again"
        style={{ background: "linear-gradient(135deg, var(--mint), var(--leaf))", color: "var(--white)", border: "none", borderRadius: "10px", padding: "10px 24px", fontSize: "14px", fontWeight: 700, boxShadow: "0 4px 14px rgba(45,122,45,0.28)" }}
      >
        Try again
      </button>
    </div>
  )
}
