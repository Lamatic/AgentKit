import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Trade Finance Document Validator | AgentKit",
  description:
    "AI-powered first-pass compliance review of trade finance documents — Letters of Credit, trade licenses, and commercial invoices.",
  keywords: ["trade finance", "document validation", "Letter of Credit", "compliance", "AI"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
