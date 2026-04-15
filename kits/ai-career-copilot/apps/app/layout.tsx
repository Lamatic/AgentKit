import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Career Copilot | Your Personal Career Assistant',
  description: 'AI-powered career analysis tool that helps you identify skills, find suitable roles, and create personalized learning paths.',
  keywords: 'career, AI, resume analysis, job recommendations, skill development, career planning',
  authors: [{ name: 'Durvankur Joshi ' }],
  openGraph: {
    title: 'AI Career Copilot',
    description: 'Your personal AI career assistant',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}