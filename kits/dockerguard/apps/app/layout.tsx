import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DockerGuard — Dockerfile security audit",
  description:
    "Paste a Dockerfile or docker-compose file and get a prioritized security and best-practice audit with fixes.",
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
