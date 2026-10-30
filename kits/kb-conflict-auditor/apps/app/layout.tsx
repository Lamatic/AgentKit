import type { Metadata } from 'next';
import type React from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'KB Conflict Auditor',
  description:
    'Finds contradicting facts across a documentation set: code extracts the facts, an AI model judges each pair, and code verifies authority and patches before anything is reported.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
