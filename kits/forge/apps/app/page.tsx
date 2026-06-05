"use client";

import Link from "next/link";
import { ArrowRight, FileText, Scale, DollarSign, Sparkles } from "lucide-react";
import { AuroraBackground } from "@/components/AuroraBackground";
import { GalaxyButton } from "@/components/GalaxyButton";

export default function Home() {
  return (
    <AuroraBackground>
      <main className="min-h-screen flex flex-col relative z-10">
        {/* Hero */}
        <div className="flex-1 flex items-center justify-center px-6 py-20 mt-10">
          <div className="max-w-3xl text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full liquid-glass-pill text-sm font-medium mb-10 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Sparkles className="w-4 h-4 animate-icon-color" />
              <span className="text-gradient-animate">AI-Powered Document Generation</span>
            </div>

            <h1 className="text-[clamp(2.5rem,8vw,5.5rem)] font-normal tracking-[-0.04em] mb-8 leading-[1.05] text-white">
              Contracts & invoices,<br />
              <span className="text-gradient-animate font-medium">forged</span> in minutes
            </h1>

            <p className="text-[clamp(1rem,2vw,1.25rem)] text-white/60 mb-12 max-w-2xl mx-auto leading-relaxed tracking-[-0.01em]">
              Enter your project details once. Get AI-suggested pricing calibrated
              to your experience. Walk away with a professional contract and
              matching invoice, ready to sign and export.
            </p>

            <GalaxyButton href="/new" text="Start a New Project" />
          </div>
        </div>

        {/* Feature cards */}
        <div className="px-6 pb-24 relative z-10">
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                Graphic: function PricingGraphic() {
                  return (
                    <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
                      <rect x="6" y="24" width="6" height="10" rx="3" fill="url(#pricingGrad1)" />
                      <rect x="17" y="14" width="6" height="20" rx="3" fill="url(#pricingGrad2)" />
                      <rect x="28" y="6" width="6" height="28" rx="3" fill="url(#pricingGrad3)" />
                      <defs>
                        <linearGradient id="pricingGrad1" x1="9" y1="24" x2="9" y2="34" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#6366f1" stopOpacity="0.4" />
                          <stop offset="1" stopColor="#6366f1" stopOpacity="0.1" />
                        </linearGradient>
                        <linearGradient id="pricingGrad2" x1="20" y1="14" x2="20" y2="34" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#6366f1" stopOpacity="0.8" />
                          <stop offset="1" stopColor="#6366f1" stopOpacity="0.2" />
                        </linearGradient>
                        <linearGradient id="pricingGrad3" x1="31" y1="6" x2="31" y2="34" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#ffffff" />
                          <stop offset="1" stopColor="#6366f1" />
                        </linearGradient>
                      </defs>
                    </svg>
                  );
                },
                title: "Smart Pricing",
                desc: "AI-calibrated rates based on your experience, geography, and market data.",
              },
              {
                Graphic: function LegalGraphic() {
                  return (
                    <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
                      <path d="M20 4L34 11V29L20 36L6 29V11L20 4Z" fill="url(#legalGrad1)" fillOpacity="0.2" stroke="url(#legalGrad2)" strokeWidth="1.5" />
                      <circle cx="20" cy="20" r="8" fill="url(#legalGrad2)" />
                      <circle cx="20" cy="20" r="3" fill="#ffffff" />
                      <defs>
                        <linearGradient id="legalGrad1" x1="20" y1="4" x2="20" y2="36" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#6366f1" />
                          <stop offset="1" stopColor="#6366f1" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="legalGrad2" x1="20" y1="4" x2="20" y2="36" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#ffffff" />
                          <stop offset="1" stopColor="#6366f1" />
                        </linearGradient>
                      </defs>
                    </svg>
                  );
                },
                title: "Legal Guidance",
                desc: "Compare governing law options with pros & cons tailored to your situation.",
              },
              {
                Graphic: function DocsGraphic() {
                  return (
                    <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
                      <rect x="8" y="10" width="20" height="26" rx="4" fill="url(#docsGrad1)" fillOpacity="0.3" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.5" />
                      <rect x="14" y="4" width="20" height="26" rx="4" fill="url(#docsGrad2)" />
                      <path d="M20 12H28M20 18H28M20 24H24" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                      <defs>
                        <linearGradient id="docsGrad1" x1="18" y1="10" x2="18" y2="36" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#6366f1" />
                          <stop offset="1" stopColor="#6366f1" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="docsGrad2" x1="24" y1="4" x2="24" y2="30" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#ffffff" />
                          <stop offset="1" stopColor="#6366f1" />
                        </linearGradient>
                      </defs>
                    </svg>
                  );
                },
                title: "Ready Documents",
                desc: "Professional contract and invoice generated, signed, and exported as PDF.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="feature-card-glow p-8 group relative"
              >
                <div className="relative z-10 w-full h-full">
                  <div className="w-16 h-16 rounded-2xl bg-accent/5 border border-accent/10 flex items-center justify-center mb-6 shadow-inner group-hover:scale-105 transition-transform duration-500">
                    <feature.Graphic />
                  </div>
                  <h3 className="text-lg font-medium text-white tracking-[-0.02em] mb-3">{feature.title}</h3>
                  <p className="text-[15px] text-white/60 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="px-6 py-10 mt-auto relative z-10">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/10">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <span className="text-[13px] text-white/50 font-medium tracking-wide">
                © {new Date().getFullYear()} Forge
              </span>
            </div>
            <p className="text-[13px] text-white/40 font-medium tracking-wide flex items-center gap-4">
              <span>
                Built with{" "}
                <a
                  href="https://lamatic.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-accent transition-colors"
                >
                  Lamatic.ai
                </a>
              </span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span>
                Part of{" "}
                <a
                  href="https://github.com/Lamatic/AgentKit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-accent transition-colors"
                >
                  AgentKit
                </a>
              </span>
            </p>
          </div>
        </footer>
      </main>
    </AuroraBackground>
  );
}
