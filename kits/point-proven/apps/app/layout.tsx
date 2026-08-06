import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

/** Long index/synthesize server actions (Vercel Hobby max is 300s). */
export const maxDuration = 300;

export const metadata: Metadata = {
  title: "Point Proven",
  description:
    "Index your sources and build a citation-backed brief for debate prep—key claims, clash points, and agreed points.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
