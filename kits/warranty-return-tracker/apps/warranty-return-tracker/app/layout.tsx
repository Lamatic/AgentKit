import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Warranty & Return Tracker",
  description: "Track return windows and warranty deadlines from purchase receipts."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
