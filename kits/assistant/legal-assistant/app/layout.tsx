import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Legal Assistant",
  description: "Lamatic-powered legal research assistant with citations, next steps, and a standing disclaimer.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
