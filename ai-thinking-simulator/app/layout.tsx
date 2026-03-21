import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "AI Thinking Simulator",
  description: "See how different minds think about your problem",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
