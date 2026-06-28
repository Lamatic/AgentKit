import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SRE Incident Postmortem Agent",
  description:
    "Generate structured, blameless SRE incident postmortems with Lamatic.",
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
