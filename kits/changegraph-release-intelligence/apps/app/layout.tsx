import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title:
    "ChangeGraph — Semantic Release Intelligence",
  description:
    "Compare Lamatic workflow exports, calculate release risk, and generate safe promotion plans.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}