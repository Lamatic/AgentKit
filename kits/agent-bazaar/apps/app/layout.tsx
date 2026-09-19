import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Bazaar — Dashboard",
  description: "Two-sided agent economy dashboard",
};

/** Root app layout. */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
