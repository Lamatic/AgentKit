import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EvidenceFit",
  description:
    "Compare fixed-width and clause-aware chunking against labelled evidence spans and get a " +
    "deterministic SHIP / TUNE / BLOCK verdict about whether a RAG retrieval config can return " +
    "complete evidence.",
};

/** App shell: sets the document language and the page's base surface and text colours. */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
