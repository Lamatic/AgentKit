import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Claim Appeal Writer",
  description: "Turn an insurance denial letter and your policy into a cited, ready-to-send appeal."
};

/** App shell: header, content column, and the standing not-legal-advice notice. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="border-b" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg text-white" style={{ background: "var(--accent)" }}>
                <span className="text-lg font-bold">A</span>
              </div>
              <div>
                <div className="text-base font-semibold leading-tight">Claim Appeal Writer</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>Built with Lamatic AgentKit</div>
              </div>
            </div>
            <a
              href="https://github.com/Lamatic/AgentKit/tree/main/kits/claim-appeal-writer"
              className="text-sm underline-offset-4 hover:underline"
              style={{ color: "var(--muted)" }}
              target="_blank"
              rel="noreferrer"
            >
              Source
            </a>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-6 pb-10 pt-4 text-xs" style={{ color: "var(--muted)" }}>
          AI-generated drafts for your review — not legal advice. Verify all deadlines with your insurer and state regulator before sending.
        </footer>
      </body>
    </html>
  );
}
