import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Research Paper Analyzer · Lamatic.ai",
  description:
    "Upload any academic PDF and get a structured breakdown: problem statement, methodology, findings, limitations, and plain-English summary.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
