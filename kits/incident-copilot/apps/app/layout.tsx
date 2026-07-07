import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Incident Copilot",
  description:
    "An investigation agent for on-call engineers — grounds ranked root-cause hypotheses in runbooks and recent GitHub activity, and drafts Slack + postmortem."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
