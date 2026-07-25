export default function Results() {
  const trip = {
    summary: {
      weather: "Warm with light rain",
      estimatedBudget: 7400,
      totalDays: 4,
      tripTheme: "Historical Places & Street Food",
    },
    days: [
      {
        day: 1,
        weather: "30.4°C, Rainy",
        budgetUsed: 2500,
        activities: [
          {
            time: "Morning",
            icon: "monument",
            name: "Paanch Batti",
            reason: "Historical monument matching your interest.",
          },
          {
            time: "Afternoon",
            icon: "restaurant",
            name: "Virasat Heritage Restaurant",
            reason: "Local heritage cuisine, indoors.",
          },
          {
            time: "Evening",
            icon: "restaurant",
            name: "Cheap food places",
            reason: "Street food within budget.",
          },
        ],
      },
    ],
    reasons: [
      "Matches your interest in historical places and street food.",
      "Takes weather into account to schedule outdoor activities wisely.",
    ],
  };

  return (
    <main>
      <h1>Your Trip</h1>
      <p>
        {trip.summary.weather} · ₹{trip.summary.estimatedBudget} ·{" "}
        {trip.summary.totalDays} Days
      </p>
      <p>{trip.summary.tripTheme}</p>

      {trip.days.map((day) => (
        <div key={day.day}>
          <h2>Day {day.day}</h2>
          <p>
            {day.weather} · ₹{day.budgetUsed} used
          </p>
          {day.activities.map((activity, i) => (
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
        {trip.reasons.map((reason, i) => (
          <li key={i}>{reason}</li>
        ))}
      </ul>
    </main>
  );
}
