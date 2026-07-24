'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

function applyThemeClass(theme: 'dark' | 'light') {
  if (theme === 'light') {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  }
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const isLight = document.documentElement.classList.contains('light');
    const localTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;

    if (localTheme) {
      setTheme(localTheme);
      applyThemeClass(localTheme);
    } else if (isLight) {
      setTheme('light');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    applyThemeClass(nextTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors duration-200 shadow-md flex items-center justify-center cursor-pointer"
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-amber-400" />
      ) : (
        <Moon className="w-4 h-4 text-blue-500" />
      )}
    </button>
  );
}
