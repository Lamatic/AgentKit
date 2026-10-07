'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'nl-to-sql-theme';

export default function ThemeToggle() {
  // Initial state stays SSR-stable ('system') to avoid a hydration mismatch.
  // The persisted theme is restored in an effect after mount.
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    const storedTheme = localStorage.getItem(STORAGE_KEY) as 'light' | 'dark' | 'system' | null;
    if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
      setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const useDark = theme === 'dark' || (theme === 'system' && media.matches);
      root.classList.toggle('dark', useDark);
    };

    applyTheme();

    if (theme === 'system') {
      media.addEventListener('change', applyTheme);
      return () => media.removeEventListener('change', applyTheme);
    }
  }, [theme]);

  const handleToggle = () => {
    const nextTheme: 'light' | 'dark' | 'system' =
      theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';
    // Persist only on explicit user action, so the stored preference is never
    // clobbered by the mount-time default while restoring.
    localStorage.setItem(STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
  };

  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
  const label = theme === 'dark' ? 'Switch to light mode' : theme === 'light' ? 'Switch to system theme' : 'Switch to dark mode';

  return (
    <button
      onClick={handleToggle}
      title={label}
      aria-label={label}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
      )}
    >
      <Icon className="h-[18px] w-[18px]" />
    </button>
  );
}