"use client";

import { useState } from "react";
import { Loader2, CloudRain } from "lucide-react";
import type { PlannerInput } from "@/actions/orchestrate";
import { ROOF_LABEL, USE_LABEL, type PrimaryUse, type RoofType } from "@/lib/calc";

type Props = { loading: boolean; onSubmit: (input: PlannerInput) => void };

export function PlannerForm({ loading, onSubmit }: Props) {
  const [city, setCity] = useState("Ludhiana, Punjab");
  const [roofArea, setRoofArea] = useState("1000");
  const [areaUnit, setAreaUnit] = useState<"m2" | "sqft">("sqft");
  const [roofType, setRoofType] = useState<RoofType>("rcc_concrete");
  const [householdSize, setHouseholdSize] = useState("4");
  const [primaryUse, setPrimaryUse] = useState<PrimaryUse>("flushing_cleaning");
  const [budget, setBudget] = useState("");
  const [language, setLanguage] = useState<"en" | "hi">("en");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      city,
      roofArea: Number(roofArea),
      areaUnit,
      roofType,
      householdSize: Number(householdSize),
      primaryUse,
      budgetInr: budget ? Number(budget) : undefined,
      language,
    });
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <div>
        <label className="label" htmlFor="city">City or town</label>
        <input id="city" className="input" value={city} onChange={(e) => setCity(e.target.value)} required />
      </div>

      <div>
        <label className="label" htmlFor="area">Roof area</label>
        <div className="flex gap-2">
          <input
            id="area"
            className="input"
            type="number"
            min={1}
            step="any"
            value={roofArea}
            onChange={(e) => setRoofArea(e.target.value)}
            required
          />
          <select
            className="input w-28"
            value={areaUnit}
            onChange={(e) => setAreaUnit(e.target.value as "m2" | "sqft")}
            aria-label="Area unit"
          >
            <option value="sqft">sq ft</option>
            <option value="m2">m²</option>
          </select>
        </div>
        <p className="mt-1 text-xs text-muted">Only the roof area that drains to your gutters/pipes.</p>
      </div>

      <div>
        <label className="label" htmlFor="roof">Roof type</label>
        <select id="roof" className="input" value={roofType} onChange={(e) => setRoofType(e.target.value as RoofType)}>
          {Object.entries(ROOF_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="people">People in household</label>
          <input
            id="people"
            className="input"
            type="number"
            min={1}
            max={500}
            value={householdSize}
            onChange={(e) => setHouseholdSize(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="budget">Budget (₹, optional)</label>
          <input
            id="budget"
            className="input"
            type="number"
            min={0}
            placeholder="e.g. 40000"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="use">What will the water be used for?</label>
        <select id="use" className="input" value={primaryUse} onChange={(e) => setPrimaryUse(e.target.value as PrimaryUse)}>
          {Object.entries(USE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div>
        <span className="label">Plan language</span>
        <div className="flex gap-4 text-sm">
          {(["en", "hi"] as const).map((l) => (
            <label key={l} className="flex items-center gap-2">
              <input type="radio" name="lang" checked={language === l} onChange={() => setLanguage(l)} />
              {l === "en" ? "English" : "हिन्दी (Hindi)"}
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudRain className="h-4 w-4" />}
        {loading ? "Fetching rainfall & planning…" : "Plan my system"}
      </button>
    </form>
  );
}
