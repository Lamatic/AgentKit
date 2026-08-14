import "./globals.css";

export const metadata = {
  title: "PII Sovereign Guardrail — Lamatic AgentKit",
  description:
    "Enterprise middleware that masks PII before it reaches an external LLM, and rehydrates it in the response."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
