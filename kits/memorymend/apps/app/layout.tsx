import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "MemoryMend — Agent Memory Integrity",
  description: "Audit and safely repair long-lived AI agent memory with evidence-backed provenance and risk controls.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
