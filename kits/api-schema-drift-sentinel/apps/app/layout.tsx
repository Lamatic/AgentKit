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
      <body className="bg-[var(--background)] text-[var(--foreground)] antialiased">
        {children}
      </body>
    </html>
  );
}