import type { Metadata } from "next";
import "./pr-companion.css";

export const metadata: Metadata = {
  title: "PR Companion",
  description: "Turn a diff and commit messages into a polished PR description.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}