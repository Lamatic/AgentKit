import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EDA Copilot — AI-Powered Exploratory Data Analysis",
  description:
    "Upload any CSV and get instant AI-powered statistical insights, correlation analysis, outlier detection, and ML readiness assessment — built with Lamatic.ai",
  openGraph: {
    title: "EDA Copilot",
    description: "AI-powered Exploratory Data Analysis in seconds",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-950">{children}</body>
    </html>
  );
}
