"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function LandingPage() {
  const [activeSlide, setActiveSlide] = useState(0);

  const features = [
    { title: "Jailbreak Resistance", desc: "Detects ignored system prompts and roleplay bypasses.", icon: "🛡️", color: "from-blue-500 to-cyan-400" },
    { title: "Hallucination Risk", desc: "Verifies grounding and catches fabricated facts.", icon: "👁️", color: "from-purple-500 to-pink-500" },
    { title: "Refusal Consistency", desc: "Ensures models politely decline harmful requests.", icon: "🛑", color: "from-red-500 to-orange-500" },
    { title: "Bias & Stereotypes", desc: "Scans for demographic and cultural prejudice.", icon: "⚖️", color: "from-emerald-400 to-teal-500" }
  ];

  // Auto-play the slider
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % features.length);
    }, 3000); // Changes every 3 seconds
    return () => clearInterval(timer);
  }, [features.length]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 relative overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* Background Gradients */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-blue-600/20 to-transparent blur-[100px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Navigation (Centered Logo) */}
      <nav className="relative z-20 max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        {/* Left invisible spacer to keep flexbox balanced */}
        <div className="w-1/3 hidden md:block"></div>

        {/* Centered Animated Logo */}
        <div className="w-full md:w-1/3 flex justify-center items-center gap-3 group cursor-pointer">
          <div className="relative">
            {/* Pulsing Glow behind the icon */}
            <div className="absolute inset-0 bg-blue-500 rounded-lg blur-md opacity-40 group-hover:opacity-100 animate-pulse transition-opacity duration-500"></div>
            {/* Icon Container with spin on hover */}
            <div className="relative p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)] transform transition-all duration-700 group-hover:rotate-[360deg] group-hover:scale-110">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            </div>
          </div>
          <span className="text-2xl font-bold tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 transition-all duration-300">
            Sentinel
          </span>
        </div>

        {/* Right Links */}
        <div className="w-1/3 hidden md:flex justify-end items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
          <a href="https://github.com" target="_blank" className="hover:text-white transition-colors border border-slate-700 px-4 py-1.5 rounded-full hover:bg-slate-800">GitHub PR</a>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-24 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-widest mb-8 hover:bg-blue-500/20 transition-colors cursor-default">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Powered by Lamatic.ai AgentKit
        </div>
        
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

      {/* Animated Slider Section */}
      <div id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-24 border-t border-slate-800/50">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Four Dimensions of Safety</h2>
          <p className="text-slate-400">Comprehensive scoring powered by deep reasoning models.</p>
        </div>
        
        <div className="max-w-3xl mx-auto relative">
          {/* Slider Container */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 md:p-12 h-64 flex flex-col justify-center items-center text-center shadow-2xl relative overflow-hidden group transition-all duration-500 hover:border-slate-600">
            
            {/* Dynamic Background Glow based on active slide */}
            <div className={`absolute inset-0 bg-gradient-to-br ${features[activeSlide].color} opacity-5 transition-colors duration-1000`}></div>

            <div className="text-5xl mb-6 transform transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-2">
              {features[activeSlide].icon}
            </div>
            <h3 className="text-2xl font-bold text-slate-100 mb-3 transition-all duration-500">
              {features[activeSlide].title}
            </h3>
            <p className="text-slate-400 text-lg transition-all duration-500">
              {features[activeSlide].desc}
            </p>
          </div>

          {/* Slider Dots */}
          <div className="flex justify-center gap-3 mt-8">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveSlide(index)}
                className={`h-2 rounded-full transition-all duration-500 ${activeSlide === index ? 'w-8 bg-blue-500' : 'w-2 bg-slate-700 hover:bg-slate-500'}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Appealing Hover Animations - How It Works */}
      <div id="how-it-works" className="relative z-10 max-w-7xl mx-auto px-6 py-24 border-t border-slate-800/50">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How Sentinel Operates</h2>
          <p className="text-slate-400">A seamless pipeline from prompt injection to vulnerability scoring.</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8 items-center justify-center relative">
          
          <div className="group bg-slate-900/50 border border-slate-800 p-8 rounded-2xl text-center relative z-10 flex-1 hover:border-blue-500/50 transition-all duration-500 hover:-translate-y-4 hover:shadow-[0_20px_40px_rgba(59,130,246,0.15)] hover:bg-slate-900/80">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6 border border-blue-500/30 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500 group-hover:scale-110">1</div>
            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">Inject Payload</h3>
            <p className="text-sm text-slate-400">Enter the user prompt and the model's generated response into the secure Sentinel environment.</p>
          </div>
          
          <div className="hidden md:block text-slate-600 text-3xl animate-pulse">→</div>

          <div className="group bg-slate-900/50 border border-slate-800 p-8 rounded-2xl text-center relative z-10 flex-1 hover:border-purple-500/50 transition-all duration-500 hover:-translate-y-4 hover:shadow-[0_20px_40px_rgba(168,85,247,0.15)] hover:bg-slate-900/80">
            <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6 border border-purple-500/30 group-hover:bg-purple-500 group-hover:text-white transition-all duration-500 group-hover:scale-110">2</div>
            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors">Lamatic Evaluation</h3>
            <p className="text-sm text-slate-400">The AgentKit workflow securely triggers, passing the data to advanced adversarial scoring models.</p>
          </div>

          <div className="hidden md:block text-slate-600 text-3xl animate-pulse">→</div>

          <div className="group bg-slate-900/50 border border-slate-800 p-8 rounded-2xl text-center relative z-10 flex-1 hover:border-emerald-500/50 transition-all duration-500 hover:-translate-y-4 hover:shadow-[0_20px_40px_rgba(16,185,129,0.15)] hover:bg-slate-900/80">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6 border border-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500 group-hover:scale-110">3</div>
            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">Audit Report</h3>
            <p className="text-sm text-slate-400">Receive a structured JSON assessment detailing the exact risk level across four core safety dimensions.</p>
          </div>
        </div>
      </div>

      {/* Personalized Footer */}
      <footer className="relative z-10 border-t border-slate-800/50 py-12 text-center bg-slate-950/80 mt-12">
        <div className="max-w-3xl mx-auto px-6">
          <div className="inline-block p-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
            <div className="bg-slate-950 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase text-slate-300">
              Project Finalized
            </div>
          </div>
          <p className="text-lg text-slate-300 font-medium mb-1">
            Engineered for the Lamatic.ai AgentKit Challenge
          </p>
          <p className="text-slate-500 mb-6">
            Mission executed and deployed by <span className="text-white font-bold tracking-wide hover:text-blue-400 transition-colors cursor-pointer">Agent Arooj Rafique</span>
          </p>
          <p className="text-xs text-slate-700">© 2026 Sentinel Auditor. All systems operational.</p>
        </div>
      </footer>

    </main>
  );
}