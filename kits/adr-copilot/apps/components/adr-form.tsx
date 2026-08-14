"use client";

import React from "react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles, FileText, Settings2, Loader2, ArrowRight } from "lucide-react";
import { PresetPicker, PRESETS, Preset } from "./preset-picker";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

const adrSchema = z.object({
  instructions: z.string().trim().min(5, "Please provide at least 5 characters describing the architectural decision."),
  constraints: z.string().optional(),
});

type ADRFormValues = z.infer<typeof adrSchema>;

interface ADRFormProps {
  onSubmit: (instructions: string, constraints: string) => Promise<void>;
  isLoading: boolean;
}

export function ADRForm({ onSubmit, isLoading }: ADRFormProps) {
  const form = useForm<ADRFormValues>({
    resolver: zodResolver(adrSchema),
    defaultValues: {
      instructions: PRESETS[0].instructions,
      constraints: PRESETS[0].constraints,
    },
    mode: "onTouched",
  });

  const { control, handleSubmit, setValue, formState: { errors, isValid } } = form;

  const handlePresetSelect = (preset: Preset) => {
    setValue("instructions", preset.instructions, { shouldValidate: true, shouldDirty: true });
    setValue("constraints", preset.constraints, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmitHandler = (data: ADRFormValues) => {
    onSubmit(data.instructions, data.constraints || "");
  };

  return (
    <div className="bg-semantic-card border border-semantic-border rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-5">
      <PresetPicker onSelect={handlePresetSelect} />

      <hr className="border-semantic-border" />

      <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="instructions" className="text-xs font-semibold text-semantic-subtle uppercase tracking-wider flex items-center gap-2">
            <FileText className="h-4 w-4 text-semantic-accent-fg" />
            <span>Technical Proposal / Design Notes</span>
            <span className="text-semantic-danger-fg">*</span>
          </Label>
          <Controller
            control={control}
            name="instructions"
            render={({ field }) => (
              <Textarea
                {...field}
                id="instructions"
                rows={8}
                placeholder="Describe the architectural decision, options being evaluated, current infrastructure, and technical context..."
                className={`w-full bg-semantic-bg border rounded-xl px-4 py-3 text-sm text-semantic-body placeholder-semantic-subtle focus:outline-none focus:ring-2 transition-all font-mono resize-y ${
                  errors.instructions
                    ? "border-semantic-danger-fg focus:ring-semantic-danger-fg/50"
                    : "border-semantic-border focus:ring-semantic-accent-fg/50 focus:border-semantic-accent-fg"
                }`}
              />
            )}
          />
          {errors.instructions && (
            <p className="text-xs text-semantic-danger-fg">{errors.instructions.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="constraints" className="text-xs font-semibold text-semantic-subtle uppercase tracking-wider flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-semantic-gradient-3" />
            <span>Operational Constraints & Decision Drivers (Optional)</span>
          </Label>
          <Controller
            control={control}
            name="constraints"
            render={({ field }) => (
              <Textarea
                {...field}
                id="constraints"
                rows={3}
                placeholder="e.g., Sub-50ms latency budget, team size 4, $500/mo cloud ceiling, SOC2 compliance"
                className="w-full bg-semantic-bg border border-semantic-border rounded-xl px-4 py-3 text-sm text-semantic-body placeholder-semantic-subtle focus:outline-none focus:ring-2 focus:ring-semantic-gradient-3/50 focus:border-semantic-gradient-3 transition-all font-mono resize-y"
              />
            )}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !isValid}
          className="w-full py-3 px-5 bg-linear-to-r from-semantic-gradient-1 via-semantic-gradient-2 to-semantic-gradient-3 hover:opacity-90 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all duration-200"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              <span>Analyzing Architecture & Generating MADR 3.0...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-white" />
              <span>Generate Architecture Decision Record</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
