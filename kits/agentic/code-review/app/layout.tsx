import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Code Review Agent",
  description: "AI-powered GitHub PR code review",
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