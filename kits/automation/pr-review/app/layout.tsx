import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PR Review Agent | Lamatic AgentKit",
  description: "AI-powered GitHub pull request reviewer.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
