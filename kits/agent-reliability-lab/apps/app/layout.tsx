import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Agent Reliability Lab",
  description: "Pre-deployment production-readiness audit for AI agent system prompts",
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
