import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Webhook Reliability Architect",
  description:
    "Turn a webhook delivery contract into an idempotency, retry, dead-letter, observability, and failure-testing blueprint.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
