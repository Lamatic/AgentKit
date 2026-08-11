import "./globals.css";

export const metadata = {
  title: "Transit Incident Manager",
  description: "AI-powered transit incident response assistant",
};

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