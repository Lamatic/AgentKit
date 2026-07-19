'use client';

import { useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import Link from 'next/link';

export default function Navbar() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 50) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  });

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out border-b ${
        isScrolled
          ? 'py-3 bg-black/60 backdrop-blur-md border-white/10 shadow-lg'
          : 'py-6 bg-transparent border-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tighter text-white flex items-center gap-2 relative group">
          <div className="absolute inset-0 bg-blue-500/20 rounded-lg blur-md group-hover:bg-blue-500/40 transition-all duration-300"></div>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center relative z-10 border border-white/20 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <span className="text-white text-sm font-black">P</span>
          </div>
          <span className="relative z-10">Peer Demo</span>
        </Link>
        <div className="flex items-center gap-6 text-sm font-medium text-gray-300">
          <Link href="/" className="hover:text-white transition-colors">Submit</Link>
          <Link href="/gallery" className="hover:text-white transition-colors">Gallery</Link>
          <Link href="/admin" className="hover:text-white transition-colors">Admin</Link>
        </div>
      </div>
    </motion.nav>
  );
}
