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
    setLoading(true);
    setError("");

    try {
      const result = await planTrip({
        city,
        travelDate,
        days,
        budget,
        preferences,
      });
      sessionStorage.setItem("tripResult", JSON.stringify(result));
      router.push("/results");
    } catch (err) {
      console.error(err);
      setError("Something went wrong generating your trip. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>City</label>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Jaipur, Rajasthan"
        />
      </div>

      <div>
        <label>Travel Date</label>
        <input
          type="date"
          value={travelDate}
          onChange={(e) => setTravelDate(e.target.value)}
        />
      </div>

      <div>
        <label>Days</label>
        <input
          type="number"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        />
      </div>

      <div>
        <label>Budget (INR)</label>
        <input
          type="number"
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
        />
      </div>

      <div>
        <label>Tell us your vibe</label>
        <textarea
          value={preferences}
          onChange={(e) => setPreferences(e.target.value)}
          placeholder="I love historical places and street food"
        />
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? "Planning your trip..." : "Generate My Trip"}
      </button>
    </form>
  );
}
