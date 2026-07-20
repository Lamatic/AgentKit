import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bug Bridge — Cluster Dashboard",
  description: "Support-to-Engineering cluster tracker",
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
