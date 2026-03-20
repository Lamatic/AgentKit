"use client";

interface ResumeInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ResumeInput({ value, onChange, disabled }: ResumeInputProps) {
  return (
    <div className="resume-input">
      <label htmlFor="resume">
        Resume
        <span className="label-hint">Plain text only — no PDF</span>
      </label>
      <textarea
        id="resume"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Paste your resume here as plain text...&#10;&#10;Include: objective, experience, skills, education."
        rows={12}
        spellCheck={false}
      />
      <div className="char-count">{value.length} characters</div>
    </div>
  );
}
