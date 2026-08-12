import type { SqlPreset } from "@/lib/presets";
import PresetButtons from "./PresetButtons";
import RunPipelineButton from "./RunPipelineButton";
import SqlEditor from "./SqlEditor";

type MigrationInputProps = {
  isPresetPending: boolean;
  isStarting: boolean;
  onPresetSelect: (presetId: string) => void;
  onRun: () => void;
  onSqlChange: (value: string) => void;
  presets: SqlPreset[];
  selectedPresetId: string | null;
  sql: string;
  validationMessage: string | null;
};

export default function MigrationInput({
  isPresetPending,
  isStarting,
  onPresetSelect,
  onRun,
  onSqlChange,
  presets,
  selectedPresetId,
  sql,
  validationMessage,
}: MigrationInputProps) {
  return (
    <section className="panel-strong mt-8 overflow-hidden rounded-[22px] border border-slate-200/90 px-5 py-5 sm:px-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-[1.15rem] font-bold tracking-[-0.03em] text-slate-950">
            Migration Input
          </h2>
          <p className="max-w-3xl text-sm text-slate-500">
            Review and analyze a PostgreSQL DDL migration before production
            release.
          </p>
        </div>

        <SqlEditor
          onChange={onSqlChange}
          placeholder={`ALTER TABLE users
ADD COLUMN last_seen TIMESTAMP;`}
          value={sql}
        />

        <PresetButtons
          isPending={isPresetPending}
          onSelect={onPresetSelect}
          presets={presets}
          selectedPresetId={selectedPresetId}
        />

        <RunPipelineButton
          isLoading={isStarting}
          onClick={onRun}
          validationMessage={validationMessage}
        />
      </div>
    </section>
  );
}
