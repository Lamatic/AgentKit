import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rainwater Harvesting Planner",
  description:
    "Size a rooftop rainwater harvesting system from 5 years of real rainfall data, then get a practical installation and maintenance plan.",
  generator: "Lamatic AgentKit",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
