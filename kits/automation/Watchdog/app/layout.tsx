import type { Metadata } from "next";
import "../global.css";
export const metadata: Metadata = {
  title: "Intelligent Watchdog",
  description: "AI-powered competitor intelligence platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}