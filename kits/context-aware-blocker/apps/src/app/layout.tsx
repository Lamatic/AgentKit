import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LamaBlock — Context-Aware Blocker",
  description: "An AI-powered Chrome Extension that blocks distracting websites based on page context, not just URLs. Built with Lamatic.ai.",
};

/**
 * The root layout for the Next.js application.
 * 
 * Injects global fonts (Geist and Material Symbols) and establishes the 
 * base HTML structure for the React tree. This file wraps every page.
 * 
 * @param {Object} props - The layout props.
 * @param {React.ReactNode} props.children - The specific page content to render.
 * @returns {JSX.Element} The rendered HTML document structure.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
