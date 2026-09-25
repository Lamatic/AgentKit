'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import ThemeToggle from '@/app/(protected)/components/ThemeToggle';
import BrandLogo from '@/components/BrandLogo';
import { clearStoredHistory } from '@/lib/history';
import { useSessionUserId } from '@/components/session-provider';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Workspace' },
  { href: '/history', label: 'History' },
];

export default function TopNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const userId = useSessionUserId();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-outline-variant/60 bg-background/90 backdrop-blur-md">
      <div className="flex h-16 w-full items-center justify-between px-6 md:px-8">
        <div className="flex items-center gap-2">
          <BrandLogo className="h-9 w-9" />
          <span className="font-headline text-2xl font-bold tracking-tight text-primary">
            Queryline
          </span>
        </div>

        <nav className="hidden h-full items-end gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-full items-center pb-1 font-body text-sm transition-colors duration-200",
                isActive(item.href)
                  ? "border-b-2 border-primary font-bold text-primary"
                  : "text-on-surface-variant hover:text-primary"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            type="button"
            title={menuOpen ? "Close navigation" : "Open navigation"}
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(v => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary md:hidden"
          >
            {menuOpen ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
          </button>
          <form action="/logout" method="post" onSubmit={() => clearStoredHistory(userId)}>
            <button
              type="submit"
              title="Sign out"
              aria-label="Sign out"
              className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </form>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-outline-variant/40 bg-background md:hidden" aria-label="Mobile navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMenu}
              className={cn(
                "block px-6 py-3 font-body text-sm transition-colors",
                isActive(item.href)
                  ? "font-bold text-primary"
                  : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}