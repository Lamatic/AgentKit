"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { fetchPendingCount } from "@/actions/orders"
import { IconShoppingBag, IconMessageCircle, IconPackage, IconMenu, IconX } from "@/components/icons"

const NAV_LINKS = [
  { href: "/orders", label: "Orders", icon: IconShoppingBag },
  { href: "/simulate", label: "Simulate", icon: IconMessageCircle },
  { href: "/catalog", label: "Catalog", icon: IconPackage },
]

export default function Nav({ shopName }: { shopName: string }) {
  const pathname = usePathname()
  const [pendingCount, setPendingCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchPendingCount()
      .then((c) => { if (!cancelled) setPendingCount(c) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  useEffect(() => { setMenuOpen(false) }, [pathname])

  return (
    <nav
      style={{
        background: "linear-gradient(180deg, var(--leaf) 0%, #163f16 100%)",
        color: "var(--white)",
        padding: "0 20px",
        minHeight: "60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
        flexWrap: "wrap",
        boxShadow: "0 4px 20px rgba(15,26,15,0.18)",
      }}
    >
      <Link
        href="/"
        style={{ fontWeight: 700, fontSize: "17px", letterSpacing: "-0.2px", display: "flex", alignItems: "center", gap: "9px", color: "var(--white)", padding: "13px 0" }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "30px",
            height: "30px",
            borderRadius: "9px",
            background: "linear-gradient(135deg, var(--glow), var(--mint))",
            color: "var(--leaf-dark)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          <IconShoppingBag size={17} strokeWidth={2.1} />
        </span>
        {shopName}
      </Link>

      <button
        type="button"
        className="nav-hamburger icon-btn"
        aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((o) => !o)}
        style={{ background: "transparent", border: "none", color: "var(--white)", padding: "8px", lineHeight: 1, borderRadius: "8px", alignItems: "center", justifyContent: "center" }}
      >
        {menuOpen ? <IconX size={20} /> : <IconMenu size={20} />}
      </button>

      <div className="nav-links" data-open={menuOpen}>
        {NAV_LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="link-row"
              style={{
                padding: "8px 14px",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: 600,
                color: active ? "var(--leaf-dark)" : "var(--glow)",
                background: active ? "var(--glow)" : "transparent",
                display: "flex",
                alignItems: "center",
                gap: "7px",
                boxShadow: active ? "0 2px 10px rgba(168,230,163,0.35)" : "none",
              }}
            >
              <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
              {label}
              {href === "/orders" && pendingCount > 0 && (
                <span
                  className="pulse-dot"
                  role="status"
                  aria-label={`${pendingCount} pending order${pendingCount === 1 ? "" : "s"}`}
                  title={`${pendingCount} pending order${pendingCount === 1 ? "" : "s"}`}
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
