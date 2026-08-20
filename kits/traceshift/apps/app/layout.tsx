import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TraceShift — Production trace optimizer",
  description: "Mine successful Lamatic traces for evidence-backed flow optimizations.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
