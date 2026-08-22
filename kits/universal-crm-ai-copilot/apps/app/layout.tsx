import React from "react";
import "./globals.css";

export const metadata = {
  title: "Universal Multi-CRM AI Copilot — Lamatic.ai",
  description: "AI-powered CRM Lead Intelligence & Webhook Payload Engine for Salesforce, SAP, Zoho, and MS Dynamics 365."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
