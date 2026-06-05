"use client";

import { Check } from "lucide-react";

const STEPS = [
  { number: 1, label: "Project Details" },
  { number: 2, label: "Pricing" },
  { number: 3, label: "Governing Law" },
  { number: 4, label: "Generate" },
];

interface StepIndicatorProps {
  currentStep: number;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full max-w-wizard mx-auto mb-10">
      <div className="flex items-center justify-between">
        {STEPS.map((step, idx) => {
          const isCompleted = currentStep > step.number;
          const isActive = currentStep === step.number;
          const isLast = idx === STEPS.length - 1;

          return (
            <div key={step.number} className="flex items-center flex-1 last:flex-none">
              {/* Step circle + label */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                    transition-all duration-500
                    ${isCompleted
                      ? "bg-accent/20 border border-accent/50 text-accent shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                      : isActive
                        ? "liquid-glass-pill shadow-[0_0_20px_rgba(255,255,255,0.15)] border-white/30"
                        : "bg-white/5 border border-white/5 text-white/30"
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : isActive ? (
                    <span className="text-gradient-animate font-bold">{step.number}</span>
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={`
                    mt-3 text-[11px] uppercase tracking-widest font-semibold whitespace-nowrap transition-colors duration-500
                    ${isActive ? "text-gradient-animate" : isCompleted ? "text-white/80" : "text-white/30"}
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className="flex-1 mx-4 mt-[-24px] relative">
                  <div
                    className={`
                      h-[2px] w-full transition-all duration-1000 ease-in-out
                      ${isCompleted ? "bg-accent shadow-[0_0_10px_rgba(99,102,241,0.5)]" : "bg-white/10"}
                    `}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
