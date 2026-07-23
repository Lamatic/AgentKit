import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import { PreloaderWrapper } from "@/components/PreloaderWrapper";
import { CustomCursor } from "@/components/ui/CustomCursor";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ScalePilot — AI Architecture Evolution Assistant",
  description:
    "AI-powered architecture analysis for engineering teams that need to scale. Deep system analysis, zero generic advice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${inter.variable} h-full antialiased light`}
    >
      <body className="min-h-full flex flex-col bg-[#FFFFFF] text-[#0D0D0B] font-sans selection:bg-[#FCDD2D] selection:text-[#0D0D0B]">
        <CustomCursor />
        <PreloaderWrapper>{children}</PreloaderWrapper>
      </body>
    </html>
  );
}
