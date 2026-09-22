import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Indie Founder Radar | Startup Market Validation & Gap Analysis',
  description:
    'AI-powered startup market validation agent. Scans real web discussions, finds competitor gaps, and provides a data-backed BUILD or SKIP verdict.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
