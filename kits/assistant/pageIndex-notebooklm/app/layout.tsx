import type { Metadata } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PageIndex NotebookLM — Vectorless Document Intelligence",
  description:
    "Chat with your documents using PageIndex's agentic tree-structured retrieval. No vectors, no chunking — powered by Lamatic and Groq.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body style={{ fontFamily: "var(--font-sans, 'DM Sans', system-ui, sans-serif)" }}>
        {children}
      </body>
    </html>
  );
}
