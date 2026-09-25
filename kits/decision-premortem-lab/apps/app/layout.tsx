import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Decision Pre-Mortem Lab",
  description: "Pressure-test important decisions before committing resources.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
