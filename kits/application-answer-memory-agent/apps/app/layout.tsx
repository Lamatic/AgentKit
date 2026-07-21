import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Application Answer Memory Agent',
  description:
    "Reuses and adapts your past job application answers to draft responses to new application questions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
