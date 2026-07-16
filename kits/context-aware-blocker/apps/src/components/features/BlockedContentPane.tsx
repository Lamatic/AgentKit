"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useCommitStore } from "@/hooks/useCommitStore";
import { WebItem } from "@/types/store";

type Tab = "webs" | "ai";

interface BlockedContentPaneProps {
  commitId: string;
  onSave: () => void;
  editedTitle?: string;
}

/**
 * Renders the content filtering configuration pane for a focus block.
 * 
 * This component manages the specific URLs and natural language AI rules 
 * that dictate what content is allowed or blocked when the commitment is active.
 * 
 * @param {BlockedContentPaneProps} props - Configuration and callbacks.
 * @param {string} props.commitId - The unique identifier of the block being edited.
 * @param {Function} props.onSave - Callback triggered upon a successful save.
 * @param {string} [props.editedTitle] - An optional pending title string to sync.
 * @returns {JSX.Element} The rendered pane.
 */
export function BlockedContentPane({ commitId, onSave, editedTitle }: BlockedContentPaneProps) {
  // ** PRODUCTION LEVEL STATE BINDING: Connect to Zustand global store ** //
  const { commits, saveCommit } = useCommitStore();
  
  // Initialize synchronously to prevent layout flash
  const commit = commits.find(c => c.id === commitId);

  const [activeTab, setActiveTab] = useState<Tab>("webs");
  
  // Webs State
  const [webs, setWebs] = useState<WebItem[]>(commit?.blockedWebsites || []);
  const [webInput, setWebInput] = useState("");

  // AI State
  const [aiRules, setAiRules] = useState<string[]>(commit?.aiRules || []);
  const [aiInput, setAiInput] = useState("");

  // ** PRODUCTION LEVEL HYDRATION: Ensure state stays synced ** //
  useEffect(() => {
    const updatedCommit = commits.find(c => c.id === commitId);
    if (updatedCommit) {
      setWebs(updatedCommit.blockedWebsites || []);
      setAiRules(updatedCommit.aiRules || []);
    }
  }, [commitId, commits]);

  /**
   * Appends a new exact URL match to the blocked websites list.
   * 
   * @param {React.FormEvent} e - The form submission event.
   */
  const handleAddWeb = (e: React.FormEvent) => {
    e.preventDefault();
    if (!webInput.trim()) return;
    setWebs([{ id: Math.random().toString(), url: webInput.trim(), selected: true }, ...webs]);
    setWebInput("");
  };

  /**
   * Appends a new natural language rule to the AI evaluator array.
   * 
   * @param {React.FormEvent} e - The form submission event.
   */
  const handleAddAi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    setAiRules([aiInput.trim(), ...aiRules]);
    setAiInput("");
  };

  /**
   * Toggles the active state of a specific web URL rule without deleting it.
   * 
   * @param {string} id - The unique identifier of the web item.
   */
  const toggleWeb = (id: string) => {
    setWebs(webs.map(w => w.id === id ? { ...w, selected: !w.selected } : w));
  };

  /**
   * Validates constraints and persists the local pane state to the global store.
   * 
   * Includes an auto-flush mechanism to capture any dangling input state that the 
   * user forgot to manually "Add" before hitting save. Also checks strict lock rules.
   * 
   * @returns {Promise<void>}
   */
  const handleSave = async () => {
    // Check lock first
    const { isStrictLockActive } = await import("@/lib/utils");
    if (commit && isStrictLockActive()) { // only block updates, not new creations
      alert("Strict mode active: You cannot update blocks right now!");
      return;
    }

    // ** PRODUCTION LEVEL PERSISTENCE: Save configuration to Tiny DB ** //
    const currentCommit = commits.find(c => c.id === commitId);
    
    // ** PRODUCTION LEVEL UX: Auto-flush pending inputs ** //
    // If the user typed a URL or AI rule but forgot to hit the '+' button, automatically include it!
    let finalWebs = [...webs];
    if (webInput.trim()) {
      finalWebs = [{ id: Math.random().toString(), url: webInput.trim(), selected: true }, ...finalWebs];
    }

    let finalAiRules = [...aiRules];
    if (aiInput.trim()) {
      finalAiRules = [aiInput.trim(), ...finalAiRules];
    }

    // Construct the commit (either update existing or create new)
    const updatedCommit = currentCommit 
      ? { ...currentCommit, blockedWebsites: finalWebs, aiRules: finalAiRules }
      : { 
          id: commitId, 
          title: "New Block", 
          iconName: "category", 
          showRisk: false, 
          activeDays: ["mon", "tue", "wed", "thu", "fri"], 
          timeWindows: [], 
          blockedWebsites: finalWebs, 
          aiRules: finalAiRules 
        };
    
    // ** PRODUCTION LEVEL MUTATION: Sync edited title if available ** //
    if (editedTitle && editedTitle.trim() !== "") {
      updatedCommit.title = editedTitle.trim();
    }

    if (currentCommit) {
      await saveCommit(updatedCommit);
    } else {
      // ** PRODUCTION LEVEL ACTION: Create completely new block on first save ** //
      await useCommitStore.getState().addCommit(updatedCommit);
    }
    
    onSave();
  };

  return (
    <div className="flex flex-col h-full p-6">
      {/* Tabs Bar */}
      <div className="flex gap-6 border-b border-white/10 mb-6 shrink-0">
        <button 
          onClick={() => setActiveTab("webs")}
          className={cn(
            "pb-3 font-bold text-lg transition-colors relative",
            activeTab === "webs" ? "text-white" : "text-[#94a3b8] hover:text-white/80"
          )}
        >
          Webs
          {activeTab === "webs" && (
            <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[#e83a3a]" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab("ai")}
          className={cn(
            "pb-3 font-bold text-lg transition-colors relative",
            activeTab === "ai" ? "text-white" : "text-[#94a3b8] hover:text-white/80"
          )}
        >
          AI
          {activeTab === "ai" && (
            <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[#e83a3a]" />
          )}
        </button>
      </div>

      {/* Tab Content (Scrollable) */}
      <div className="flex-1 overflow-y-auto pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]">
        
        {/* WEBS TAB */}
        {activeTab === "webs" && (
          <div className="flex flex-col gap-4">
            <form onSubmit={handleAddWeb} className="flex items-center gap-2 bg-[#151515] p-2 rounded-xl border border-white/5 shrink-0">
              <input 
                type="text" 
                placeholder="Add website URL" 
                value={webInput}
                onChange={(e) => setWebInput(e.target.value)}
                className="bg-transparent text-white placeholder-[#94a3b8] font-medium px-3 py-1 outline-none w-full"
              />
              <button type="submit" className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-[#e83a3a] text-white transition-colors shrink-0">
                <span className="material-symbols-outlined !text-[20px]">add</span>
              </button>
            </form>

            <div className="flex flex-col gap-2 mt-2">
              {webs.map((web) => (
                <div 
                  key={web.id}
                  className="flex items-center justify-between bg-[#151515] p-3 rounded-xl border border-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleWeb(web.id)}>
                    <span className="material-symbols-outlined text-[#94a3b8] !text-[20px]">language</span>
                    <span className="text-white font-medium">{web.url}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => toggleWeb(web.id)}
                      className={cn(
                        "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors",
                        web.selected ? "bg-[#e83a3a] border-[#e83a3a]" : "border-white/20 bg-transparent"
                      )}
                    >
                      {web.selected && <span className="material-symbols-outlined !text-[16px] text-white font-bold">check</span>}
                    </button>
                    {/* ** PRODUCTION LEVEL ACTION: Delete Web Rule ** */}
                    <button 
                      onClick={() => setWebs(webs.filter(w => w.id !== web.id))}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-[#e83a3a] transition-colors shrink-0"
                      title="Remove website"
                    >
                      <span className="material-symbols-outlined !text-[18px]">close</span>
                    </button>
                  </div>
                </div>
              ))}
              {webs.length === 0 && (
                 <p className="text-[#94a3b8] text-sm text-center py-4">No websites added.</p>
              )}
            </div>
          </div>
        )}

        {/* AI TAB */}
        {activeTab === "ai" && (
          <div className="flex flex-col gap-4 h-full">
            <form onSubmit={handleAddAi} className="flex items-center gap-2 bg-[#151515] p-2 rounded-xl border border-white/5 shrink-0">
              <input 
                type="text" 
                placeholder="Describe what to block" 
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                className="bg-transparent text-white placeholder-[#94a3b8] font-medium px-3 py-1 outline-none w-full"
              />
              <button type="submit" className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-[#e83a3a] text-white transition-colors shrink-0">
                <span className="material-symbols-outlined !text-[20px]">add</span>
              </button>
            </form>
            
            <div className="flex-1 flex flex-col items-center justify-start mt-2">
              {aiRules.map((rule, idx) => (
                <div key={idx} className="w-full bg-[#151515] p-3 rounded-xl border border-white/5 flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#94a3b8] !text-[20px]">auto_awesome</span>
                    <span className="text-white font-medium">{rule}</span>
                  </div>
                  {/* ** PRODUCTION LEVEL ACTION: Delete AI Rule ** */}
                  <button 
                    onClick={() => setAiRules(aiRules.filter((_, i) => i !== idx))}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-[#e83a3a] transition-colors shrink-0"
                    title="Remove rule"
                  >
                    <span className="material-symbols-outlined !text-[18px]">close</span>
                  </button>
                </div>
              ))}
              {aiRules.length === 0 && (
                <div className="flex flex-col items-center justify-center text-[#94a3b8] min-h-[200px]">
                  <span className="material-symbols-outlined text-4xl mb-2 text-white/10">auto_awesome</span>
                  <span className="text-sm font-medium text-center px-8">AI-generated rules will appear here</span>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Save Button */}
      <div className="pt-6 shrink-0 mt-auto border-t border-white/5 -mx-6 px-6">
        <button 
          onClick={handleSave}
          className="w-full bg-[#e83a3a] hover:bg-[#f94f4f] transition-colors text-white rounded-full px-6 py-4 shadow-lg font-bold text-[17px] flex justify-center items-center"
        >
          Save
        </button>
      </div>
    </div>
  );
}
