"use client";

import { useEffect, useState } from "react";

export default function Results() {
  const [trip, setTrip] = useState<any>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("tripResult");
    if (stored) {
    const parsed = JSON.parse(stored);
    console.log('FULL RESULT:\n' + JSON.stringify(parsed, null, 2));
    setTrip(parsed);
  }
  }, []);

  if (!trip) {
    return <p>No trip data found. Please go back and generate a trip.</p>;
  }

  return (
    <main>
      <h1>Your Trip</h1>
      <p>
        {trip.summary.weather} · ₹{trip.summary.estimatedBudget} ·{" "}
        {trip.summary.totalDays} Days
      </p>
      <p>{trip.summary.tripTheme}</p>

      {trip.days.map((day: any) => (
        <div key={day.day}>
          <h2>Day {day.day}</h2>
          <p>
            {day.weather} · ₹{day.budgetUsed} used
          </p>
          {day.activities.map((activity: any, i: number) => (
            <div key={i}>
              <strong>
                {activity.time}: {activity.name}
              </strong>
              <p>{activity.reason}</p>
            </div>
          ))}
        </div>
      ))}

      <h2>Why this plan?</h2>
      <ul>
        {trip.reasons.map((reason: string, i: number) => (
          <li key={i}>{reason}</li>
        ))}
      </ul>
    </main>
  );
}
