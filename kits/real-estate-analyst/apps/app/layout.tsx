import type React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Real Estate Investment Analyst",
  description: "Investor-grade property analysis powered by Lamatic.ai",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
