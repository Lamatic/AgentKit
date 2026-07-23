/** Simulate page allowing users to test the WhatsApp agent without a real phone number. */
"use client"
import { useEffect, useRef, useState } from "react"
import { sendMessage } from "@/actions/webhook"
import { fetchOrders } from "@/actions/orders"
import { IconMessageCircle, IconSend, IconTrash, IconX, IconSparkle } from "@/components/icons"

type Intent = "Order" | "Inquiry" | "Complaint" | "Chitchat"

const QUICK: { text: string; intent: Intent }[] = [
  { text: "bhaiya 2 surf excel chota wala aur 1 kg chini bhej do", intent: "Order" },
  { text: "surf excel kitne ka hai?", intent: "Inquiry" },
  { text: "kal wala doodh kharab tha", intent: "Complaint" },
  { text: "Kese ho ap", intent: "Chitchat" },
  { text: "wahi wala bhej do", intent: "Order" },
  { text: "fortune tel hai kya?", intent: "Inquiry" },
]

const INTENT_STYLE: Record<Intent, { bg: string; color: string }> = {
  Order: { bg: "#e8f5e9", color: "#2e7d32" },
  Inquiry: { bg: "#e3f2fd", color: "#1565c0" },
  Complaint: { bg: "#ffebee", color: "#c62828" },
  Chitchat: { bg: "#f3e5f5", color: "#6a1b9a" },
}

const POLL_INTERVAL_MS = 2000
const POLL_TOTAL_MS = 20000

function now() {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
}

export default function SimulatePage() {
  const [messages, setMessages] = useState<{ role: string; text: string; ts: string }[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [newOrderBanner, setNewOrderBanner] = useState(false)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, loading])

  function pollForNewOrder(baselineIds: Set<string>) {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    let elapsed = 0
    pollTimerRef.current = setInterval(async () => {
      elapsed += POLL_INTERVAL_MS
      try {
        const current = await fetchOrders()
        const hasNew = current.some((o) => !baselineIds.has(o.id))
        if (hasNew) {
          setNewOrderBanner(true)
          if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current)
          bannerTimerRef.current = setTimeout(() => setNewOrderBanner(false), 6000)
          if (pollTimerRef.current) clearInterval(pollTimerRef.current)
          return
        }
      } catch {
        // ignore transient poll errors
      }
      if (elapsed >= POLL_TOTAL_MS && pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
      }
    }, POLL_INTERVAL_MS)
  }

  async function submit(text: string) {
    if (!text.trim() || loading) return
    setMessages((m) => [...m, { role: "user", text: text.trim(), ts: now() }])
    setInput("")
    setLoading(true)

    let baselineIds = new Set<string>()
    try {
      const existing = await fetchOrders()
      baselineIds = new Set(existing.map((o) => o.id))
    } catch {
      // if baseline fetch fails, poll will just compare against an empty set
    }

    try {
      await sendMessage(text.trim())
      setMessages((m) => [...m, { role: "agent", text: "Sent! Check WhatsApp for reply.", ts: now() }])
      pollForNewOrder(baselineIds)
    } catch (e) {
      setMessages((m) => [...m, { role: "agent", text: "Error: " + (e instanceof Error ? e.message : String(e)), ts: now() }])
    } finally {
      setLoading(false)
    }
  }

  function clearChat() {
    setMessages([])
    setNewOrderBanner(false)
    if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current)
  }

  return (
    <div className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "4px" }}>
        <div>
          <h1 style={{ fontSize: "30px", fontWeight: 700, letterSpacing: "-0.6px" }}>Simulate Customer</h1>
          <p style={{ color: "var(--muted)", fontSize: "14px", marginTop: "6px" }}>Send messages as a WhatsApp customer and watch the agent respond.</p>
        </div>
        <button
          type="button"
          className="btn"
          onClick={clearChat}
          disabled={messages.length === 0}
          aria-label="Clear chat"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            background: "var(--white)",
            color: messages.length === 0 ? "var(--muted)" : "var(--danger)",
            border: "1px solid var(--border-strong)",
            borderRadius: "10px",
            padding: "9px 16px",
            fontSize: "14px",
            fontWeight: 600,
            boxShadow: "var(--shadow-xs)",
            opacity: messages.length === 0 ? 0.6 : 1,
          }}
        >
          <IconTrash size={14} />
          Clear chat
        </button>
      </div>

      {newOrderBanner && (
        <div
          role="status"
          className="fade-up"
          style={{ marginTop: "20px", background: "linear-gradient(135deg, #e8f5e9, #d5f0d5)", border: "1px solid var(--mint)", color: "#1e6b1e", borderRadius: "var(--radius-md)", padding: "13px 18px", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", boxShadow: "var(--shadow-sm)" }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <IconSparkle size={16} />
            New order created!
          </span>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setNewOrderBanner(false)}
            aria-label="Dismiss new order notification"
            style={{ background: "transparent", border: "none", color: "#1e6b1e", padding: "4px", borderRadius: "6px", display: "flex" }}
          >
            <IconX size={15} />
          </button>
        </div>
      )}

      <div className="simulate-grid" style={{ marginTop: "24px" }}>
        <div className="surface" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ background: "linear-gradient(135deg, var(--leaf), #163f16)", color: "var(--white)", padding: "14px 20px", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", borderRadius: "8px", background: "rgba(255,255,255,0.16)" }}>
              <IconMessageCircle size={15} strokeWidth={2} />
            </span>
            SnapKart Agent
            {loading && (
              <span style={{ marginLeft: "auto", fontSize: "12px", opacity: 0.85, display: "flex", alignItems: "center", gap: "6px" }}>
                <TypingDots /> thinking
              </span>
            )}
          </div>
          <div ref={scrollRef} style={{ height: "420px", overflowY: "auto", padding: "18px", display: "flex", flexDirection: "column", gap: "12px", background: "var(--paper)" }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", color: "var(--muted)", marginTop: "150px", fontSize: "14px" }}>
                <IconMessageCircle size={26} strokeWidth={1.4} style={{ marginBottom: "10px", opacity: 0.5 }} />
                <p>Try a quick message to get started</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div
                  style={{
                    maxWidth: "75%",
                    background: m.role === "user" ? "linear-gradient(135deg, var(--mint), var(--leaf))" : "var(--white)",
                    color: m.role === "user" ? "var(--white)" : "var(--ink)",
                    borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                    padding: "10px 14px",
                    fontSize: "14px",
                    lineHeight: 1.55,
                    boxShadow: "var(--shadow-xs)",
                    border: m.role === "user" ? "none" : "1px solid var(--border)",
                  }}
                >
                  {m.text}
                  <div style={{ fontSize: "10.5px", opacity: 0.65, marginTop: "5px", textAlign: "right" }}>{m.ts}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: "14px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: "10px", background: "var(--white)" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit(input)}
              placeholder="Type a Hinglish message..."
              disabled={loading}
              aria-label="Message to send as customer"
              style={{ flex: 1, minWidth: 0, border: "1px solid var(--border-strong)", borderRadius: "22px", padding: "11px 18px", fontSize: "14px", outline: "none", background: "var(--paper)" }}
            />
            <button
              onClick={() => submit(input)}
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="btn"
              style={{
                background: loading || !input.trim() ? "var(--muted)" : "linear-gradient(135deg, var(--mint), var(--leaf))",
                color: "var(--white)",
                border: "none",
                borderRadius: "50%",
                width: "42px",
                height: "42px",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: loading || !input.trim() ? "none" : "0 2px 10px rgba(45,122,45,0.35)",
                opacity: loading || !input.trim() ? 0.7 : 1,
              }}
            >
              <IconSend size={16} />
            </button>
          </div>
        </div>
        <div>
          <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "12px" }}>Quick messages</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {QUICK.map((q) => {
              const style = INTENT_STYLE[q.intent]
              return (
                <div key={q.text} className="surface surface-hover" style={{ padding: "10px 12px" }}>
                  <span style={{ display: "inline-block", background: style.bg, color: style.color, fontSize: "10px", fontWeight: 700, letterSpacing: "0.3px", textTransform: "uppercase", padding: "2px 9px", borderRadius: "20px", marginBottom: "7px" }}>
                    {q.intent}
                  </span>
                  <button
                    onClick={() => submit(q.text)}
                    disabled={loading}
                    aria-label={`Send ${q.intent.toLowerCase()} message: ${q.text}`}
                    style={{ display: "block", width: "100%", background: "transparent", border: "none", padding: 0, fontSize: "13px", textAlign: "left", color: "var(--ink)", lineHeight: 1.5, opacity: loading ? 0.6 : 1 }}
                  >
                    {q.text}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function TypingDots() {
  const dotStyle = (delay: string): React.CSSProperties => ({
    width: "4px",
    height: "4px",
    borderRadius: "50%",
    background: "currentColor",
    display: "inline-block",
    animation: `typing-dot 1s ${delay} infinite ease-in-out`,
  })
  return (
    <span style={{ display: "inline-flex", gap: "3px", alignItems: "center" }}>
      <span style={dotStyle("0s")} />
      <span style={dotStyle("0.15s")} />
      <span style={dotStyle("0.3s")} />
    </span>
  )
}
