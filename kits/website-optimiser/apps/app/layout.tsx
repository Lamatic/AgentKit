import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "WebRevive AI – Autonomous Website Audit & Cold Outreach Agent",
  description: "AI-powered autonomous sales agent that analyzes business websites and generates complete audit reports, redesign strategies, cold outreach emails, LinkedIn messages, and business proposals.",
  keywords: ["website audit", "SEO audit", "cold outreach", "AI agent", "lead generation", "website analysis"],
  openGraph: {
    title: "WebRevive AI",
    description: "Transform any website URL into a full audit, redesign strategy, and cold outreach campaign.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
