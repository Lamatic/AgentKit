import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SmoothScroll from "../components/SmoothScroll";
import Navbar from "../components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Peer Demo Showcase",
  description: "High fidelity Peer Demo Showcase built with Next.js and Framer Motion",
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
