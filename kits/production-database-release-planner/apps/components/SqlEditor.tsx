"use client";

import { useId, useRef } from "react";
import { FileCode2 } from "lucide-react";

type SqlEditorProps = {
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
};

export default function SqlEditor({
  onChange,
  placeholder,
  value,
}: SqlEditorProps) {
  const editorId = useId();
  const gutterRef = useRef<HTMLDivElement>(null);
  const lineCount = Math.max(12, value.split("\n").length);
  const lineNumbers = Array.from({ length: lineCount }, (_, index) => index + 1);

  return (
    <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-[var(--bg-editor)] shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_8px_24px_rgba(15,23,42,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Migration.sql
          </span>
        </div>

        <div className="code-font flex items-center gap-2 text-sm text-slate-500">
          <FileCode2 className="h-4 w-4 text-slate-400" />
          postgresql
        </div>
      </div>

      <label className="sr-only" htmlFor={editorId}>
        SQL migration editor
      </label>

      <div className="grid grid-cols-[60px_minmax(0,1fr)]">
        <div
          ref={gutterRef}
          aria-hidden="true"
          className="max-h-[430px] overflow-hidden border-r border-slate-200 bg-[var(--bg-editor-muted)]"
        >
          <pre className="code-font m-0 px-4 py-4 text-right text-[12px] leading-6 text-slate-400">
            {lineNumbers.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </pre>
        </div>

        <textarea
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          className="code-font h-[430px] w-full resize-none overflow-y-auto border-0 bg-white px-5 py-4 text-[1.02rem] leading-10 text-slate-950 outline-none placeholder:text-slate-400"
          id={editorId}
          onChange={(event) => onChange(event.target.value)}
          onScroll={(event) => {
            if (gutterRef.current) {
              gutterRef.current.scrollTop = event.currentTarget.scrollTop;
            }
          }}
          placeholder={placeholder}
          spellCheck={false}
          value={value}
          wrap="off"
        />
      </div>
    </div>
  );
}
