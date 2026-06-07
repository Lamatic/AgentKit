import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MoU Drafter — First-Draft Vendor Contracts",
  description:
    "Draft vendor MoUs and small-org contracts from structured input. LaTeX output with in-browser PDF preview. A first draft for human review — not legal advice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased dark-glow-bg text-foreground min-h-screen">
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
