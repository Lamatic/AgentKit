import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "API Change Review",
  description:
    "Diff two OpenAPI specs, classify every change by consumer impact, and draft migration notes and a changelog entry.",
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
