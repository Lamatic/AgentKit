import type { Metadata } from 'next'
import { DM_Sans, DM_Serif_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" })
const dmSerif = DM_Serif_Display({ subsets: ["latin"], weight: "400", variable: "--font-serif" })

export const metadata: Metadata = {
  title: 'Reddit Scout — Lamatic AI',
  description: 'Search Reddit for real product reviews and opinions powered by Lamatic AI',
  icons: {
    icon: '/lamatic-logo.png',
    shortcut: '/lamatic-logo.png',
    apple: '/lamatic-logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmSerif.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
