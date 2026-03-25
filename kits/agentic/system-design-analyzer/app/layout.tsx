import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'System Design Analyzer | Lamatic',
  description: 'AI-powered system design analysis and insights powered by Lamatic. Get instant feedback on your system architecture.',
  keywords: ['system design', 'architecture', 'AI analysis', 'lamatic', 'system design interview'],
  openGraph: {
    title: 'System Design Analyzer | Lamatic',
    description: 'AI-powered system design analysis powered by Lamatic',
    url: 'https://lamatic.ai',
    siteName: 'Lamatic',
    type: 'website',
  },
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
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
