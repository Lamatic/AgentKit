"use client";

import { useState } from "react";

export default function TripForm() {
  const [city, setCity] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState(10000);
  const [preferences, setPreferences] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log({ city, travelDate, days, budget, preferences });
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

      <button type="submit">Generate My Trip</button>
    </form>
  );
}
