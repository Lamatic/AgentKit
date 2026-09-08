import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "send-gate · Lamatic AgentKit",
  description: "A pre-send gate for agent-written messages: every figure, date, link and status is verified against a source of truth before anything reaches a customer."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
