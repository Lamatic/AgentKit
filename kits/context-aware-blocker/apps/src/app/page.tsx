"use client";

import Image from "next/image";
import { useState } from "react";
import { UpcomingBlocksCard } from "@/components/ui/UpcomingBlocksCard";
import { CommitCard } from "@/components/features/CommitCard";
import { ActiveTimeModal } from "@/components/features/ActiveTimeModal";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans text-[#f8fafc] p-8 relative">
      <div className="max-w-md mx-auto pt-6 pb-20">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 px-1">
          <Image
            src="https://lamatic.ai/_next/image?url=%2Fpublic%2Flamatic-logo-dark.png&w=256&q=75"
            alt="Lamatic Logo"
            width={32}
            height={32}
            className="h-8 w-8 object-cover object-left"
            priority
          />
          <h1 className="text-2xl font-bold tracking-wide">LamaBlock</h1>
        </div>

        {/* Top Card */}
        <UpcomingBlocksCard />

        {/* Blocks Section Header */}
        <div className="flex justify-between items-center mb-6 px-1">
          <h2 className="text-2xl font-bold tracking-wide">Blocks</h2>
          <button className="bg-[#151515] text-[#f8fafc] px-5 py-2 rounded-full font-medium text-lg hover:bg-[#1f1f1f] transition-colors shadow-sm">
            + Add
          </button>
        </div>

        {/* Cards Container */}
        <div className="flex flex-col gap-4">
          <CommitCard 
            title="Summer" 
            iconName="book" 
            showRisk={true} 
            onTimeClick={() => setIsModalOpen(true)}
          />
          <CommitCard 
            title="Deep Work" 
            iconName="target" 
            showRisk={false}
            onTimeClick={() => setIsModalOpen(true)}
          />
        </div>

      </div>

      <ActiveTimeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
