"use client";

import { useState } from "react";
import { AlertTriangle, ArrowLeft, Loader2, PenLine } from "lucide-react";
import { Badge, Button, Card, Label } from "./ui";
import { CATEGORY_LABEL } from "@/lib/constants";
import type { DenialFacts } from "@/lib/types";

/** A labelled text input bound to one denial-fact field. */
function Field({ label, value, onChange }: { label: string; value: string | null; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="—"
        className="w-full rounded-lg border p-2 text-sm" style={{ borderColor: "var(--line)" }} />
    </div>
  );
}

/**
 * Step 2 of the wizard: the human-in-the-loop checkpoint.
 *
 * The extracted denial facts are shown as an editable card before anything is
 * drafted, so the policyholder corrects the record rather than discovering an
 * error in the finished letter. Anything the agent flagged in `missingInfo` is
 * surfaced as a "please verify" warning.
 */
export function ConfirmStep({
  facts: initial,
  chunks,
  busy,
  onBack,
  onConfirm
}: {
  facts: DenialFacts;
  chunks: number;
  busy: boolean;
  onBack: () => void;
  onConfirm: (f: DenialFacts) => void;
}) {
  const [f, setF] = useState<DenialFacts>(initial);
  const set = <K extends keyof DenialFacts>(k: K, v: DenialFacts[K]) => setF((p) => ({ ...p, [k]: v }));
  const tone = f.confidence === "high" ? "ok" : f.confidence === "medium" ? "warn" : "danger";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <div className="font-medium">We read your denial letter — please check these facts</div>
            <Badge tone={tone}>confidence: {f.confidence}</Badge>
          </div>
          <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>{f.summary}</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Insurer" value={f.insurer} onChange={(v) => set("insurer", v)} />
            <Field label="Service denied" value={f.serviceDenied} onChange={(v) => set("serviceDenied", v)} />
            <Field label="Claim number" value={f.claimNumber} onChange={(v) => set("claimNumber", v)} />
            <Field label="Member / policy number" value={f.memberOrPolicyNumber} onChange={(v) => set("memberOrPolicyNumber", v)} />
            <Field label="Date of denial" value={f.dateOfDenial} onChange={(v) => set("dateOfDenial", v)} />
            <Field label="Date of service" value={f.dateOfService} onChange={(v) => set("dateOfService", v)} />
            <Field label="Appeal window stated in letter" value={f.appealDeadlineStated} onChange={(v) => set("appealDeadlineStated", v)} />
            <div>
              <Label>Plan type</Label>
              <select value={f.planType} onChange={(e) => set("planType", e.target.value as DenialFacts["planType"])}
                className="w-full rounded-lg border p-2 text-sm" style={{ borderColor: "var(--line)" }}>
                <option value="employer-erisa">Employer plan (ERISA)</option>
                <option value="marketplace-aca">Marketplace / ACA</option>
                <option value="medicare">Medicare</option>
                <option value="medicaid">Medicaid</option>
                <option value="individual">Individual</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
          </div>
        </Card>

        <Card>
          <div className="mb-3 font-medium">Denial reasons ({f.denialReasons.length})</div>
          <div className="space-y-3">
            {f.denialReasons.map((r, i) => (
              <div key={i} className="rounded-lg border p-3" style={{ borderColor: "var(--line)" }}>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge tone="neutral">{CATEGORY_LABEL[r.category] ?? r.category}</Badge>
                  {r.code && <span className="text-xs" style={{ color: "var(--muted)" }}>code {r.code}</span>}
                </div>
                <textarea value={r.statedReason} onChange={(e) => {
                  const next = [...f.denialReasons]; next[i] = { ...r, statedReason: e.target.value }; set("denialReasons", next);
                }} className="h-16 w-full rounded-lg border p-2 text-sm" style={{ borderColor: "var(--line)" }} />
              </div>
            ))}
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onBack}><ArrowLeft size={16} /> Back</Button>
          <Button disabled={busy} onClick={() => onConfirm(f)}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <PenLine size={16} />}
            {busy ? "Retrieving clauses and drafting…" : "Looks right — draft my appeal"}
          </Button>
        </div>
      </div>

      <aside className="space-y-4">
        {f.missingInfo.length > 0 && (
          <Card>
            <div className="mb-2 flex items-center gap-2 font-medium" style={{ color: "var(--warn)" }}><AlertTriangle size={16} /> Please verify</div>
            <ul className="list-disc space-y-1 pl-5 text-sm">{f.missingInfo.map((m, i) => <li key={i}>{m}</li>)}</ul>
          </Card>
        )}
        <Card>
          <div className="mb-1 font-medium">Policy indexed</div>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {chunks > 0 ? `${chunks} passages from your policy are ready to be searched for the clauses that govern this claim.` : "Your policy was submitted for indexing."}
          </p>
        </Card>
      </aside>
    </div>
  );
}
