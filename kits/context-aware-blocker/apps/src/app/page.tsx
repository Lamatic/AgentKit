"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { UpcomingBlocksCard } from "@/components/ui/UpcomingBlocksCard";
import { CommitCard } from "@/components/features/CommitCard";
import { CommitSettingsModal } from "@/components/features/CommitSettingsModal";
import { useCommitStore } from "@/hooks/useCommitStore";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

/**
 * The main dashboard page for the Context-Aware Blocker.
 * 
 * This component acts as the primary controller for the Next.js UI, hydrating 
 * global state from the Zustand store and managing the highest-level modals 
 * (Commit Settings, Delete Confirmations, and Strict Lock Settings).
 * 
 * @returns {JSX.Element} The rendered dashboard.
 */
export default function Home() {
  // ** PRODUCTION LEVEL STATE BINDING: Connect to Zustand global store ** //
  const { commits, loadCommits, isLoaded, deleteCommit, addCommit } = useCommitStore();

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

  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [lockDate, setLockDate] = useState("");
  const [lockTime, setLockTime] = useState("");

  useEffect(() => {
    if (isLockModalOpen) {
      const saved = localStorage.getItem("lama_lock_settings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.date) setLockDate(parsed.date);
          if (parsed.time) setLockTime(parsed.time);
        } catch (e) {}
      }
    }
  }, [isLockModalOpen]);

  /**
   * Persists the strict lock settings to local storage.
   * 
   * Validates that the requested lock time does not attempt to reduce a currently 
   * active lock. Once saved, it triggers an implicit sync to the background script.
   * 
   * @returns {void}
   */
  const saveLockSettings = () => {
    if (!lockDate || !lockTime) {
      alert("Please select both a date and a time.");
      return;
    }

    const newTimestamp = new Date(`${lockDate}T${lockTime}`).getTime();

    const saved = localStorage.getItem("lama_lock_settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.date && parsed.time) {
          const oldTimestamp = new Date(`${parsed.date}T${parsed.time}`).getTime();
          if (newTimestamp <= oldTimestamp) {
            alert("Strict mode active: You can only extend the lock time. You cannot reduce it.");
            return; // Block save
          }
        }
      } catch (e) {}
    }

    localStorage.setItem("lama_lock_settings", JSON.stringify({ date: lockDate, time: lockTime }));
    setIsLockModalOpen(false);
  };

  // ** PRODUCTION LEVEL HYDRATION: Fetch tiny DB config on client mount ** //
  useEffect(() => {
    loadCommits();
  }, [loadCommits]);

  /**
   * Opens the overarching Commit Settings modal to a specific pane.
   * 
   * @param {"time" | "block"} pane - The initial configuration view to render.
   * @param {string} commitId - The unique identifier of the block to edit.
   */
  const openModal = (pane: "time" | "block", commitId: string) => {
    setModalConfig({ isOpen: true, initialPane: pane, commitId });
  };

  /**
   * Closes the Commit Settings modal and clears the active commit context.
   */
  const closeModal = () => {
    setModalConfig((prev) => ({ ...prev, isOpen: false, commitId: null }));
  };

  /**
   * Stages a commit for deletion, opening the confirmation prompt.
   * 
   * @param {string} commitId - The unique identifier of the block.
   * @param {string} title - The display name of the block (for UI feedback).
   */
  const openDeleteModal = (commitId: string, title: string) => {
    setDeleteConfig({ isOpen: true, commitId, title });
  };

  /**
   * Executes the deletion of the staged commit after user confirmation.
   * 
   * Validates against the strict lock constraint dynamically to prevent bypassing.
   * 
   * @returns {Promise<void>}
   */
  const confirmDelete = async () => {
    import("@/lib/utils").then(({ isStrictLockActive }) => {
      if (isStrictLockActive()) {
        alert("Strict mode active: You cannot delete blocks right now!");
        setDeleteConfig({ isOpen: false, commitId: null, title: "" });
        return;
      }
      if (deleteConfig.commitId) {
        deleteCommit(deleteConfig.commitId);
      }
      setDeleteConfig({ isOpen: false, commitId: null, title: "" });
    });
  };

  /**
   * Initializes a new block commit flow.
   * 
   * Generates a unique ID and immediately drops the user into the 'time' editing pane
   * to reduce friction in the creation workflow.
   */
  const handleAddCommit = () => {
    const newId = `commit-${Date.now()}`;
    // UX Polish: Automatically open the modal for the new block so they can edit it immediately!
    openModal("time", newId);
  };

  if (!isLoaded) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#e83a3a] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans text-[#f8fafc] p-8 relative">
      <div className="max-w-md mx-auto pt-6 pb-20">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 px-1">
          <div className="flex items-center gap-3">
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
          <span 
            className="material-symbols-outlined text-gray-400 text-[20px] cursor-pointer hover:text-white transition-colors"
            onClick={() => setIsLockModalOpen(true)}
          >
            lock
          </span>
        </div>

        {/* Top Card */}
        <UpcomingBlocksCard />

        {/* Blocks Section Header */}
        <div className="flex justify-between items-center mb-6 px-1">
          <h2 className="text-2xl font-bold tracking-wide">Blocks</h2>
          <button 
            onClick={handleAddCommit}
            className="bg-[#151515] text-[#f8fafc] px-5 py-2 rounded-full font-medium text-lg hover:bg-[#1f1f1f] transition-colors shadow-sm"
          >
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
              onClick={() => openModal("time", commit.id)}
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

      {/* Lock Settings Modal Overlay */}
      <ConfirmationModal
        isOpen={isLockModalOpen}
        title="Lock Settings"
        confirmText="Save"
        cancelText="Close"
        confirmColor="#e83a3a"
        cancelColor="#94a3b8"
        onConfirm={saveLockSettings}
        onCancel={() => setIsLockModalOpen(false)}
      >
        <div className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#94a3b8]">Select Date</label>
            <input 
              type="date" 
              value={lockDate} 
              onChange={(e) => setLockDate(e.target.value)}
              className="bg-[#1a1a1a] text-[#f8fafc] p-3 rounded-xl border border-transparent outline-none focus:border-[#404040] transition-colors"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#94a3b8]">Select Time</label>
            <div className="flex gap-2">
              <select 
                value={lockTime.split(':')[0] ? (parseInt(lockTime.split(':')[0]) % 12 || 12).toString().padStart(2, '0') : "12"}
                onChange={(e) => {
                  const currentMins = lockTime.split(':')[1] || "00";
                  const currentAmpm = (parseInt(lockTime.split(':')[0] || "12") >= 12) ? "PM" : "AM";
                  let newHour = parseInt(e.target.value);
                  if (currentAmpm === "PM" && newHour < 12) newHour += 12;
                  if (currentAmpm === "AM" && newHour === 12) newHour = 0;
                  setLockTime(`${newHour.toString().padStart(2, '0')}:${currentMins}`);
                }}
                className="bg-[#1a1a1a] text-[#f8fafc] p-3 rounded-xl border border-transparent outline-none focus:border-[#404040] transition-colors w-full appearance-none"
              >
                {Array.from({length: 12}, (_, i) => {
                  const hr = (i === 0 ? 12 : i).toString().padStart(2, '0');
                  return <option key={hr} value={hr}>{hr}</option>
                })}
              </select>
              <span className="flex items-center text-gray-400 font-bold">:</span>
              <select 
                value={lockTime.split(':')[1] || "00"}
                onChange={(e) => {
                  const currentHour = lockTime.split(':')[0] || "12";
                  setLockTime(`${currentHour}:${e.target.value}`);
                }}
                className="bg-[#1a1a1a] text-[#f8fafc] p-3 rounded-xl border border-transparent outline-none focus:border-[#404040] transition-colors w-full appearance-none"
              >
                {Array.from({length: 60}, (_, i) => {
                  const min = i.toString().padStart(2, '0');
                  return <option key={min} value={min}>{min}</option>
                })}
              </select>
              <select 
                value={(parseInt(lockTime.split(':')[0] || "12") >= 12) ? "PM" : "AM"}
                onChange={(e) => {
                  const currentMins = lockTime.split(':')[1] || "00";
                  let currentHour = parseInt(lockTime.split(':')[0] || "12");
                  if (e.target.value === "PM" && currentHour < 12) currentHour += 12;
                  if (e.target.value === "AM" && currentHour >= 12) currentHour -= 12;
                  setLockTime(`${currentHour.toString().padStart(2, '0')}:${currentMins}`);
                }}
                className="bg-[#1a1a1a] text-[#f8fafc] p-3 rounded-xl border border-transparent outline-none focus:border-[#404040] transition-colors w-full appearance-none"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>
        </div>
      </ConfirmationModal>
    </div>
  );
}
