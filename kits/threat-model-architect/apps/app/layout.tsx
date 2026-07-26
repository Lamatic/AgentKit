import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Threat Model Architect",
  description: "Generate structured, defensible threat models with Lamatic.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
