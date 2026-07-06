import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Offer Negotiator — turn your offer into a plan",
  description:
    "Paste a job offer and get an assessment, target numbers, talking points, and a ready-to-send counter-offer email.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="desk">{children}</div>
      </body>
    </html>
  );
}
