"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { UpcomingBlocksCard } from "@/components/ui/UpcomingBlocksCard";
import { CommitCard } from "@/components/features/CommitCard";
import { CommitSettingsModal } from "@/components/features/CommitSettingsModal";
import { useCommitStore } from "@/hooks/useCommitStore";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

export default function Home() {
  // ** PRODUCTION LEVEL STATE BINDING: Connect to Zustand global store ** //
  const { commits, loadCommits, isLoaded, deleteCommit } = useCommitStore();

  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; initialPane: "time" | "block"; commitId: string | null }>({
    isOpen: false,
    initialPane: "time",
    commitId: null
  });

  const [deleteConfig, setDeleteConfig] = useState<{ isOpen: boolean; commitId: string | null; title: string }>({
    isOpen: false,
    commitId: null,
    title: "",
  });

  // ** PRODUCTION LEVEL HYDRATION: Fetch tiny DB config on client mount ** //
  useEffect(() => {
    loadCommits();
  }, [loadCommits]);

  const openModal = (pane: "time" | "block", commitId: string) => {
    setModalConfig({ isOpen: true, initialPane: pane, commitId });
  };

  const closeModal = () => {
    setModalConfig((prev) => ({ ...prev, isOpen: false, commitId: null }));
  };

  const openDeleteModal = (commitId: string, title: string) => {
    setDeleteConfig({ isOpen: true, commitId, title });
  };

  const confirmDelete = async () => {
    if (deleteConfig.commitId) {
      await deleteCommit(deleteConfig.commitId);
    }
    setDeleteConfig({ isOpen: false, commitId: null, title: "" });
  };

  if (!isLoaded) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#e83a3a] border-t-transparent rounded-full animate-spin"></div></div>;
  }

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

        {/* ** PRODUCTION LEVEL RENDERING: Dynamically render user commitments ** */}
        <div className="flex flex-col gap-4">
          {commits.map((commit) => (
            <CommitCard 
              key={commit.id}
              title={commit.title} 
              iconName={commit.iconName} 
              showRisk={commit.showRisk} 
              onTimeClick={() => openModal("time", commit.id)}
              onBlockClick={() => openModal("block", commit.id)}
              onDeleteClick={() => openDeleteModal(commit.id, commit.title)}
            />
          ))}
          {commits.length === 0 && (
            <p className="text-[#94a3b8] text-center py-6">No blocks added yet.</p>
          )}
        </div>

      </div>

      {modalConfig.commitId && (
        <CommitSettingsModal 
          isOpen={modalConfig.isOpen} 
          initialPane={modalConfig.initialPane} 
          commitId={modalConfig.commitId}
          onClose={closeModal} 
        />
      )}

      {/* ** PRODUCTION LEVEL ACTION: Delete Confirmation Modal Overlay ** */}
      <ConfirmationModal
        isOpen={deleteConfig.isOpen}
        title="Delete Block?"
        message={`Are you sure you want to permanently delete the "${deleteConfig.title}" block? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="#e83a3a"
        cancelColor="#94a3b8"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
