"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { planTrip } from "@/actions/orchestrate";

export default function TripForm() {
  const [city, setCity] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState(10000);
  const [preferences, setPreferences] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate inputs
    if (!city.trim()) {
      setError("Please enter a city.");
      return;
    }

    if (!Number.isFinite(days) || days < 1 || days > 30) {
      setError("Days must be between 1 and 30.");
      return;
    }

    if (!Number.isFinite(budget) || budget < 0) {
      setError("Budget can't be negative.");
      return;
    }
    if (!travelDate) {
      setError("Please select a travel date.");
      return;
    }
    setLoading(true);

    try {
      const result = await planTrip({
        city,
        travelDate,
        days,
        budget,
        preferences,
      });
      sessionStorage.setItem("tripResult", JSON.stringify(result));
      sessionStorage.setItem("tripCity", city);
      router.push("/results");
    } catch (err) {
      console.error(err);
      setError("Something went wrong generating your trip. Please try again.");
      setLoading(false);
    }
  }

  const inputClass =
    "w-full bg-background/60 border border-ink/10 rounded-lg px-4 py-3 text-ink placeholder:text-ink/30 focus:outline-none focus:border-coral/60 transition-colors";
  const labelClass = "block text-sm text-ink/60 mb-1.5";

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 space-y-5 shadow-xl bg-surface rounded-2xl sm:p-8"
    >
      <div>
        <label className={labelClass}>Where to?</label>
        <input
          className={inputClass}
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Jaipur, Rajasthan"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Travel Date</label>
          <input
            type="date"
            className={inputClass}
            value={travelDate}
            onChange={(e) => setTravelDate(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Days</label>
          <input
            type="number"
            min={1}
            className={inputClass}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Budget (INR)</label>
        <input
          type="number"
          min={0}
          className={`${inputClass} font-mono`}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
        />
      </div>

      <div>
        <label className={labelClass}>Tell us your vibe</label>
        <textarea
          className={`${inputClass} min-h-24 resize-none`}
          value={preferences}
          onChange={(e) => setPreferences(e.target.value)}
          placeholder="I love historical places and street food"
        />
      </div>

      {error && <p className="text-sm text-coral">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-coral hover:bg-coral/90 disabled:opacity-50 text-white font-medium rounded-lg py-3.5 transition-colors"
      >
        {loading ? "Planning your trip..." : "Generate My Trip"}
      </button>
    </form>
  );
}
