import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "PII Ingestion Gate",
  description:
    "Scan and redact documents for PII, credentials, and confidential data before they are embedded into a RAG vector index.",
};

/**
 * Root layout for the PII Ingestion Gate app (html/body shell + metadata).
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
