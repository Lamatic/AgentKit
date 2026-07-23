import type React from "react"
import type { Metadata } from "next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "RCAgent - SRE Incident Analysis",
  description: "AI-powered root cause analysis for software incidents by Lamatic.ai",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 min-h-screen">
        <Suspense fallback={null}>{children}</Suspense>
      </body>
    </html>
  )
}
