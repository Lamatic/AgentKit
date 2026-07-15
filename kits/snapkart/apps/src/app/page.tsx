/** Home page component displaying the three main feature cards for SnapKart dashboard. */
import Link from "next/link"
import { IconShoppingBag, IconMessageCircle, IconPackage } from "@/components/icons"

const features = [
  { Icon: IconShoppingBag, title: "Order Feed", desc: "Live table of every WhatsApp order, with one-tap status updates and instant customer notifications.", href: "/orders" },
  { Icon: IconMessageCircle, title: "Simulate Customer", desc: "Test the agent without WhatsApp â€” send Hinglish messages and watch orders land in real time.", href: "/simulate" },
  { Icon: IconPackage, title: "Catalog Upload", desc: "Edit your inventory and push it straight to the vector index your agent searches.", href: "/catalog" },
]

export default function Home() {
  return (
    <div className="fade-up">
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, var(--leaf) 0%, #163f16 55%, var(--leaf-dark) 100%)",
          borderRadius: "24px",
          padding: "56px 40px",
          color: "var(--white)",
          marginBottom: "44px",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "280px",
            height: "280px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(168,230,163,0.35), transparent 70%)",
          }}
        />
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.4px",
            textTransform: "uppercase",
            color: "var(--leaf-dark)",
            background: "var(--glow)",
            padding: "5px 12px",
            borderRadius: "20px",
            marginBottom: "20px",
          }}
        >
          Powered by Lamatic.ai
        </span>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 700, lineHeight: 1.12, letterSpacing: "-1px", marginBottom: "16px", color: "var(--white)", maxWidth: "620px" }}>
          Your shop WhatsApp, now thinks for itself.
        </h1>
        <p style={{ fontSize: "17px", color: "var(--glow)", maxWidth: "480px", lineHeight: 1.65, position: "relative" }}>
          SnapKart classifies Hinglish messages, extracts orders, checks your catalog, and replies â€” so you can run the counter, not the inbox.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "18px" }}>
        {features.map(({ Icon, title, desc, href }) => (
          <Link
            key={href}
            href={href}
            className="surface surface-hover"
            style={{ display: "block", padding: "26px", color: "var(--ink)" }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                background: "var(--fog)",
                color: "var(--leaf)",
                marginBottom: "16px",
              }}
            >
              <Icon size={20} strokeWidth={1.8} />
            </span>
            <h2 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "8px", letterSpacing: "-0.2px" }}>{title}</h2>
            <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.6 }}>{desc}</p>
            <p style={{ marginTop: "18px", fontSize: "13px", fontWeight: 700, color: "var(--mint)", display: "flex", alignItems: "center", gap: "4px" }}>
              Open <span aria-hidden="true">&rarr;</span>
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
