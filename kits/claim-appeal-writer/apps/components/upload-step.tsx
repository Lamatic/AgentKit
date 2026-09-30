"use client";

import { useRef, useState } from "react";
import { FileText, Upload, Sparkles, Loader2 } from "lucide-react";
import { Button, Card, Label } from "./ui";
import { SAMPLES, SAMPLE_POLICY_FILE, US_STATES } from "@/lib/constants";
import { extractText } from "@/actions/orchestrate";

export interface UploadPayload {
  policyText: string;
  policyTitle: string;
  denialText: string;
  state: string;
  patientContext: string;
}

function DropZone({
  title,
  hint,
  text,
  onText,
  onError
}: {
  title: string;
  hint: string;
  text: string;
  onText: (t: string, name: string) => void;
  onError: (e: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [paste, setPaste] = useState(false);

  async function handleFile(file: File) {
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    const r = await extractText(fd);
    setBusy(false);
    if (!r.ok) return onError(r.error);
    setName(file.name);
    onText(r.data, file.name);
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 font-medium"><FileText size={16} /> {title}</div>
        <button className="text-xs underline-offset-4 hover:underline" style={{ color: "var(--muted)" }} onClick={() => setPaste((p) => !p)}>
          {paste ? "Upload a file instead" : "Paste text instead"}
        </button>
      </div>
      {paste ? (
        <textarea
          className="h-40 w-full rounded-lg border p-3 text-sm"
          style={{ borderColor: "var(--line)" }}
          placeholder={hint}
          value={text}
          onChange={(e) => onText(e.target.value, "pasted text")}
        />
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) void handleFile(f); }}
          className="flex h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-sm"
          style={{ borderColor: "var(--line)", color: "var(--muted)" }}
        >
          {busy ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
          <div className="mt-2">{name ? <span style={{ color: "var(--ok)" }}>✓ {name} ({text.length.toLocaleString()} chars)</span> : "Drop a PDF or text file, or click to browse"}</div>
          <input ref={inputRef} type="file" accept=".pdf,.txt,.md" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }} />
        </div>
      )}
    </Card>
  );
}

/**
 * Step 1 of the wizard: collect the policy and denial documents.
 *
 * Files are converted to text server-side before any flow is called, so the
 * kit needs no file hosting. Sample documents can be loaded with one click so
 * reviewers can try the kit without supplying real medical paperwork.
 */
export function UploadStep({ onSubmit, busy }: { onSubmit: (p: UploadPayload) => void; busy: boolean }) {
  const [policyText, setPolicyText] = useState("");
  const [policyTitle, setPolicyTitle] = useState("");
  const [denialText, setDenialText] = useState("");
  const [state, setState] = useState("California");
  const [patientContext, setPatientContext] = useState("");
  const [error, setError] = useState("");
  const [loadingSample, setLoadingSample] = useState("");

  async function loadSample(id: string) {
    const s = SAMPLES.find((x) => x.id === id);
    if (!s) return;
    setLoadingSample(id);
    setError("");
    try {
      const [p, d] = await Promise.all([
        fetch(`/samples/${SAMPLE_POLICY_FILE}`).then((r) => r.text()),
        fetch(`/samples/${s.file}`).then((r) => r.text())
      ]);
      setPolicyText(p);
      setPolicyTitle("Meridian Health Plan — Evidence of Coverage (sample)");
      setDenialText(d);
      setPatientContext(s.context);
      setState("California");
    } catch {
      setError("Could not load sample documents.");
    } finally {
      setLoadingSample("");
    }
  }

  const ready = policyText.trim().length > 200 && denialText.trim().length > 50 && !busy;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <DropZone title="Your policy document" hint="Paste the text of your Evidence of Coverage / Summary Plan Description…" text={policyText}
          onText={(t, n) => { setPolicyText(t); if (!policyTitle) setPolicyTitle(n); }} onError={setError} />
        <DropZone title="The denial letter" hint="Paste the text of the denial letter or EOB…" text={denialText}
          onText={(t) => setDenialText(t)} onError={setError} />
        <Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Your state</Label>
              <select value={state} onChange={(e) => setState(e.target.value)} className="w-full rounded-lg border p-2 text-sm" style={{ borderColor: "var(--line)" }}>
                {US_STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <Label>Policy name (optional)</Label>
              <input value={policyTitle} onChange={(e) => setPolicyTitle(e.target.value)} className="w-full rounded-lg border p-2 text-sm" style={{ borderColor: "var(--line)" }} placeholder="e.g. Acme PPO 2026" />
            </div>
          </div>
          <div className="mt-4">
            <Label>Anything else we should know?</Label>
            <textarea value={patientContext} onChange={(e) => setPatientContext(e.target.value)} className="h-24 w-full rounded-lg border p-3 text-sm" style={{ borderColor: "var(--line)" }}
              placeholder="e.g. My doctor ordered this after 8 weeks of physical therapy didn't help, and I have numbness in my left leg." />
            <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
              Specifics matter. Dates, how long you tried other treatments, and symptoms are what let the agent match your facts against the thresholds written into your policy.
            </p>
          </div>
        </Card>
        {error && <div className="rounded-lg p-3 text-sm" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>{error}</div>}
        <div className="flex items-center gap-3">
          <Button disabled={!ready} onClick={() => onSubmit({ policyText, policyTitle: policyTitle || "Policy document", denialText, state, patientContext })}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {busy ? "Reading your documents…" : "Analyze my denial"}
          </Button>
          <span className="text-xs" style={{ color: "var(--muted)" }}>Your documents are processed transiently. Only the policy index is stored, under an ID you control.</span>
        </div>
      </div>

      <aside>
        <Card>
          <div className="mb-1 font-medium">Try with sample documents</div>
          <p className="mb-3 text-xs" style={{ color: "var(--muted)" }}>
            A synthetic 9-section health plan and four denial letters. Each denial has a real rebuttal hiding in the policy.
          </p>
          <div className="space-y-2">
            {SAMPLES.map((s) => (
              <button key={s.id} onClick={() => void loadSample(s.id)} disabled={!!loadingSample}
                className="w-full rounded-lg border px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-60" style={{ borderColor: "var(--line)" }}>
                {loadingSample === s.id ? "Loading…" : s.label}
              </button>
            ))}
          </div>
        </Card>
      </aside>
    </div>
  );
}
