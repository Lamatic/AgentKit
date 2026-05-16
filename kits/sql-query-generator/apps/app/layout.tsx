import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SQL Query Generator",
  description:
    "Convert natural language questions into optimized SQL queries using AI.",
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
