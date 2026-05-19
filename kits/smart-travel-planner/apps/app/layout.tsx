import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Smart Travel Planner",
  description: "AI-powered travel planner with itinerary generator and travel chatbot",
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