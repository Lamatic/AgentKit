import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "LLM Silent Failure Detector",
  description: "Detect grounding and schema failures in LLM logs, clustered by failure mode.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
