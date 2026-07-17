import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

/** Long index/synthesize server actions (Vercel Hobby max is 300s). */
export const maxDuration = 300;

export const metadata: Metadata = {
  title: "Reading List Digest",
  description:
    "Index articles and synthesize a citation-backed research digest with contradictions and highlights.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
