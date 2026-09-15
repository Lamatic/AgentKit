import React from "react";
import "./globals.css";

export const metadata = {
  title: "Visual Return Assessor | Lamatic AI AgentKit",
  description:
    "Autonomous damage inspection & return policy routing powered by Lamatic AI",
};

/**
 * Root layout wrapper for Visual Return Assessor UI.
 * @param {Object} props - Component props containing children node.
 * @returns {JSX.Element} The root layout container.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
