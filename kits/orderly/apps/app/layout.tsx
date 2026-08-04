import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orderly — one order for your table",
  description:
    "Photograph a menu in any language and get one concrete order for your table, " +
    "respecting every diner's allergies and diet and a hard budget ceiling.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // The app is used standing in a restaurant doorway; let people zoom the menu.
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
