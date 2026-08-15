return {
  schema: {
    table: "lamatic.trips",
    columns: [
      { name: "ride_id", type: "text", description: "Unique identifier for the ride (primary key)" },
      { name: "driver_id", type: "text", description: "Identifier for the driver" },
      { name: "passenger_id", type: "text", description: "Identifier for the passenger" },
      { name: "vehicle_type", type: "text", description: "e.g. Uber Black, UberX, etc." },
      { name: "payment_method", type: "text", description: "e.g. Digital Wallet, Credit Card, Cash" },
      { name: "ride_status", type: "text", description: "e.g. Completed, Cancelled, No Show" },
      { name: "cancellation_reason", type: "text", description: "Reason if ride_status = Cancelled, else NULL" },
      { name: "pickup_city", type: "text", description: "City name where the ride started" },
      { name: "dropoff_city", type: "text", description: "City name where the ride ended" },
      { name: "region", type: "text", description: "US region, e.g. South, West, Northeast" },
      { name: "state", type: "text", description: "US state abbreviation" },
      { name: "distance_miles", type: "double precision", description: "Trip distance in miles" },
      { name: "duration_minutes", type: "bigint", description: "Trip duration in minutes" },
      { name: "booking_timestamp", type: "timestamp", description: "When the ride was booked" },
      { name: "pickup_timestamp", type: "timestamp", description: "When pickup occurred" },
      { name: "dropoff_timestamp", type: "timestamp", description: "When dropoff occurred" },
      { name: "base_fare", type: "double precision" },
      { name: "distance_fare", type: "double precision" },
      { name: "time_fare", type: "double precision" },
      { name: "surge_multiplier", type: "double precision" },
      { name: "subtotal", type: "double precision" },
      { name: "tip_amount", type: "double precision" },
      { name: "total_fare", type: "double precision" },
      { name: "rating", type: "double precision", description: "Passenger's rating for this ride" },
      { name: "driver_rating", type: "double precision", description: "Driver's overall rating" }
    ]
  }
};