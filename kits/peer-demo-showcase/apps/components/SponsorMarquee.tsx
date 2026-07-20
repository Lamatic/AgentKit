'use client';

import { Cloud, Zap, Triangle, Layers, Database, Sparkles, CreditCard } from 'lucide-react';

interface SponsorBrand {
  name: string;
  icon: React.ReactNode;
  color: string;
}

export default function SponsorMarquee() {
  const sponsors: SponsorBrand[] = [
    { name: 'Google Cloud', icon: <Cloud className="w-4 h-4" />, color: 'group-hover:text-blue-400' },
    { name: 'Vercel', icon: <Triangle className="w-4 h-4 fill-current" />, color: 'group-hover:text-white' },
    { name: 'Supabase', icon: <Zap className="w-4 h-4 fill-current" />, color: 'group-hover:text-emerald-400' },
    { name: 'Stitch', icon: <Layers className="w-4 h-4" />, color: 'group-hover:text-purple-400' },
    { name: 'MongoDB', icon: <Database className="w-4 h-4" />, color: 'group-hover:text-green-500' },
    { name: 'Stripe', icon: <CreditCard className="w-4 h-4" />, color: 'group-hover:text-indigo-400' },
    { name: 'Neon', icon: <Zap className="w-4 h-4" />, color: 'group-hover:text-lime-400' },
    { name: 'Lamatic.ai', icon: <Sparkles className="w-4 h-4" />, color: 'group-hover:text-cyan-400' },
  ];

  // Repeat twice for infinite loop
  const duplicatedSponsors = [...sponsors, ...sponsors];

  return (
    <div className="mt-20 border-t border-white/5 pt-10 pb-6 w-full overflow-hidden relative">
      {/* Title */}
      <h3 className="text-center text-[10px] text-gray-500 tracking-[0.2em] font-mono font-bold uppercase mb-8 select-none">
        POWERED BY LEADING TECH PLATFORMS
      </h3>

      {/* Marquee Track Wrapper with fade masks */}
      <div className="w-full overflow-hidden mask-marquee">
        <div className="animate-marquee flex gap-6 py-2">
          {duplicatedSponsors.map((sponsor, idx) => (
            <div
              key={idx}
              className="group flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-300 font-semibold tracking-wide select-none min-w-[170px] cursor-pointer shadow-sm hover:shadow-lg"
            >
              <span className={`transition-colors duration-300 ${sponsor.color}`}>
                {sponsor.icon}
              </span>
              <span className="text-sm font-sans tracking-tight">
                {sponsor.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
