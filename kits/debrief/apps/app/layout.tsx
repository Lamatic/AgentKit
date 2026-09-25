import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Debrief — Interview Feedback Summarizer",
  description:
    "Paste messy interview feedback and get strengths, gaps, and action items in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
