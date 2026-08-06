import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Debate Arena",
  description:
    "Pose any tradeoff or decision and watch two AI agents argue opposing sides, then get an impartial judge's verdict.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
