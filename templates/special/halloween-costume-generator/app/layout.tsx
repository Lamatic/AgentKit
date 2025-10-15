import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Inter, Griffy } from "next/font/google"
import { Suspense } from "react"
import "./globals.css"
import { AppProvider } from "./contexts/AppContext"
import { Header } from "@/components/header"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const griffy = Griffy({ subsets: ["latin"], weight: ["400"], variable: "--font-griffy" })

export const metadata: Metadata = {
  title: "Agent Kit Halloween Costum Generator",
  description: "Generate images of halloween costumes based on the provided images",
  generator: "lamatic.ai",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${griffy.variable}`}>
      <body className={`font-sans`}>
        <AppProvider>
          <Header />
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </AppProvider>
        <Analytics />
      </body>
    </html>
  )
}
