import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Supply Chain Risk Oracle",
  description:
    "Autonomous agent that scans global news and weather for supply chain disruptions, scores each supplier 0–100, and drafts mitigation emails for high-risk nodes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
