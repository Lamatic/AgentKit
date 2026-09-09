"use client";

import { ORDER_STATUSES, PAYMENT_STATUSES, REFUND_STATUSES, RULE_IDS, extraJsonProblem, parseJsonObject } from "../lib/facts-form";
import type { FactsForm, PolicyForm, RecipientForm } from "../lib/facts-form";
import { SAMPLE_TRUTH_URL, SCENARIOS } from "../lib/scenarios";
import { blankState, scenarioById, stateFromScenario, switchFactsMode } from "../lib/composer-state";
import type { ComposerState } from "../lib/composer-state";

interface Props {
  state: ComposerState;
  onChange: (next: ComposerState) => void;
}

function Section({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children, hint, className = "" }: { label: string; children: React.ReactNode; hint?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted">{hint}</span>}
    </label>
  );
}

function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <button type="button" role="switch" aria-checked={checked} className="switch mt-0.5" onClick={() => onChange(!checked)} aria-label={label} />
      <div>
        <div className="text-sm">{label}</div>
        {hint && <div className="text-[11px] text-muted">{hint}</div>}
      </div>
    </div>
  );
}

const Select = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) => (
  <select className="control" value={value} onChange={(e) => onChange(e.target.value)}>
    {options.map((o) => (
      <option key={o} value={o}>{o || "not known"}</option>
    ))}
  </select>
);

export function Composer({ state, onChange }: Props) {
  const set = (patch: Partial<ComposerState>) => onChange({ ...state, ...patch });
  const setFacts = (patch: Partial<FactsForm>) => set({ facts: { ...state.facts, ...patch } });
  const setRecipient = (patch: Partial<RecipientForm>) => set({ recipient: { ...state.recipient, ...patch } });
  const setPolicy = (patch: Partial<PolicyForm>) => set({ policy: { ...state.policy, ...patch } });
  const scenario = scenarioById(state.scenarioId);

  return (
    <div className="space-y-4">
      <Section
        title="Message"
        aside={
          <div className="seg" aria-label="Source">
            <button type="button" aria-pressed={state.source === "scenario"} onClick={() => onChange(stateFromScenario(scenario ?? SCENARIOS[0]))}>Scenarios</button>
            <button type="button" aria-pressed={state.source === "custom"} onClick={() => onChange({ ...blankState(), advancedOpen: state.advancedOpen })}>Custom</button>
          </div>
        }
      >
        {state.source === "scenario" && (
          <div className="mb-4 grid gap-1.5">
            {SCENARIOS.map((s) => {
              const active = s.id === state.scenarioId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onChange(stateFromScenario(s))}
                  className={`rounded-xl border px-3.5 py-2.5 text-left transition ${active ? "border-line-strong bg-white shadow-sm" : "border-transparent bg-surface-2 hover:bg-white"}`}
                >
                  <div className="text-sm font-medium">{s.title}</div>
                  {active && <div className="mt-1 text-xs leading-relaxed text-ink-2">{s.blurb} <span className="text-muted">Expected: {s.expect}</span></div>}
                </button>
              );
            })}
          </div>
        )}
        <Field label="Draft" hint="What the agent wants to send. Hinglish is fine.">
          <textarea className="control" rows={4} value={state.draft} placeholder="Namaste! Aapka order PO1430779 kal subah pahunch jayega…" onChange={(e) => set({ draft: e.target.value })} />
        </Field>
      </Section>

      <Section
        title="Facts the agent may rely on"
        aside={
          <div className="seg" aria-label="Facts editor">
            <button type="button" aria-pressed={state.factsMode === "fields"} onClick={() => onChange(switchFactsMode(state, "fields"))}>Fields</button>
            <button type="button" aria-pressed={state.factsMode === "json"} onClick={() => onChange(switchFactsMode(state, "json"))}>JSON</button>
          </div>
        }
      >
        {state.factsMode === "json" ? (
          <div>
            <textarea className="control mono text-xs" rows={12} value={state.factsJson} onChange={(e) => set({ factsJson: e.target.value, factsJsonError: e.target.value.trim() && parseJsonObject(e.target.value) === null ? "Not a JSON object yet." : "" })} placeholder='{ "order": { "po": "PO1430779", "status": "pending", "total": 8864 }, "offers": [], "eta": null }' />
            {state.factsJsonError && <p className="mt-2 text-xs text-bad">{state.factsJsonError}</p>}
            <p className="mt-2 text-[11px] text-muted">Keys the rules look at: order.status, offers, eta, refund.status, payment.status, links, plus anything you add.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Order id" className="col-span-2 sm:col-span-1"><input className="control mono" value={state.facts.orderId} placeholder="PO1430779" onChange={(e) => setFacts({ orderId: e.target.value })} /></Field>
              <Field label="Order status" className="col-span-2 sm:col-span-1"><Select value={state.facts.orderStatus} onChange={(v) => setFacts({ orderStatus: v })} options={ORDER_STATUSES} /></Field>
              <Field label="Total ₹"><input className="control mono" inputMode="decimal" value={state.facts.orderTotal} placeholder="8864" onChange={(e) => setFacts({ orderTotal: e.target.value })} /></Field>
              <Field label="Items"><input className="control mono" inputMode="numeric" value={state.facts.orderItems} placeholder="10" onChange={(e) => setFacts({ orderItems: e.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Delivery ETA" hint="Leave empty if none is promised." className="col-span-2 sm:col-span-1"><input className="control" value={state.facts.eta} placeholder="2026-09-10 or “kal shaam”" onChange={(e) => setFacts({ eta: e.target.value })} /></Field>
              <Field label="Offers" hint="One per line, e.g. MONSOON5 5%. Empty means no offers." className="col-span-2 sm:col-span-1"><textarea className="control mono" rows={1} value={state.facts.offers} onChange={(e) => setFacts({ offers: e.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Refund status"><Select value={state.facts.refundStatus} onChange={(v) => setFacts({ refundStatus: v })} options={REFUND_STATUSES} /></Field>
              <Field label="Refund ₹"><input className="control mono" inputMode="decimal" value={state.facts.refundAmount} onChange={(e) => setFacts({ refundAmount: e.target.value })} /></Field>
              <Field label="Payment status"><Select value={state.facts.paymentStatus} onChange={(v) => setFacts({ paymentStatus: v })} options={PAYMENT_STATUSES} /></Field>
            </div>
            <Field label="Links the message may include" hint="One per line. Any other link is flagged."><textarea className="control mono" rows={1} value={state.facts.links} onChange={(e) => setFacts({ links: e.target.value })} /></Field>
            <details className="group" open={Boolean(state.facts.extra)}>
              <summary className="cursor-pointer select-none text-xs font-medium text-muted hover:text-ink">More facts as JSON (optional)</summary>
              <textarea className="control mono mt-2 text-xs" rows={4} value={state.facts.extra} placeholder='{ "seller": "Hoppin Distributors" }' onChange={(e) => setFacts({ extra: e.target.value })} />
              {extraJsonProblem(state.facts) && <p className="mt-2 text-xs text-bad">{extraJsonProblem(state.facts)}</p>}
            </details>
          </div>
        )}
      </Section>

      <Section title="Recipient">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Name" className="col-span-3 sm:col-span-1"><input className="control" value={state.recipient.name} placeholder="Aditya Kirana Store" onChange={(e) => setRecipient({ name: e.target.value })} /></Field>
          <Field label="Phone" className="col-span-3 sm:col-span-1"><input className="control mono" inputMode="tel" value={state.recipient.phone} placeholder="919045576383" onChange={(e) => setRecipient({ phone: e.target.value })} /></Field>
          <Field label="Email" className="col-span-3 sm:col-span-1"><input className="control" inputMode="email" value={state.recipient.email} onChange={(e) => setRecipient({ email: e.target.value })} /></Field>
        </div>
      </Section>

      <section className="card p-5">
        <button type="button" className="flex w-full items-center justify-between text-left" aria-expanded={state.advancedOpen} onClick={() => set({ advancedOpen: !state.advancedOpen })}>
          <h2 className="text-sm font-semibold tracking-tight">Source of truth and policy</h2>
          <span className="text-xs text-muted">{state.advancedOpen ? "Hide" : "Show"}</span>
        </button>
        {state.advancedOpen && (
          <div className="mt-4 space-y-4">
            <Field label="truth_url" hint="If set, the gate fetches facts itself and they override the ones above. Must be reachable from Lamatic's runtime.">
              <input className="control mono text-xs" value={state.truthUrl} placeholder={SAMPLE_TRUTH_URL} onChange={(e) => set({ truthUrl: e.target.value })} />
            </Field>
            <div className="divide-y divide-line">
              <Switch checked={state.forceCheck} onChange={(v) => set({ forceCheck: v })} label="Force a fact check" hint="The drafter's needs_fact_check flag. Runs the judge even for a greeting." />
              <Switch checked={state.policy.alwaysCheck} onChange={(v) => setPolicy({ alwaysCheck: v })} label="Policy: always check" hint="Same effect, but set by policy rather than per message." />
              <Switch checked={state.policy.formalAddress} onChange={(v) => setPolicy({ formalAddress: v })} label="Require formal address (aap)" hint="Flags tu / tum as a rewrite finding." />
              <Switch checked={state.policy.allowSmallCounts} onChange={(v) => setPolicy({ allowSmallCounts: v })} label="Tolerate single-digit counts" hint="“2 cheezein” passes without a matching fact." />
            </div>
            <div>
              <span className="label">Disabled rules</span>
              <div className="flex flex-wrap gap-1.5">
                {RULE_IDS.map((id) => {
                  const off = state.policy.disableRules.includes(id);
                  return (
                    <button key={id} type="button" aria-pressed={off} onClick={() => setPolicy({ disableRules: off ? state.policy.disableRules.filter((r) => r !== id) : [...state.policy.disableRules, id] })} className={`rounded-full border px-2.5 py-1 text-xs ${off ? "border-bad/40 bg-bad-soft text-bad line-through" : "border-line bg-white text-ink-2 hover:border-line-strong"}`}>
                      {id}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
