import type React from "react";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SparkTrace",
  description: "Agentic Spark data-pipeline debugging copilot — live investigation console.",
};

// Sets the .dark class before hydration based on saved preference (falls back to
// prefers-color-scheme) so there's no flash-of-wrong-theme. Inline + tiny on purpose:
// no next-themes dependency required.
const themeInitScript = `
(function () {
  try {
    var stored = window.localStorage.getItem("sparktrace-theme");
    var dark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
