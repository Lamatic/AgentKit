// components/InputForm.tsx
"use client";

import { motion } from "framer-motion";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { AnalyzeFormData, InputType, LanguageOption } from "@/types/response";

const INPUT_TYPES: InputType[] = ["Email", "SMS", "URL", "Document", "Text"];
const LANGUAGES: LanguageOption[] = ["Auto", "English", "Hindi", "Bengali"];

interface InputFormProps {
  formData: AnalyzeFormData;
  onChange: (data: AnalyzeFormData) => void;
  onSubmit: () => void;
  loading: boolean;
}

const selectClass =
  "w-full rounded-xl bg-white/[0.05] border border-white/[0.08] px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed appearance-none cursor-pointer";

const inputClass =
  "w-full rounded-xl bg-white/[0.05] border border-white/[0.08] px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed";

const labelClass = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5";

export default function InputForm({ formData, onChange, onSubmit, loading }: InputFormProps) {
  const set = <K extends keyof AnalyzeFormData>(key: K, value: AnalyzeFormData[K]) =>
    onChange({ ...formData, [key]: value });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loading) onSubmit();
  };

  return (
    <motion.div
      className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-6 shadow-2xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </span>
        Investigation Input
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Input Type + Language */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Input Type */}
          <div>
            <label className={labelClass} htmlFor="input-type">
              Input Type
            </label>
            <div className="relative">
              <select
                id="input-type"
                value={formData.input_type}
                onChange={(e) => set("input_type", e.target.value as InputType)}
                disabled={loading}
                className={selectClass}
              >
                {INPUT_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-slate-900">
                    {t}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Language */}
          <div>
            <label className={labelClass} htmlFor="language">
              Language
            </label>
            <div className="relative">
              <select
                id="language"
                value={formData.language}
                onChange={(e) => set("language", e.target.value as LanguageOption)}
                disabled={loading}
                className={selectClass}
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l} className="bg-slate-900">
                    {l}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
          <label className={labelClass} htmlFor="content">
            Content <span className="text-red-400">*</span>
          </label>
          <textarea
            id="content"
            rows={5}
            placeholder="Paste the suspicious email, SMS, URL, or text content here…"
            value={formData.content}
            onChange={(e) => set("content", e.target.value)}
            disabled={loading}
            required
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Attachment URL */}
        <div>
          <label className={labelClass} htmlFor="attachment-url">
            Attachment URL{" "}
            <span className="normal-case text-slate-600 font-normal">(optional)</span>
          </label>
          <input
            id="attachment-url"
            type="url"
            placeholder="https://example.com/file.pdf"
            value={formData.attachment_url}
            onChange={(e) => set("attachment_url", e.target.value)}
            disabled={loading}
            className={inputClass}
          />
        </div>


        {/* Submit */}
        <motion.button
          type="submit"
          disabled={loading || !formData.content.trim()}
          whileHover={{ scale: loading ? 1 : 1.01 }}
          whileTap={{ scale: loading ? 1 : 0.99 }}
          className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {loading ? (
            <>
              <LoadingSpinner size={16} className="text-white" />
              <span>Analyzing…</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Run Investigation</span>
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}
