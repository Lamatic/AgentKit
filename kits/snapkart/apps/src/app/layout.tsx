import type { Metadata, Viewport } from "next"
import "./globals.css"
import Nav from "@/components/Nav"
import { ToastProvider } from "@/components/Toaster"

export const metadata: Metadata = { title: "SnapKart", description: "WhatsApp ordering, instantly structured" }
export const viewport: Viewport = { width: "device-width", initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const shopName = process.env.NEXT_PUBLIC_SHOP_NAME || "SnapKart"
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <Nav shopName={shopName} />
          <main style={{ maxWidth: "1120px", margin: "0 auto", padding: "32px 20px 64px" }}>{children}</main>
        </ToastProvider>
      </body>
    </html>
  )
}
