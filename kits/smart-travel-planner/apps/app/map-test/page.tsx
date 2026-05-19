"use client";

import { useEffect, useState } from "react";

export default function MapTest() {
  const [location, setLocation] = useState<any>(null);

  useEffect(() => {
    fetch("/api/map-test")
      .then(res => res.json())
      .then(data => {
        console.log("Test map data:", data);
        setLocation(data);
      });
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Map Test</h2>

      {location ? (
        <iframe
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng - 0.05},${location.lat - 0.05},${location.lng + 0.05},${location.lat + 0.05}&layer=mapnik&marker=${location.lat},${location.lng}`}
          style={{ width: "100%", height: "500px", border: "none" }}
        />
      ) : (
        <div>Loading map...</div>
      )}
    </div>
  );
}