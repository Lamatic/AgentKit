import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

/**
 * Server Actions inherit `maxDuration` from the enclosing page or layout, and the
 * analysis flow makes six sequential model calls. Declared here rather than in
 * app/page.tsx because route segment config cannot be exported from a Client Component.
 * 300s is the Vercel Hobby ceiling; the action's own timeout sits below it so a slow
 * provider surfaces a readable error instead of a platform 504.
 */
export const maxDuration = 300;

export const metadata: Metadata = {
  title: "Appeal Copilot | Insurance Denial Appeal Assistant",
  description:
    "Paste an insurance claim denial letter and get a classified, scored, evidence-checked first-level appeal package back in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
