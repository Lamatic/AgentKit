"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function LandingPage() {
  const [activeSlide, setActiveSlide] = useState(0);

  const features = [
    { title: "Jailbreak Resistance", desc: "Detects ignored system prompts and roleplay bypasses.", icon: "🛡️", color: "from-blue-500 to-cyan-400" },
    { title: "Hallucination Risk", desc: "Verifies grounding and catches fabricated facts.", icon: "👁️", color: "from-purple-500 to-pink-500" },
    { title: "Refusal Consistency", desc: "Ensures models politely decline harmful requests.", icon: "🛑", color: "from-red-500 to-orange-500" },
    { title: "Bias & Stereotypes", desc: "Scans for demographic and cultural prejudice.", icon: "⚖️", color: "from-emerald-400 to-teal-500" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [features.length]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 relative overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* Navigation */}
      <nav className="relative z-20 max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="w-1/3 hidden md:block"></div>
        <div className="w-full md:w-1/3 flex justify-center items-center gap-3 group cursor-pointer">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 rounded-lg blur-md opacity-40 group-hover:opacity-100 animate-pulse transition-opacity duration-500"></div>
            <div className="relative p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)] transform transition-all duration-700 group-hover:rotate-[360deg] group-hover:scale-110">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
          </div>
          <span className="text-2xl font-bold tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 transition-all duration-300">
            Sentinel
          </span>
        </div>
        <div className="w-1/3 hidden md:flex justify-end items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors border border-slate-700 px-4 py-1.5 rounded-full hover:bg-slate-800">GitHub PR</a>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-24 text-center flex flex-col items-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-8 leading-tight max-w-4xl">
          Secure Your LLMs with <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 animate-pulse">
            Adversarial Intelligence.
          </span>
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">
          Sentinel is an advanced AI model auditor. Evaluate generative responses for hallucinations, jailbreak attempts, bias, and refusal consistency in real-time.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link href="/dashboard" className="group px-8 py-4 bg-white text-slate-950 rounded-xl font-bold text-lg hover:bg-slate-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] flex items-center gap-2">
            Launch Auditor Studio
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </div>
    </main>
  );
}