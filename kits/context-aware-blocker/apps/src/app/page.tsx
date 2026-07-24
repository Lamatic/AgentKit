"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UpcomingBlocksCard } from "@/components/ui/UpcomingBlocksCard";
import { CommitCard } from "@/components/features/CommitCard";
import { CommitSettingsModal } from "@/components/features/CommitSettingsModal";
import { useCommitStore } from "@/hooks/useCommitStore";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Lock } from "lucide-react";

// ** PRODUCTION LEVEL: Zod schema for lock settings form validation ** //
const lockFormSchema = z.object({
  lockDate: z.string().min(1, "Date is required").regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  lockTime: z.string().min(1, "Time is required").regex(/^\d{2}:\d{2}$/, "Invalid time format"),
}).refine((data) => {
  const timestamp = new Date(`${data.lockDate}T${data.lockTime}`).getTime();
  return isFinite(timestamp) && timestamp > Date.now();
}, {
  message: "Please select a valid future date and time.",
  path: ["lockDate"],
});

type LockFormData = z.infer<typeof lockFormSchema>;

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

  // ** PRODUCTION LEVEL: react-hook-form + Zod for lock settings ** //
  const lockForm = useForm<LockFormData>({
    resolver: zodResolver(lockFormSchema),
    defaultValues: { lockDate: "", lockTime: "" },
  });

  useEffect(() => {
    if (isLockModalOpen) {
      const saved = localStorage.getItem("lama_lock_settings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.date) lockForm.setValue("lockDate", parsed.date);
          if (parsed.time) lockForm.setValue("lockTime", parsed.time);
        } catch (e) {}
      }
    }
  }, [isLockModalOpen, lockForm]);

  /**
   * Persists the strict lock settings to local storage.
   * 
   * Validates via Zod schema that the lock time is a valid future datetime,
   * and enforces the "can only extend" constraint against any existing lock.
   * Also persists `lockSetAt` for OS clock bypass defense (Step 4).
   * 
   * @param {LockFormData} data - The validated form data.
   * @returns {void}
   */
  const saveLockSettings = (data: LockFormData) => {
    const newTimestamp = new Date(`${data.lockDate}T${data.lockTime}`).getTime();

    const saved = localStorage.getItem("lama_lock_settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.date && parsed.time) {
          const oldTimestamp = new Date(`${parsed.date}T${parsed.time}`).getTime();
          if (newTimestamp <= oldTimestamp) {
            lockForm.setError("lockDate", {
              message: "Strict mode active: You can only extend the lock time.",
            });
            return;
          }
        }
      } catch (e) {}
    }

    localStorage.setItem("lama_lock_settings", JSON.stringify({
      date: data.lockDate,
      time: data.lockTime,
      lockSetAt: Date.now(),
    }));
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
    return <div className="min-h-screen bg-bg-primary flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent-red border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="min-h-screen bg-bg-primary font-sans text-text-primary p-8 relative">
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
          <button 
            className="text-gray-400 cursor-pointer hover:text-white transition-colors bg-transparent border-none p-0"
            onClick={() => setIsLockModalOpen(true)}
            aria-label="Open Lock Settings"
          >
            <Lock className="w-5 h-5" />
          </button>
        </div>

        {/* Top Card */}
        <UpcomingBlocksCard />

        {/* Blocks Section Header */}
        <div className="flex justify-between items-center mb-6 px-1">
          <h2 className="text-2xl font-bold tracking-wide">Blocks</h2>
          <button 
            onClick={handleAddCommit}
            className="bg-bg-surface text-text-primary px-5 py-2 rounded-full font-medium text-lg hover:bg-bg-surface-hover transition-colors shadow-sm"
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
            <p className="text-text-muted text-center py-6">No blocks added yet.</p>
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
        onConfirm={lockForm.handleSubmit(saveLockSettings)}
        onCancel={() => setIsLockModalOpen(false)}
      >
        <div className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-muted">Select Date</label>
            <Controller
              name="lockDate"
              control={lockForm.control}
              render={({ field }) => (
                <input 
                  type="date" 
                  {...field}
                  className="bg-bg-input text-text-primary p-3 rounded-xl border border-transparent outline-none focus:border-border-focus transition-colors"
                />
              )}
            />
            {lockForm.formState.errors.lockDate && (
              <p className="text-accent-red text-xs mt-1">{lockForm.formState.errors.lockDate.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-muted">Select Time</label>
            <Controller
              name="lockTime"
              control={lockForm.control}
              render={({ field }) => {
                const timeValue = field.value || "12:00";
                const [hourStr, minStr] = timeValue.split(":");
                const hour24 = parseInt(hourStr || "12");
                const displayHour = (hour24 % 12 || 12).toString().padStart(2, "0");
                const displayMin = minStr || "00";
                const displayAmpm = hour24 >= 12 ? "PM" : "AM";

                const updateTime = (newHour24: number, newMin: string) => {
                  field.onChange(`${newHour24.toString().padStart(2, "0")}:${newMin}`);
                };

                return (
                  <div className="flex gap-2">
                    <select
                      value={displayHour}
                      onChange={(e) => {
                        let newHour = parseInt(e.target.value);
                        if (displayAmpm === "PM" && newHour < 12) newHour += 12;
                        if (displayAmpm === "AM" && newHour === 12) newHour = 0;
                        updateTime(newHour, displayMin);
                      }}
                      className="bg-bg-input text-text-primary p-3 rounded-xl border border-transparent outline-none focus:border-border-focus transition-colors w-full appearance-none"
                    >
                      {Array.from({length: 12}, (_, i) => {
                        const hr = (i === 0 ? 12 : i).toString().padStart(2, "0");
                        return <option key={hr} value={hr}>{hr}</option>
                      })}
                    </select>
                    <span className="flex items-center text-gray-400 font-bold">:</span>
                    <select
                      value={displayMin}
                      onChange={(e) => updateTime(hour24, e.target.value)}
                      className="bg-bg-input text-text-primary p-3 rounded-xl border border-transparent outline-none focus:border-border-focus transition-colors w-full appearance-none"
                    >
                      {Array.from({length: 60}, (_, i) => {
                        const min = i.toString().padStart(2, "0");
                        return <option key={min} value={min}>{min}</option>
                      })}
                    </select>
                    <select
                      value={displayAmpm}
                      onChange={(e) => {
                        let h = hour24;
                        if (e.target.value === "PM" && h < 12) h += 12;
                        if (e.target.value === "AM" && h >= 12) h -= 12;
                        updateTime(h, displayMin);
                      }}
                      className="bg-bg-input text-text-primary p-3 rounded-xl border border-transparent outline-none focus:border-border-focus transition-colors w-full appearance-none"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                );
              }}
            />
            {lockForm.formState.errors.lockTime && (
              <p className="text-accent-red text-xs mt-1">{lockForm.formState.errors.lockTime.message}</p>
            )}
          </div>
        </div>
      </ConfirmationModal>
    </div>
  );
}
