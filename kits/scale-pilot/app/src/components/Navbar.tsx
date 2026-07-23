"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface NavbarProps {
  onOpenModal: () => void;
  onSelectSampleReport?: () => void;
}

export function Navbar({ onOpenModal, onSelectSampleReport }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");

  useEffect(() => {
    const sectionIds = ["problem", "how-it-works", "bento-features"];
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 220;

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const section = document.getElementById(sectionIds[i]);
        if (section) {
          const top = section.offsetTop;
          const height = section.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sectionIds[i]);
            return;
          }
        }
      }
      setActiveSection("");
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (id: string) => {
    setMobileMenuOpen(false);
    if (id === "sample-report" && onSelectSampleReport) {
      onSelectSampleReport();
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const getNavItemClasses = (sectionId: string) => {
    const isActive = activeSection === sectionId;
    if (isActive) {
      return "bg-[#0D0D0B] text-[#FCDD2D] px-2.5 py-1 border border-[#0D0D0B] font-bold transition-all inline-block";
    }
    return "text-[#555550] hover:text-[#0D0D0B] px-2.5 py-1 transition-colors cursor-pointer inline-block";
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-50 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#E2E2DF]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo Monogram & Brand */}
        <button
          onClick={() => handleNavClick("hero-section")}
          className="flex items-center gap-3 cursor-pointer border-none bg-transparent p-0 text-left"
          aria-label="ScalePilot Home"
        >
          <div className="w-8 h-8 bg-[#FCDD2D] border border-[#0D0D0B] flex items-center justify-center font-mono font-bold text-xs text-[#0D0D0B]">
            SP
          </div>
          <span className="font-display font-bold text-lg text-[#0D0D0B] tracking-tight">
            ScalePilot
          </span>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.1em]">
          <button
            onClick={() => handleNavClick("problem")}
            className={getNavItemClasses("problem")}
          >
            Product
          </button>
          <button
            onClick={() => handleNavClick("how-it-works")}
            className={getNavItemClasses("how-it-works")}
          >
            How It Works
          </button>
          <button
            onClick={() => handleNavClick("bento-features")}
            className={getNavItemClasses("bento-features")}
          >
            Pricing &amp; Matrix
          </button>
          <button
            onClick={() => handleNavClick("sample-report")}
            className="hover:text-[#0D0D0B] text-[#555550] px-2.5 py-1 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#FCDD2D] inline-block animate-pulse"></span>
            Sample Report
          </button>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/sign-in"
            className="px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider text-[#555550] hover:text-[#0D0D0B] transition-colors cursor-pointer"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="px-4 py-2 bg-[#FCDD2D] hover:bg-[#ebd028] text-[#0D0D0B] border border-[#0D0D0B] font-mono text-[11px] uppercase tracking-widest font-bold transition-all cursor-pointer shadow-none flex items-center gap-2"
          >
            <span>Get Started</span>
            <span className="text-[#0D0D0B]">→</span>
          </Link>
        </div>

        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/sign-up"
            className="px-2.5 py-1.5 bg-[#FCDD2D] text-[#0D0D0B] font-mono text-[10px] font-bold uppercase tracking-wider border border-[#0D0D0B] text-center"
          >
            Analyze
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="p-2 border border-[#E2E2DF] bg-[#F8F8F6] text-[#0D0D0B]"
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E2E2DF] bg-[#FFFFFF] px-4 py-6 space-y-4 font-mono text-xs uppercase tracking-widest">
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => handleNavClick("problem")}
              className={`text-left py-2 border-b border-[#E2E2DF] ${
                activeSection === "problem"
                  ? "bg-[#0D0D0B] text-[#FCDD2D] px-2 font-bold"
                  : "text-[#555550] hover:text-[#0D0D0B]"
              }`}
            >
              Product
            </button>
            <button
              onClick={() => handleNavClick("how-it-works")}
              className={`text-left py-2 border-b border-[#E2E2DF] ${
                activeSection === "how-it-works"
                  ? "bg-[#0D0D0B] text-[#FCDD2D] px-2 font-bold"
                  : "text-[#555550] hover:text-[#0D0D0B]"
              }`}
            >
              How It Works
            </button>
            <button
              onClick={() => handleNavClick("bento-features")}
              className={`text-left py-2 border-b border-[#E2E2DF] ${
                activeSection === "bento-features"
                  ? "bg-[#0D0D0B] text-[#FCDD2D] px-2 font-bold"
                  : "text-[#555550] hover:text-[#0D0D0B]"
              }`}
            >
              Pricing &amp; Matrix
            </button>
            <button
              onClick={() => handleNavClick("sample-report")}
              className="text-left py-2 border-b border-[#E2E2DF] text-[#0D0D0B] flex items-center justify-between font-bold"
            >
              <span>Sample Report</span>
              <span className="text-[10px] bg-[#FCDD2D] text-[#0D0D0B] font-bold px-1.5 py-0.5 border border-[#0D0D0B]">LIVE</span>
            </button>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/sign-up"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 bg-[#FCDD2D] text-[#0D0D0B] font-bold border border-[#0D0D0B] font-mono text-center text-xs uppercase tracking-widest"
            >
              Analyze Your Architecture →
            </Link>
          </div>
        </div>
      )}
    </motion.header>
  );
}
