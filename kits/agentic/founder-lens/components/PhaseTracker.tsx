"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/Icons";

const PHASES = [
  { name: "Deconstructing idea", description: "Generating targeted search queries..." },
  { name: "Market research", description: "Searching TAM/SAM/SOM data..." },
  { name: "VC & funding signals", description: "Scanning Crunchbase trends..." },
  { name: "Competitor intelligence", description: "Mapping direct competitors..." },
  { name: "Dead startup postmortems", description: "Finding what already failed..." },
  { name: "Customer voices", description: "Scraping Reddit & G2..." },
  { name: "Success DNA", description: "Reading IndieHackers..." },
  { name: "Contrarian take", description: "Finding the fatal flaw..." },
  { name: "Synthesizing brief", description: "Generating Founder Brief..." },
];

export function PhaseTracker() {
  const [currentPhase, setCurrentPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhase((prev) => {
        if (prev < PHASES.length - 1) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const progress = Math.round(((currentPhase + 1) / PHASES.length) * 100);

  return (
    <div className="w-full">
      {/* Sleek Neon Progress Line */}
      <div className="mb-8">
        <div className="flex justify-between text-xs font-semibold tracking-widest uppercase text-white/50 mb-3">
          <span>Analysis Progress</span>
          <span className="text-white">{progress}%</span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden relative">
          <div
            className="absolute top-0 bottom-0 left-0 bg-white rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_#fff]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-1">
        {PHASES.map((phase, index) => {
          const isDone = index < currentPhase;
          const isActive = index === currentPhase;

          return (
            <div 
              key={index} 
              className={cn(
                "flex items-center gap-4 px-3 py-2 rounded-lg transition-all duration-500",
                isActive ? "bg-white/5" : ""
              )}
            >
              {/* Point Indicator */}
              <div className="flex-shrink-0 w-6 flex justify-center">
                {isDone ? (
                  <Icons.Check className="w-4 h-4 text-white/50" />
                ) : isActive ? (
                  <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#fff] animate-pulse" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                )}
              </div>

              {/* Phase Info text */}
              <div className="flex-1 flex justify-between items-center min-w-0">
                <p
                  className={cn(
                    "text-sm tracking-tight transition-colors duration-300",
                    isDone ? "text-white/40 font-medium" : isActive ? "text-white font-semibold" : "text-white/20 font-medium"
                  )}
                >
                  {phase.name}
                </p>
                {isActive && (
                  <p className="text-xs font-medium text-white/50 animate-pulse truncate ml-4 max-w-[150px] hidden sm:block">
                    {phase.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
