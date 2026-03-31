import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Founder Lens | AI Startup Research Agent",
  description:
    "multi-phase agentic startup research agent. Submit a startup idea and get a brutally honest investor-grade brief built from real web data.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
