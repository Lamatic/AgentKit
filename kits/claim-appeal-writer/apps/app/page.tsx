"use client";

import { useState } from "react";
import { Stepper } from "@/components/ui";
import { UploadStep, type UploadPayload } from "@/components/upload-step";
import { ConfirmStep } from "@/components/confirm-step";
import { AppealStep } from "@/components/appeal-step";
import { analyzeDenial, draftAppeal, indexPolicy } from "@/actions/orchestrate";
import type { AppealResult, DenialFacts } from "@/lib/types";

type Step = 1 | 2 | 3;

/**
 * The three-step wizard.
 *
 * Flows 1 and 2 run in parallel on submit (indexing the policy and extracting
 * the denial facts are independent), then the user confirms the facts before
 * flow 3 drafts the appeal.
 */
export default function Page() {
  const [step, setStep] = useState<Step>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [policyId, setPolicyId] = useState("");
  const [chunks, setChunks] = useState(0);
  const [upload, setUpload] = useState<UploadPayload | null>(null);
  const [facts, setFacts] = useState<DenialFacts | null>(null);
  const [result, setResult] = useState<AppealResult | null>(null);

  async function handleUpload(p: UploadPayload) {
    setBusy(true);
    setError("");
    setUpload(p);
    const id = `policy-${crypto.randomUUID()}`;
    setPolicyId(id);
    // Flow 1 and Flow 2 are independent — run them in parallel.
    const [idx, an] = await Promise.all([indexPolicy(p.policyText, id, p.policyTitle), analyzeDenial(p.denialText)]);
    setBusy(false);
    if (!idx.ok) return setError(`Indexing the policy failed: ${idx.error}`);
    if (!an.ok) return setError(`Analyzing the denial failed: ${an.error}`);
    setChunks(idx.data.chunks);
    setFacts(an.data);
    setStep(2);
  }

  async function handleConfirm(f: DenialFacts) {
    if (!upload) return;
    setBusy(true);
    setError("");
    setFacts(f);
    const r = await draftAppeal(f, policyId, upload.state, upload.patientContext);
    setBusy(false);
    if (!r.ok) return setError(`Drafting the appeal failed: ${r.error}`);
    setResult(r.data);
    setStep(3);
  }

  function restart() {
    setStep(1); setFacts(null); setResult(null); setUpload(null); setError(""); setChunks(0); setPolicyId("");
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Turn a denial into an appeal</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          Upload your denial letter and policy. We find the clauses that govern your claim, look up your appeal rights, and draft a letter that cites both.
        </p>
      </div>
      <Stepper step={step} />
      {error && <div className="mb-4 rounded-lg p-3 text-sm" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>{error}</div>}
      {step === 1 && <UploadStep onSubmit={handleUpload} busy={busy} />}
      {step === 2 && facts && <ConfirmStep facts={facts} chunks={chunks} busy={busy} onBack={() => setStep(1)} onConfirm={handleConfirm} />}
      {step === 3 && result && <AppealStep result={result} onBack={() => setStep(2)} onRestart={restart} />}
    </div>
  );
}
