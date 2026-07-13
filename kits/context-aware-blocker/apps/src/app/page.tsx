"use client";

import Image from "next/image";
import { useState } from "react";
import { UpcomingBlocksCard } from "@/components/ui/UpcomingBlocksCard";
import { CommitCard } from "@/components/features/CommitCard";
import { CommitSettingsModal } from "@/components/features/CommitSettingsModal";

export default function Home() {
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; initialPane: "time" | "block" }>({
    isOpen: false,
    initialPane: "time",
  });

  const openModal = (pane: "time" | "block") => {
    setModalConfig({ isOpen: true, initialPane: pane });
  };

  const closeModal = () => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

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
            onTimeClick={() => openModal("time")}
            onBlockClick={() => openModal("block")}
          />
          <CommitCard 
            title="Deep Work" 
            iconName="target" 
            showRisk={false}
            onTimeClick={() => openModal("time")}
            onBlockClick={() => openModal("block")}
          />
        </div>

      </div>

      <CommitSettingsModal 
        isOpen={modalConfig.isOpen} 
        initialPane={modalConfig.initialPane} 
        onClose={closeModal} 
      />
    </div>
  );
}
