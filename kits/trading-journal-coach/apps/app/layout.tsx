import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trading Journal Coach",
  description:
    "Upload your trade log and get an honest behavioural coaching brief from your own executed trades.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
