import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevDiary — your work, remembered",
  description:
    "AI work journal for developers. Push code, get a clean journal entry from the real diffs, and chat with your work history.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
