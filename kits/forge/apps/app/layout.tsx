import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Forge - AI Contract & Invoice Generator",
  description:
    "Generate professional contracts and invoices for cross-border freelance work. AI-powered pricing, governing law analysis, and document generation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}
