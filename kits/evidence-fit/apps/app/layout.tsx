import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EvidenceFit",
  description:
    "Compare fixed-width and clause-aware chunking against labelled evidence spans and get a " +
    "deterministic SHIP / TUNE / BLOCK verdict about whether a RAG retrieval config can return " +
    "complete evidence.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
