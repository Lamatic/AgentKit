"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { fetchOrders, updateOrderStatus, type Order } from "@/actions/orders"
import { useToast } from "@/components/Toaster"
import { IconRefresh, IconCheck, IconClock, IconTruck, IconAlertTriangle, IconShoppingBag } from "@/components/icons"

const STATUS_STYLE: Record<string, { bg: string; color: string; dot: string; Icon: typeof IconClock }> = {
  pending: { bg: "#fff8e1", color: "#9a6b00", dot: "#f5a623", Icon: IconClock },
  confirmed: { bg: "#e8f5e9", color: "#1e6b1e", dot: "#2d7a2d", Icon: IconCheck },
  delivered: { bg: "#e3f2fd", color: "#155a9c", dot: "#1976d2", Icon: IconTruck },
}

const NEXT_STATUS: Record<string, { label: string; next: string } | undefined> = {
  pending: { label: "Confirm", next: "confirmed" },
  confirmed: { label: "Mark Delivered", next: "delivered" },
}

const REFRESH_INTERVAL_MS = 30000

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
  } catch {
    return iso
  }
}

function SkeletonRows({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i} style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)" }}>
          {[90, 160, 90, 110, 90].map((w, j) => (
            <td key={j} style={{ padding: "16px 18px" }}>
              <div className="skeleton-bar" style={{ width: w, height: "14px" }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

function StatChip({ label, value, tone }: { label: string; value: number; tone: "neutral" | "warning" }) {
  const styles = tone === "warning" ? { bg: "#fff8e1", color: "#9a6b00" } : { bg: "var(--fog)", color: "var(--leaf)" }
  return (
    <span
      style={{ display: "inline-flex", alignItems: "baseline", gap: "5px", background: styles.bg, color: styles.color, fontSize: "12.5px", fontWeight: 700, padding: "5px 12px", borderRadius: "20px" }}
      aria-label={`${value} ${label}`}
    >
      <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{value}</span>
      <span style={{ fontWeight: 600, opacity: 0.85 }}>{label}</span>
    </span>
  )
}

export default function OrdersClient({ initialOrders, initialError }: { initialOrders: Order[]; initialError: string }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [error, setError] = useState(initialError)
  const [manualLoading, setManualLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())
  const { showToast } = useToast()
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setManualLoading(true)
    else setRefreshing(true)
    try {
      const data = await fetchOrders()
      if (mountedRef.current) {
        setOrders(data)
        setError("")
      }
    } catch (e) {
      if (mountedRef.current) setError(e instanceof Error ? e.message : "Failed to load orders")
    } finally {
      if (mountedRef.current) {
        setManualLoading(false)
        setRefreshing(false)
      }
    }
  }, [])

  useEffect(() => {
    const id = setInterval(() => { refresh({ silent: true }) }, REFRESH_INTERVAL_MS)
    return () => clearInterval(id)
  }, [refresh])

  async function handleStatusUpdate(order: Order) {
    const action = NEXT_STATUS[order.status]
    if (!action) return
    setUpdatingIds((s) => new Set(s).add(order.id))
    try {
      const result = await updateOrderStatus(
        order.id,
        action.next,
        action.next === "confirmed" ? { phone: order.phone, items: order.items } : undefined
      )
      if (mountedRef.current) {
        setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: action.next } : o)))
      }
      showToast(`Order marked ${action.next}`, "success")
      if (action.next === "confirmed") {
        if (result.notified) showToast("WhatsApp confirmation sent to customer", "success")
        else if (result.notifyError) showToast("WhatsApp notification failed: " + result.notifyError, "error")
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to update order", "error")
    } finally {
      if (mountedRef.current) {
        setUpdatingIds((s) => {
          const next = new Set(s)
          next.delete(order.id)
          return next
        })
      }
    }
  }

  const pendingCount = orders.filter((o) => o.status === "pending").length
  const showSkeleton = manualLoading && orders.length === 0

  return (
    <div className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "26px", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <h1 style={{ fontSize: "30px", fontWeight: 700, letterSpacing: "-0.6px" }}>Orders</h1>
            <StatChip label="total" value={orders.length} tone="neutral" />
            {pendingCount > 0 && <StatChip label="pending" value={pendingCount} tone="warning" />}
          </div>
          <p style={{ color: "var(--muted)", fontSize: "13px", marginTop: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: refreshing ? "var(--warning)" : "var(--mint)", display: "inline-block" }} />
            {refreshing ? "Refreshing…" : "Live — auto-refreshes every 30s"}
          </p>
        </div>
        <button
          type="button"
          className="btn"
          onClick={() => refresh()}
          disabled={manualLoading}
          aria-label="Refresh orders"
          style={{
            background: "var(--white)",
            color: "var(--leaf)",
            border: "1px solid var(--border-strong)",
            borderRadius: "10px",
            padding: "9px 16px",
            fontSize: "14px",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            boxShadow: "var(--shadow-xs)",
            opacity: manualLoading ? 0.6 : 1,
          }}
        >
          <IconRefresh size={15} strokeWidth={2.2} style={{ animation: manualLoading ? "spin 0.8s linear infinite" : "none" }} />
          {manualLoading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", background: "var(--danger-bg)", border: "1px solid rgba(198,40,40,0.25)", borderRadius: "var(--radius-md)", padding: "14px 16px", marginBottom: "24px", fontSize: "14px", color: "var(--danger)" }}>
          <IconAlertTriangle size={17} style={{ flexShrink: 0, marginTop: "1px" }} />
          <span>{error}</span>
        </div>
      )}

      {orders.length === 0 && !error && !showSkeleton ? (
        <div className="surface" style={{ textAlign: "center", padding: "72px 16px", color: "var(--muted)" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "52px", height: "52px", borderRadius: "50%", background: "var(--fog)", color: "var(--leaf)", marginBottom: "16px" }}>
            <IconShoppingBag size={24} strokeWidth={1.6} />
          </div>
          <p style={{ fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>No orders yet</p>
          <p style={{ fontSize: "13px" }}>New WhatsApp orders will appear here automatically.</p>
        </div>
      ) : (
        <div className="surface" style={{ overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
            <thead>
              <tr style={{ background: "var(--paper)" }}>
                {["Phone", "Items", "Status", "Created", ""].map((h) => (
                  <th key={h} style={{ padding: "13px 18px", textAlign: "left", fontSize: "11.5px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.4px", borderBottom: "1px solid var(--border)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {showSkeleton ? (
                <SkeletonRows />
              ) : (
                orders.map((o, i) => {
                  const s = STATUS_STYLE[o.status] || { bg: "#f5f5f5", color: "#666", dot: "#999", Icon: IconClock }
                  const action = NEXT_STATUS[o.status]
                  const isUpdating = updatingIds.has(o.id)
                  const StatusIcon = s.Icon
                  return (
                    <tr key={o.id} className="row-hover" style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)" }}>
                      <td style={{ padding: "15px 18px", fontSize: "13px", color: "var(--ink-soft)", fontFamily: "'JetBrains Mono', monospace" }}>{o.phone}</td>
                      <td style={{ padding: "15px 18px", fontSize: "14px", maxWidth: "320px" }}>{o.items}</td>
                      <td style={{ padding: "15px 18px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: s.bg, color: s.color, padding: "4px 11px", borderRadius: "20px", fontSize: "12px", fontWeight: 700, textTransform: "capitalize" }}>
                          <StatusIcon size={11} strokeWidth={2.4} />
                          {o.status}
                        </span>
                      </td>
                      <td style={{ padding: "15px 18px", fontSize: "12.5px", color: "var(--muted)", whiteSpace: "nowrap", fontFamily: "'JetBrains Mono', monospace" }}>{fmt(o.created)}</td>
                      <td style={{ padding: "15px 18px", whiteSpace: "nowrap" }}>
                        {action && (
                          <button
                            type="button"
                            className="btn"
                            onClick={() => handleStatusUpdate(o)}
                            disabled={isUpdating}
                            aria-label={`${action.label} for order from ${o.phone}`}
                            style={{
                              background: isUpdating ? "var(--muted)" : "linear-gradient(135deg, var(--mint), var(--leaf))",
                              color: "var(--white)",
                              border: "none",
                              borderRadius: "9px",
                              padding: "7px 14px",
                              fontSize: "12.5px",
                              fontWeight: 700,
                              boxShadow: isUpdating ? "none" : "0 2px 8px rgba(45,122,45,0.28)",
                              opacity: isUpdating ? 0.7 : 1,
                            }}
                          >
                            {isUpdating ? "Updating…" : action.label}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
