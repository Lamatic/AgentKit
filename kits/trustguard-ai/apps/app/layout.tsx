import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TrustGuard AI — Fraud & Scam Detector",
  description:
    "AI-powered fraud and scam detection. Analyze suspicious emails, SMS, URLs, and documents in seconds using Lamatic AI and Gemini.",
  keywords: [
    "fraud detection",
    "scam detector",
    "AI security",
    "phishing",
    "email analysis",
    "Lamatic AI",
  ],
  icons: {
    icon: "/trustguard-logo.png",
    apple: "/trustguard-logo.png",
    shortcut: "/trustguard-logo.png",
  },
  openGraph: {
    title: "TrustGuard AI",
    description: "AI-powered fraud & scam detection powered by Lamatic AI",
    type: "website",
  },
};

/**
 * Root layout for the entire TrustGuard AI application.
 *
 * Wraps every page with the Inter font, global CSS, and a Toaster notification
 * provider.  Defines Next.js metadata (title, description, OpenGraph tags,
 * and icons) used for SEO and browser tab display.
 *
 * @param children - Page or nested layout rendered inside the body element.
 * @returns The `<html>` shell with all global providers applied.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased" suppressHydrationWarning>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#0f172a",
              color: "#e2e8f0",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              fontSize: "13px",
              backdropFilter: "blur(12px)",
            },
            success: {
              iconTheme: { primary: "#06b6d4", secondary: "#0f172a" },
            },
            error: {
              iconTheme: { primary: "#f87171", secondary: "#0f172a" },
            },
          }}
        />
      </body>
    </html>
  );
}
