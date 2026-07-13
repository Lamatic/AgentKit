"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const DAYS = [
  { id: "mon", label: "M" },
  { id: "tue", label: "T" },
  { id: "wed", label: "W" },
  { id: "thu", label: "T" },
  { id: "fri", label: "F" },
  { id: "sat", label: "S" },
  { id: "sun", label: "S" },
];

export function DaySelector() {
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const toggleDay = (id: string) => {
    setSelectedDays((prev) =>
      prev.includes(id) ? prev.filter((day) => day !== id) : [...prev, id]
    );
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold text-white tracking-wide">Days</h3>
        
        {/* Repeat Toggle (Static for now to match UI) */}
        <button className="flex items-center gap-2 opacity-50 cursor-not-allowed">
          <span className="text-lg font-bold text-white tracking-wide">Repeat</span>
          <div className="w-6 h-6 rounded-md border-2 border-white/20 flex items-center justify-center">
            {/* Checkmark icon would go here when active */}
          </div>
        </button>
      </div>

      <div className="flex justify-between items-center w-full">
        {DAYS.map((day) => {
          const isSelected = selectedDays.includes(day.id);
          return (
            <button
              key={day.id}
              onClick={() => toggleDay(day.id)}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold text-[15px] transition-colors",
                isSelected 
                  ? "bg-[#e83a3a] text-white" 
                  : "bg-[#151515] text-[#94a3b8] hover:text-white border border-white/5"
              )}
            >
              {day.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
