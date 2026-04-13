import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://lamatic.ai'),
  title: 'System Design Analyzer | AI-Powered Architecture Analysis | Lamatic',
  description: 'Analyze your system designs with AI-powered insights on architecture, performance, reliability, and security. Get instant feedback from a multi-agent system powered by Lamatic.',
  keywords: ['system design', 'system architecture', 'AI analysis', 'lamatic', 'system design interview', 'architecture review', 'scalability analysis', 'reliability assessment'],
  authors: [{ name: 'Lamatic', url: 'https://lamatic.ai' }],
  creator: 'Lamatic',
  publisher: 'Lamatic',
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  icons: {
    icon: '/lamatic logo.png',
    shortcut: '/lamatic logo.png',
    apple: '/lamatic logo.png',
  },
  openGraph: {
    title: 'System Design Analyzer | AI-Powered Architecture Analysis',
    description: 'Analyze your system designs with AI-powered insights on architecture, performance, reliability, and security. Powered by Lamatic.',
    url: 'https://lamatic.ai',
    siteName: 'Lamatic - System Design Analyzer',
    type: 'website',
    images: [
      {
        url: '/lamatic logo.png',
        width: 128,
        height: 128,
        alt: 'Lamatic Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'System Design Analyzer | Lamatic',
    description: 'AI-powered system design analysis with instant feedback on your architecture',
    images: ['/lamatic logo.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#000' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
