import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'System Design Analyzer | Lamatic',
  description: 'AI-powered system design analysis and insights powered by Lamatic',
  keywords: ['system design', 'architecture', 'AI analysis', 'lamatic'],
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
      <body className={`${poppins.variable} font-sans antialiased bg-white text-gray-900`}>
        {children}
      </body>
    </html>
  );
}
