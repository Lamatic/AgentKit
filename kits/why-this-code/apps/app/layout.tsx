import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Why This Code?',
  description: 'Understand the purpose, origin, and architectural context of codebase references.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased text-foreground bg-background">
        {children}
      </body>
    </html>
  )
}
