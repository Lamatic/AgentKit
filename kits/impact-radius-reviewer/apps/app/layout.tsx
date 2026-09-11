import type { Metadata } from "next";
import "./impact-review.css";

export const metadata: Metadata = {
  title: "Impact Radius Reviewer",
  description:
    "Paste a diffcontext compile --json payload and a PR diff to get a reviewer brief: what breaks, test coverage, and blind spots.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
