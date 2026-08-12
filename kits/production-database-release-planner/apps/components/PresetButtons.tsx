import { Database } from "lucide-react";
import type { SqlPreset } from "@/lib/presets";

type PresetButtonsProps = {
  isPending: boolean;
  onSelect: (presetId: string) => void;
  presets: SqlPreset[];
  selectedPresetId: string | null;
};

const accentStyles = {
  amber:
    "border-slate-200 bg-white text-slate-800 hover:border-orange-300 hover:bg-orange-50/70",
  indigo:
    "border-slate-200 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50/70",
  rose:
    "border-slate-200 bg-white text-slate-800 hover:border-rose-300 hover:bg-rose-50/70",
  sky:
    "border-slate-200 bg-white text-slate-800 hover:border-sky-300 hover:bg-sky-50/70",
} as const;

export default function PresetButtons({
  isPending,
  onSelect,
  presets,
  selectedPresetId,
}: PresetButtonsProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-bold tracking-[-0.03em] text-slate-900">
            Preset DDL
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Load one of the existing example migrations into the editor.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
          <Database className="h-3.5 w-3.5 text-sky-600" />
          <span>Examples from `examples/input/`</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {presets.map((preset) => {
          const isSelected = preset.id === selectedPresetId;

          return (
            <button
              key={preset.id}
              className={[
                "group relative overflow-hidden rounded-xl border px-4 py-3 text-left transition duration-200",
                accentStyles[preset.accent],
                isSelected
                  ? "border-blue-300 bg-blue-50 text-blue-700 shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
                  : "shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
                isPending ? "cursor-wait" : "cursor-pointer",
              ].join(" ")}
              disabled={isPending}
              onClick={() => onSelect(preset.id)}
              type="button"
            >
              <p className="text-sm font-semibold tracking-[-0.02em]">
                {preset.title}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
