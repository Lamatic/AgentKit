"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Tab = "webs" | "ai";

interface WebItem {
  id: string;
  url: string;
  selected: boolean;
}

interface BlockedContentPaneProps {
  onSave: () => void;
}

export function BlockedContentPane({ onSave }: BlockedContentPaneProps) {
  const [activeTab, setActiveTab] = useState<Tab>("webs");
  
  // Webs State
  const [webs, setWebs] = useState<WebItem[]>([
    { id: "1", url: "youtube.com", selected: true },
    { id: "2", url: "twitter.com", selected: false }
  ]);
  const [webInput, setWebInput] = useState("");

  // AI State
  const [aiInput, setAiInput] = useState("");

  const handleAddWeb = (e: React.FormEvent) => {
    e.preventDefault();
    if (!webInput.trim()) return;
    setWebs([{ id: Math.random().toString(), url: webInput.trim(), selected: true }, ...webs]);
    setWebInput("");
  };

  const handleAddAi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    setAiInput("");
  };

  const toggleWeb = (id: string) => {
    setWebs(webs.map(w => w.id === id ? { ...w, selected: !w.selected } : w));
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
                <button 
                  key={web.id}
                  onClick={() => toggleWeb(web.id)} 
                  className="flex items-center justify-between bg-[#151515] p-3 rounded-xl border border-white/5 hover:bg-[#1a1a1a] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#94a3b8] !text-[20px]">language</span>
                    <span className="text-white font-medium">{web.url}</span>
                  </div>
                  <div 
                    className={cn(
                      "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors",
                      web.selected ? "bg-[#e83a3a] border-[#e83a3a]" : "border-white/20 bg-transparent"
                    )}
                  >
                    {web.selected && <span className="material-symbols-outlined !text-[16px] text-white font-bold">check</span>}
                  </div>
                </button>
              ))}
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
            
            <div className="flex-1 flex flex-col items-center justify-center text-[#94a3b8] min-h-[200px]">
              <span className="material-symbols-outlined text-4xl mb-2 text-white/10">auto_awesome</span>
              <span className="text-sm font-medium text-center px-8">AI-generated rules will appear here</span>
            </div>
          </div>
        )}

      </div>

      {/* Save Button */}
      <div className="pt-6 shrink-0 mt-auto border-t border-white/5 -mx-6 px-6">
        <button 
          onClick={onSave}
          className="w-full bg-[#e83a3a] hover:bg-[#f94f4f] transition-colors text-white rounded-full px-6 py-4 shadow-lg font-bold text-[17px] flex justify-center items-center"
        >
          Save
        </button>
      </div>
    </div>
  );
}
