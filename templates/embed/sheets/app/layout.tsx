import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Lamatic Sheets Kit",
  description: "AI powered sheets by Lamatic.AI",
  generator: "lamatic.ai",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
      <body>
        <Suspense fallback={null}>{children}</Suspense>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
