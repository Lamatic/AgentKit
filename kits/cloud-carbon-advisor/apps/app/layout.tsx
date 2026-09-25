import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cloud Carbon Advisor",
  description:
    "Git blame for your cloud carbon — turn a usage export into an auditable CO₂e footprint and an impact-ranked decarbonization plan.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
