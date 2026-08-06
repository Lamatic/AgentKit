"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Loader2, Mail, Copy, Check, Sparkles } from "lucide-react";
import { generateOutreach, type OutreachDraft } from "@/actions/generate";

const TONES = ["friendly", "formal", "direct", "playful"] as const;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard
          .writeText(text)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          })
          .catch(() => {
            /* clipboard unavailable or permission denied — leave state unchanged */
          });
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1 text-xs text-white/70 transition hover:bg-white/10"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function Page() {
  const [form, setForm] = useState({ name: "", company: "", website: "", tone: "friendly" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<OutreachDraft | null>(null);

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setDraft(null);
    if (!form.name || !form.company || !form.website) {
      setError("Please fill in name, company, and website.");
      return;
    }
    setLoading(true);
    const res = await generateOutreach(form);
    setLoading(false);
    if (res.success && res.data) setDraft(res.data);
    else setError(res.error ?? "Something went wrong.");
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-14">
      <div className="mb-10 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-teal-400 to-violet-500 text-black">
          <Mail size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Lead Outreach Agent</h1>
          <p className="text-sm text-white/50">
            A researched cold email + follow-up from just a name, company, and website.
          </p>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:grid-cols-2"
      >
        <label className="grid gap-1.5 text-sm">
          <span className="text-white/60">Lead name</span>
          <input value={form.name} onChange={set("name")} placeholder="Jane Doe"
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 outline-none focus:border-teal-400/60" />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="text-white/60">Company</span>
          <input value={form.company} onChange={set("company")} placeholder="Acme Inc."
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 outline-none focus:border-teal-400/60" />
        </label>
        <label className="grid gap-1.5 text-sm sm:col-span-2">
          <span className="text-white/60">Website</span>
          <input value={form.website} onChange={set("website")} placeholder="https://acme.com"
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 outline-none focus:border-teal-400/60" />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="text-white/60">Tone</span>
          <select value={form.tone} onChange={set("tone")}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 capitalize outline-none focus:border-teal-400/60">
            {TONES.map((t) => (
              <option key={t} value={t} className="bg-[#0a0b12] capitalize">{t}</option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button type="submit" disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-teal-400 to-violet-500 px-5 py-2.5 font-semibold text-black transition hover:opacity-90 disabled:opacity-60">
            {loading ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
            {loading ? "Researching…" : "Draft outreach"}
          </button>
        </div>
      </form>

      {error && (
        <p className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {draft && (
        <div className="mt-8 grid gap-4">
          <Card title="Subject" body={draft.subject} />
          <Card title="Cold email" body={draft.email} multiline />
          <Card title="Follow-up" body={draft.followUp} multiline />
        </div>
      )}
    </main>
  );
}

function Card({ title, body, multiline }: { title: string; body: string; multiline?: boolean }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-teal-300">{title}</h2>
        <CopyButton text={body} />
      </div>
      <p className={`text-sm text-white/85 ${multiline ? "whitespace-pre-wrap leading-relaxed" : ""}`}>
        {body}
      </p>
    </section>
  );
}
