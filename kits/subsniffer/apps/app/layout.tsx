import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "SubSniffer — Subscription Audit",
  description:
    "Paste a bank statement and find the subscriptions you're paying for but not using.",
};

/**
 * Root layout for the SubSniffer app (html/body shell + page metadata).
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
