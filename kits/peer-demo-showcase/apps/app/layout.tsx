import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SmoothScroll from "../components/SmoothScroll";
import Navbar from "../components/Navbar";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://peer-demo-showcase.vercel.app"),
  title: {
    default: "Peer Demo Showcase | AI-Powered Project Matching",
    template: "%s | Peer Demo Showcase",
  },
  description:
    "Submit your GitHub project and let AI agents instantly match you with the perfect sponsor and breakout session. Built with Next.js, Framer Motion, and Lamatic AI.",
  keywords: [
    "hackathon",
    "project showcase",
    "sponsor matching",
    "AI agents",
    "Lamatic",
    "Next.js",
    "demo day",
  ],
  openGraph: {
    title: "Peer Demo Showcase | AI-Powered Project Matching",
    description:
      "Submit your GitHub project and let AI agents instantly match you with the perfect sponsor and breakout session.",
    siteName: "Peer Demo Showcase",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Peer Demo Showcase | AI-Powered Project Matching",
    description:
      "Submit your GitHub project and let AI agents instantly match you with the perfect sponsor.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}
    >
      <body className="bg-[#030014] text-white">
        <Toaster
          theme="dark"
          position="top-right"
          richColors
          toastOptions={{
            style: {
              background: "rgba(10, 10, 20, 0.9)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.1)",
            },
          }}
        />
        <SmoothScroll>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <div className="animated-bg"></div>
            <div className="pt-24 pb-12 flex-grow">
              {children}
            </div>
          </div>
        </SmoothScroll>
      </body>
    </html>
  );
}
