import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Terraform Plan Gate",
  description: "Risk-gate a Terraform plan against organisation policy before apply.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
