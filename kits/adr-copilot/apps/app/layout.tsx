import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ADR Copilot — Architecture Decision Record Agent Kit",
  description: "Automated Architecture Decision Record (ADR) generator powered by Lamatic.ai",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
