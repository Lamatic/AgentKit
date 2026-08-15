import type { Metadata } from "next";
import "./globals.css";

export const runtime = "nodejs";
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Atlas Agent | Lamatic AgentKit",
  description: "Approval-gated PRD-to-execution workflow with explainable assignment."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
