'use client';

import { useState } from 'react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Sparkles } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 50) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  });

  const navLinks = [
    { href: '/', label: 'Submit' },
    { href: '/gallery', label: 'Gallery' },
    { href: '/judge', label: 'Judge' },
    { href: '/admin', label: 'Admin' },
  ];

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out border-b ${
        isScrolled
          ? 'py-3 bg-black/60 backdrop-blur-md border-white/10 shadow-lg'
          : 'py-6 bg-transparent border-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 relative group select-none">
          <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-lg group-hover:bg-blue-500/35 transition-all duration-300"></div>
          <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 flex items-center justify-center relative z-10 border border-white/20 shadow-[0_0_15px_rgba(99,102,241,0.45)] group-hover:scale-105 transition-transform duration-300">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="relative z-10 text-white font-extrabold tracking-tight text-lg">
            Sponsor<span className="text-blue-400">Flow</span>
          </span>
        </Link>

        {/* Desktop Links with sliding active indicator */}
        <div className="hidden md:flex items-center gap-1 bg-white/5 border border-white/5 p-1.5 rounded-2xl relative">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 text-sm font-semibold rounded-xl transition-colors duration-200 select-none ${
                  isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 border border-blue-500/20 rounded-xl -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Action controls & Mobile menu toggle */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors cursor-pointer"
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav-panel"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="mobile-nav-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden border-t border-white/10 bg-[#070514]/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="flex flex-col gap-2 p-6">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-xl text-base font-semibold border transition-all ${
                      isActive
                        ? 'bg-blue-600/20 border-blue-500/30 text-white'
                        : 'bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
