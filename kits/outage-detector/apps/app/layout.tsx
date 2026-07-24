import "./globals.css";

export const metadata = {
  title: "Outage Detector",
  description:
    "Cross-ticket root-cause correlation demo built on Lamatic — catches a shared outage before it looks like a pattern to a human.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
