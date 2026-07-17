import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SRE Command Center | Lamatic AgentKit",
  description:
    "AI-powered Site Reliability Engineering Command Center. Simulate, triage, and auto-remediate production incidents using 3-flow Micro-Flow Architecture on Lamatic.ai.",
  keywords: ["SRE", "incident management", "AI", "DevOps", "Lamatic", "runbook", "triage"],
  icons: {
    icon: "https://studio.lamatic.ai/logo-short.svg",
  },
  openGraph: {
    title: "SRE Command Center",
    description: "AI-powered incident simulation, triage, and remediation",
    type: "website",
  },
};

/**
 * Next.js App Router root layout component setting up HTML document wrapper, fonts, and SEO metadata.
 * @param props Props containing page children elements.
 * @returns React JSX root layout element.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="https://studio.lamatic.ai/logo-short.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
