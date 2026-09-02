import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Document Tamper Detector — Lamatic AgentKit',
  description: 'AI-powered document authenticity triage tool. Detect signs of digital tampering in PDFs, invoices, offer letters, and ID documents. Built on Lamatic AgentKit.',
  keywords: ['document verification', 'tamper detection', 'document forensics', 'AI', 'Lamatic'],
  authors: [{ name: 'Taukeer Khan' }],
  openGraph: {
    title: 'Document Tamper Detector',
    description: 'AI-powered document authenticity triage — detect digital tampering in seconds.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
