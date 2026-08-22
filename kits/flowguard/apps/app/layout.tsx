import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FlowGuard — the reliability layer for Lamatic flows',
  description:
    'Generate test suites, run, judge, red-team, and regression-test any Lamatic flow.',
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
