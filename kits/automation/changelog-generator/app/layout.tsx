import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Changelog Generator",
  description: "Generate structured changelogs from GitHub repositories and date ranges.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
  <html lang="en">
    <body
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased min-h-full flex flex-col`}
    >
      {children}
    </body>
  </html>
);
}
