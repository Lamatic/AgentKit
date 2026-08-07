import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PR Companion",
  description: "Turn a diff and commit messages into a polished PR description.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
