import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Ride-Hailing Analytics Assistant",
  description: "Ask questions about ride-hailing trip data in plain English",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
