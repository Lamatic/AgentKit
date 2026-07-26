import "./globals.css";

export const metadata = {
  title: "Flow Launch Auditor",
  description: "Lamatic Flow go-live readiness review"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
