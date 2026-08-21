import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Data Quality Issue Detector",
  description: "Scans datasets for anomalies, missing values, duplicates, and formatting issues with Lamatic.",
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
