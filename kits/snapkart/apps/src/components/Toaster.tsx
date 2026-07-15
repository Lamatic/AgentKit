"use client"
import { createContext, useCallback, useContext, useState } from "react"
import { IconCheck, IconAlertTriangle } from "@/components/icons"

type ToastType = "success" | "error"
interface ToastItem { id: number; message: string; type: ToastType }
interface ToastContextValue { showToast: (message: string, type?: ToastType) => void }

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          left: "20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "10px",
          zIndex: 1000,
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              background: "var(--white)",
              color: "var(--ink)",
              padding: "13px 16px",
              borderRadius: "var(--radius-md)",
              borderLeft: "3px solid " + (t.type === "success" ? "var(--mint)" : "var(--danger)"),
              fontSize: "13.5px",
              fontWeight: 500,
              lineHeight: 1.5,
              boxShadow: "var(--shadow-lg)",
              maxWidth: "min(360px, 100%)",
              animation: "toast-in 0.25s var(--ease)",
              pointerEvents: "auto",
            }}
          >
            <span
              style={{
                flexShrink: 0,
                marginTop: "1px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                background: t.type === "success" ? "var(--success-bg)" : "var(--danger-bg)",
                color: t.type === "success" ? "var(--mint)" : "var(--danger)",
              }}
            >
              {t.type === "success" ? <IconCheck size={11} strokeWidth={2.8} /> : <IconAlertTriangle size={11} strokeWidth={2.4} />}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
