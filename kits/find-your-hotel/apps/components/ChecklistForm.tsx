"use client";

import { useState } from "react";
import type { Traveler } from "@/lib/lamatic-client";

export type FormValues = {
  destination: string;
  startDate: string;
  endDate: string;
  tripType: string;
  travelers: Traveler[];
};

const TRIP_TYPES = [
  { value: "city-break", label: "City break" },
  { value: "beach", label: "Beach" },
  { value: "hiking", label: "Hiking" },
  { value: "business", label: "Business" },
  { value: "winter-sports", label: "Winter sports" },
];

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function validateDates(start: string, end: string): string | null {
  if (!start || !end) return null;
  if (start < todayStr()) return "Depart date must be today or in the future.";
  if (end < todayStr()) return "Return date must be today or in the future.";
  if (start === end) return "Depart and return cannot be the same date.";
  if (end < start) return "Return must be after depart.";
  return null;
}

export default function ChecklistForm({
  onSubmit,
  loading,
  defaultValues,
}: {
  onSubmit: (values: FormValues) => void;
  loading: boolean;
  defaultValues?: Partial<Pick<FormValues, "destination" | "startDate" | "endDate">>;
}) {
  const [destination, setDestination] = useState(defaultValues?.destination ?? "");
  const [startDate, setStartDate] = useState(defaultValues?.startDate ?? "");
  const [endDate, setEndDate] = useState(defaultValues?.endDate ?? "");
  const [tripType, setTripType] = useState("city-break");
  const [travelers, setTravelers] = useState<Traveler[]>([{ name: "You", tag: "adult" }]);
  const [dateError, setDateError] = useState<string | null>(null);

  function handleStartChange(val: string) {
    setStartDate(val);
    setDateError(validateDates(val, endDate));
  }

  function handleEndChange(val: string) {
    setEndDate(val);
    setDateError(validateDates(startDate, val));
  }

  function updateTraveler(idx: number, patch: Partial<Traveler>) {
    setTravelers((prev) => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  }

  function addTraveler() {
    setTravelers((prev) => [...prev, { name: `Traveler ${prev.length + 1}`, tag: "adult" }]);
  }

  function removeTraveler(idx: number) {
    setTravelers((prev) => prev.filter((_, i) => i !== idx));
  }

  const isValid = destination.trim() && startDate && endDate && !dateError;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const err = validateDates(startDate, endDate);
        if (err) { setDateError(err); return; }
        onSubmit({ destination, startDate, endDate, tripType, travelers });
      }}
      className="perforated bg-white/60 border border-ink/10 rounded-xl p-6 md:p-8 shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-pine/70">
          Boarding Details
        </span>
        <div className="barcode w-24 text-ink" />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <label className="block">
          <span className="font-mono text-xs uppercase tracking-wide text-ink/60">Destination</span>
          <input
            required
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Lisbon, Portugal"
            className="mt-1 w-full bg-transparent border-b-2 border-ink/20 focus:border-pine outline-none py-2 font-display text-lg"
          />
        </label>

        <label className="block">
          <span className="font-mono text-xs uppercase tracking-wide text-ink/60">Trip type</span>
          <select
            value={tripType}
            onChange={(e) => setTripType(e.target.value)}
            className="mt-1 w-full bg-transparent border-b-2 border-ink/20 focus:border-pine outline-none py-2 font-display text-lg"
          >
            {TRIP_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="font-mono text-xs uppercase tracking-wide text-ink/60">Depart</span>
          <input
            required
            type="date"
            value={startDate}
            min={todayStr()}
            onChange={(e) => handleStartChange(e.target.value)}
            className="mt-1 w-full bg-transparent border-b-2 border-ink/20 focus:border-pine outline-none py-2 font-display text-lg"
          />
        </label>

        <label className="block">
          <span className="font-mono text-xs uppercase tracking-wide text-ink/60">Return</span>
          <input
            required
            type="date"
            value={endDate}
            min={startDate || todayStr()}
            onChange={(e) => handleEndChange(e.target.value)}
            className="mt-1 w-full bg-transparent border-b-2 border-ink/20 focus:border-pine outline-none py-2 font-display text-lg"
          />
        </label>
      </div>

      {dateError && (
        <p className="mt-4 font-mono text-sm text-stamp border border-stamp/30 bg-stamp/5 rounded-lg px-4 py-3">
          {dateError}
        </p>
      )}

      <div className="mt-7">
        <span className="font-mono text-xs uppercase tracking-wide text-ink/60">Travelers</span>
        <div className="mt-2 space-y-2">
          {travelers.map((t, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                required
                value={t.name}
                onChange={(e) => updateTraveler(idx, { name: e.target.value })}
                className="flex-1 bg-transparent border-b border-ink/20 focus:border-pine outline-none py-1.5 font-body"
              />
              <select
                value={t.tag}
                onChange={(e) => updateTraveler(idx, { tag: e.target.value as Traveler["tag"] })}
                className="bg-transparent border-b border-ink/20 focus:border-pine outline-none py-1.5 font-mono text-sm"
              >
                <option value="adult">Adult</option>
                <option value="child">Child</option>
              </select>
              {travelers.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTraveler(idx)}
                  className="text-stamp/70 hover:text-stamp text-sm font-mono px-2"
                  aria-label={`Remove ${t.name}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addTraveler}
          className="mt-3 font-mono text-xs uppercase tracking-wide text-pine hover:text-pine/70"
        >
          + Add traveler
        </button>
      </div>

      <button
        type="submit"
        disabled={loading || !isValid}
        className="mt-8 w-full bg-pine text-parchment font-display font-semibold text-lg py-3 rounded-lg hover:bg-pine/90 disabled:opacity-50 transition-colors"
      >
        {loading ? "Generating…" : "Generate packing list"}
      </button>
    </form>
  );
}
