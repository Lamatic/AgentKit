"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import StepIndicator from "@/components/wizard/StepIndicator";
import Step1ProjectDetails from "@/components/wizard/Step1ProjectDetails";
import Step2Pricing from "@/components/wizard/Step2Pricing";
import Step3GoverningLaw from "@/components/wizard/Step3GoverningLaw";
import Step4Generate from "@/components/wizard/Step4Generate";
import { AuroraBackground } from "@/components/AuroraBackground";

export default function NewProjectPage() {
  const [currentStep, setCurrentStep] = useState(1);

  const handleStepComplete = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  return (
    <AuroraBackground>
      <main className="min-h-screen px-6 py-12 relative z-10 flex flex-col items-center">
        {/* Step Indicator Header */}
        <div className="w-full max-w-[800px] mb-8">
          <StepIndicator currentStep={currentStep} />
        </div>

        {/* Floating Glass Wizard Container */}
        <div 
          className="w-full max-w-[800px] bg-[#050508]/80 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 sm:p-12 shadow-2xl animate-fade-in"
          key={currentStep}
        >
          {currentStep === 1 && (
            <Step1ProjectDetails onComplete={handleStepComplete} />
          )}
          {currentStep === 2 && (
            <Step2Pricing onComplete={handleStepComplete} onBack={handleBack} />
          )}
          {currentStep === 3 && (
            <Step3GoverningLaw onComplete={handleStepComplete} onBack={handleBack} />
          )}
          {currentStep === 4 && (
            <Step4Generate onBack={handleBack} />
          )}
        </div>
      </main>
    </AuroraBackground>
  );
}
