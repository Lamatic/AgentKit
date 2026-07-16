"use client";

import { useState, useEffect } from "react";
import { DaySelector } from "@/components/ui/DaySelector";
import { useCommitStore } from "@/hooks/useCommitStore";
import { TimeWindow } from "@/types/store";

interface ActiveTimePaneProps {
  commitId: string;
  onSave: () => void;
  editedTitle?: string;
}

export function ActiveTimePane({ commitId, onSave, editedTitle }: ActiveTimePaneProps) {
  // ** PRODUCTION LEVEL STATE BINDING: Connect to Zustand global store ** //
  const { commits, saveCommit } = useCommitStore();
  
  // Initialize synchronously to prevent layout flash
  const commit = commits.find(c => c.id === commitId);

  const [timeWindows, setTimeWindows] = useState<TimeWindow[]>(commit?.timeWindows || []);
  // ** PRODUCTION LEVEL STATE: Sync Days State ** //
  const [activeDays, setActiveDays] = useState<string[]>(
    commit?.activeDays && commit.activeDays.length > 0 ? commit.activeDays : ["mon", "tue", "wed", "thu", "fri"]
  );

  // ** PRODUCTION LEVEL HYDRATION: Ensure state stays synced ** //
  useEffect(() => {
    const updatedCommit = commits.find(c => c.id === commitId);
    if (updatedCommit) {
      setTimeWindows(updatedCommit.timeWindows || []);
      setActiveDays(updatedCommit.activeDays && updatedCommit.activeDays.length > 0 ? updatedCommit.activeDays : ["mon", "tue", "wed", "thu", "fri"]);
    }
  }, [commitId, commits]);

  const addTimeWindow = () => {
    setTimeWindows([...timeWindows, { id: Math.random().toString(), start: "9:00 AM", end: "5:00 PM" }]);
  };

  const removeTimeWindow = (idToRemove: string) => {
    setTimeWindows(timeWindows.filter(w => w.id !== idToRemove));
  };

  const updateTimeWindow = (idToUpdate: string, field: "start" | "end", value: string) => {
    setTimeWindows(timeWindows.map(w => 
      w.id === idToUpdate ? { ...w, [field]: value } : w
    ));
  };

  const handleSave = async () => {
    // Check lock first
    const { isStrictLockActive } = await import("@/lib/utils");
    if (commit && isStrictLockActive()) { // only block updates, not new creations
      alert("Strict mode active: You cannot update blocks right now!");
      return;
    }

    // ** PRODUCTION LEVEL PERSISTENCE: Save configuration to Tiny DB ** //
    const currentCommit = commits.find(c => c.id === commitId);
    
    // Construct the commit (either update existing or create new)
    const updatedCommit = currentCommit 
      ? { ...currentCommit, timeWindows, activeDays }
      : { 
          id: commitId, 
          title: "New Block", 
          iconName: "category", 
          showRisk: false, 
          activeDays, 
          timeWindows, 
          blockedWebsites: [], 
          aiRules: [] 
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
      <div className="flex-1 overflow-y-auto pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]">
        {/* Day Selector */}
        {/* ** PRODUCTION LEVEL PROP INJECTION ** */}
        <DaySelector selectedDays={activeDays} onChange={setActiveDays} />

        {/* Divider */}
        <div className="h-[1px] bg-white/10 my-6 -mx-6"></div>

        {/* Times Section */}
        <div className="w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white tracking-wide">Times</h3>
            <button 
              onClick={addTimeWindow}
              className="bg-[#151515] text-[#f8fafc] px-4 py-1.5 rounded-full font-medium text-sm hover:bg-[#1f1f1f] transition-colors shadow-sm flex items-center gap-1 border border-white/5"
            >
              <span className="material-symbols-outlined !text-[18px]">add</span>
              Add
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {timeWindows.map((window) => (
              <div key={window.id} className="flex items-center gap-2 bg-[#151515] p-2 rounded-[16px]">
                
                {/* Start Time Picker (Manual Text) */}
                <div className="flex items-center gap-1.5 flex-1 bg-black/20 px-2.5 py-1.5 rounded-lg">
                  <span className="material-symbols-outlined !text-[16px] text-white/70">schedule</span>
                  <input 
                    type="text" 
                    placeholder="9:00 AM"
                    value={window.start}
                    onChange={(e) => updateTimeWindow(window.id, "start", e.target.value)}
                    className="bg-transparent text-white font-medium text-[15px] outline-none w-full"
                  />
                </div>
                
                <span className="text-[#94a3b8] font-medium text-sm px-0.5">to</span>
                
                {/* End Time Picker (Manual Text) */}
                <div className="flex items-center gap-1.5 flex-1 bg-black/20 px-2.5 py-1.5 rounded-lg">
                  <span className="material-symbols-outlined !text-[16px] text-white/70">schedule</span>
                  <input 
                    type="text" 
                    placeholder="5:00 PM"
                    value={window.end}
                    onChange={(e) => updateTimeWindow(window.id, "end", e.target.value)}
                    className="bg-transparent text-white font-medium text-[15px] outline-none w-full"
                  />
                </div>

                {/* Remove (Cross) Button */}
                <button 
                  onClick={() => removeTimeWindow(window.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-[#e83a3a] transition-colors shrink-0 mr-1"
                  title="Remove time slot"
                >
                  <span className="material-symbols-outlined !text-[18px]">close</span>
                </button>
              </div>
            ))}
            
            {timeWindows.length === 0 && (
              <p className="text-[#94a3b8] text-sm text-center py-4">No time windows added.</p>
            )}
          </div>
        </div>
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
