import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Incident Postmortem Pipeline",
  description: "Turns raw incident logs into a ranked, evidence-graded postmortem",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}