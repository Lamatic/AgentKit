import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Home Maintenance Triage | AI-Powered Home Issue Diagnosis",
  description:
    "Describe any home issue and get an instant AI triage: urgency level, DIY feasibility, safety hazards, which professional to call, and immediate action steps.",
  keywords: [
    "home maintenance",
    "AI triage",
    "home repair",
    "DIY",
    "emergency",
    "plumber",
    "electrician",
  ],
  openGraph: {
    title: "Home Maintenance Triage Agent",
    description:
      "Instantly diagnose any home problem with AI — know if it's an emergency, who to call, and what to do right now.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
