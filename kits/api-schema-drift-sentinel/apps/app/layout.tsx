import './globals.css';

export const metadata = {
  title: 'API Schema Drift Sentinel',
  description: 'Deterministic AST diffing paired with AI-driven migration orchestration.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}