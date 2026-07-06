"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { emptyOffer, type OfferInput } from "@/lib/types";

type FieldKey = keyof OfferInput;

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  numeric,
  required,
}: {
  id: FieldKey;
  label: string;
  value: string;
  onChange: (key: FieldKey, value: string) => void;
  placeholder?: string;
  numeric?: boolean;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
        {required ? <span style={{ color: "var(--brass)" }}> *</span> : null}
      </label>
      <input
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(id, e.target.value)}
        placeholder={placeholder}
        className={cn("field-input", numeric && "field-num")}
      />
    </div>
  );
}

export function OfferForm({
  onSubmit,
  loading,
}: {
  onSubmit: (offer: OfferInput) => void;
  loading: boolean;
}) {
  const [offer, setOffer] = useState<OfferInput>(emptyOffer);

  const set = (key: FieldKey, value: string) =>
    setOffer((prev) => ({ ...prev, [key]: value }));

  const canSubmit =
    offer.role.trim() !== "" &&
    offer.offered_base.trim() !== "" &&
    offer.priorities.trim() !== "" &&
    !loading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(offer);
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 sm:p-8">
      <div className="space-y-8">
        <section className="space-y-4">
          <div className="section-label">The role</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="role" label="Role" value={offer.role} onChange={set} placeholder="Senior Software Engineer" required />
            <Field id="company" label="Company" value={offer.company} onChange={set} placeholder="Acme Corp" />
            <Field id="location" label="Location" value={offer.location} onChange={set} placeholder="London, UK" />
            <Field id="seniority" label="Seniority" value={offer.seniority} onChange={set} placeholder="Senior" />
          </div>
        </section>

        <section className="space-y-4">
          <div className="section-label">On the table</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            <div className="space-y-4">
              <p className="eyebrow">Your current pay</p>
              <Field id="current_base" label="Base" value={offer.current_base} onChange={set} placeholder="£85,000" numeric />
              <Field id="current_bonus" label="Bonus" value={offer.current_bonus} onChange={set} placeholder="10%" numeric />
              <Field id="current_equity" label="Equity" value={offer.current_equity} onChange={set} placeholder="none" numeric />
            </div>
            <div className="space-y-4">
              <p className="eyebrow">The offer</p>
              <Field id="offered_base" label="Base" value={offer.offered_base} onChange={set} placeholder="£95,000" numeric required />
              <Field id="offered_bonus" label="Bonus" value={offer.offered_bonus} onChange={set} placeholder="10%" numeric />
              <Field id="offered_equity" label="Equity" value={offer.offered_equity} onChange={set} placeholder="0.02% over 4 years" numeric />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="section-label">Your hand</div>
          <div className="space-y-4">
            <div>
              <label htmlFor="priorities" className="field-label">
                What matters most to you
                <span style={{ color: "var(--brass)" }}> *</span>
              </label>
              <textarea
                id="priorities"
                name="priorities"
                value={offer.priorities}
                onChange={(e) => set("priorities", e.target.value)}
                placeholder="Higher base, remote flexibility"
                rows={2}
                className="field-textarea"
              />
            </div>
            <div>
              <label htmlFor="competing_offers" className="field-label">
                Competing offers or outside options
              </label>
              <textarea
                id="competing_offers"
                name="competing_offers"
                value={offer.competing_offers}
                onChange={(e) => set("competing_offers", e.target.value)}
                placeholder="One other final-stage interview, no offer yet"
                rows={2}
                className="field-textarea"
              />
            </div>
            <div>
              <label htmlFor="constraints" className="field-label">
                Constraints or notes
              </label>
              <textarea
                id="constraints"
                name="constraints"
                value={offer.constraints}
                onChange={(e) => set("constraints", e.target.value)}
                placeholder="Need to decide within a week"
                rows={2}
                className="field-textarea"
              />
            </div>
          </div>
        </section>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
          <button type="submit" className="btn-primary" disabled={!canSubmit}>
            {loading ? "Building your brief…" : "Build my negotiation brief"}
          </button>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            <span style={{ color: "var(--brass)" }}>*</span> Role, offered base,
            and priorities are required.
          </p>
        </div>
      </div>
    </form>
  );
}
