"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <nav className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold text-gray-900 hover:text-brand-600 transition-colors">
          🎬 Movie Vocab Buddy
        </Link>
        {!isHome && (
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-brand-600 transition-colors flex items-center gap-1"
          >
            ← Home
          </Link>
        )}
      </div>
    </nav>
  );
}
