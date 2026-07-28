"use client";

import { useEffect, useState } from "react";

type Activity = { time: string; icon: string; name: string; reason: string };
type Day = {
  day: number;
  weather: string;
  budgetUsed: number;
  activities: Activity[];
};
type Trip = {
  summary: {
    weather: string;
    estimatedBudget: number;
    totalDays: number;
    tripTheme: string;
  };
  days: Day[];
  budget: { total: number; estimated: number };
  reasons: string[];
};

// Picks a gradient based on rough weather keywords in that day's forecast string
function dayGradient(weatherText: string) {
  const w = weatherText.toLowerCase();
  if (w.includes("rain") || w.includes("storm")) {
    return "from-teal/20 via-surface to-surface";
  }
  if (w.includes("cloud") || w.includes("overcast")) {
    return "from-ink/10 via-surface to-surface";
  }
  return "from-gold/20 via-surface to-surface"; // sunny/clear default
}

export default function Results() {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [city, setCity] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("tripResult");
    const storedCity = sessionStorage.getItem("tripCity");
    if (stored) setTrip(JSON.parse(stored));
    if (storedCity) setCity(storedCity);
  }, []);

  if (!trip) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-ink/60">
          No trip data found. Please go back and generate a trip.
        </p>
        <a href="/" className="text-coral hover:underline text-sm">
          ← Back to planner
        </a>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-12 max-w-3xl mx-auto">
      <h1 className="font-display text-3xl sm:text-4xl mb-2">
        Your Trip to <span className="text-coral">{city}</span>
      </h1>
      <p className="text-ink/60 mb-8">{trip.summary.totalDays} Days</p>

      {/* Summary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="bg-surface rounded-xl p-4">
          <p className="text-sm text-ink/50 mb-1">Weather</p>
          <p className="text-sm leading-snug">{trip.summary.weather}</p>
        </div>
        <div className="bg-surface rounded-xl p-4">
          <p className="text-sm text-ink/50 mb-1">Estimated Budget</p>
          <p className="font-mono text-gold text-lg">
            ₹{trip.summary.estimatedBudget}
          </p>
          <p className="text-xs text-ink/40">of ₹{trip.budget.total}</p>
        </div>
        <div className="bg-surface rounded-xl p-4">
          <p className="text-sm text-ink/50 mb-1">Trip Theme</p>
          <p className="text-sm leading-snug">{trip.summary.tripTheme}</p>
        </div>
      </div>

      {/* Day cards */}
      <div className="space-y-5 mb-10">
        {trip.days.map((day) => (
          <div
            key={day.day}
            className={`rounded-2xl p-6 bg-linear-to-br ${dayGradient(day.weather)} border border-ink/5`}
          >
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-display text-2xl">Day {day.day}</h2>
              <p className="font-mono text-sm text-ink/50">{day.weather}</p>
            </div>
            <div className="space-y-4">
              {day.activities.map((activity, i) => {
                const isEmpty = !activity.name;
                return (
                  <div key={i}>
                    <p className="text-sm text-teal uppercase tracking-wide mb-0.5">
                      {activity.time}
                    </p>
                    <p
                      className={isEmpty ? "italic text-ink/40" : "font-medium"}
                    >
                      {activity.name || "No recommendation available"}
                    </p>
                    <p className="text-sm text-ink/50">{activity.reason}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Why this plan */}
      <div className="bg-surface rounded-2xl p-6">
        <h2 className="font-display text-xl mb-4">Why this plan?</h2>
        <ul className="space-y-2">
          {trip.reasons.map((reason, i) => (
            <li key={i} className="text-sm text-ink/70 flex gap-2">
              <span className="text-coral">✓</span> {reason}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
