"use client";

import { useRef } from "react";

export default function SpecInput({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange(await file.text());
    // Reset so picking the same file twice still fires a change event.
    e.target.value = "";
  }

  const lineCount = value ? value.split("\n").length : 0;
  const fieldId = `spec-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-xl border border-edge bg-panel">
      <div className="flex items-center justify-between gap-3 border-b border-edge px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">
            <label htmlFor={fieldId}>{label}</label>
          </h2>
          <p id={`${fieldId}-hint`} className="truncate text-xs text-muted">
            {hint}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {value ? (
            <span className="text-xs text-muted">{lineCount} lines</span>
          ) : null}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={disabled}
            className="rounded-md border border-edge bg-panel-2 px-2.5 py-1.5 text-xs font-medium text-ink transition hover:border-slate-500 disabled:opacity-50"
          >
            Upload
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".yaml,.yml,.json,application/json,text/yaml"
            onChange={onFile}
            className="hidden"
          />
        </div>
      </div>
      <textarea
        id={fieldId}
        aria-describedby={`${fieldId}-hint`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        spellCheck={false}
        placeholder="Paste an OpenAPI 3.x document (YAML or JSON), or upload a file."
        className="h-72 w-full resize-y bg-transparent p-4 text-xs leading-relaxed text-ink outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset placeholder:text-muted disabled:opacity-60"
      />
    </div>
  );
}
