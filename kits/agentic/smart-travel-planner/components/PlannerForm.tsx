"use client";

import { useState } from "react";

export type ItineraryData = {
  destination: string;
  country: string;
  introduction: string;
  best_time_to_visit: string;
  estimated_budget: string;
  highlights: { name: string; description: string }[];
  food: { name: string; description: string }[];
  culture: string[];
  travel_tips: string[];
  days: {
    day: number;
    title: string;
    morning: string;
    afternoon: string;
    evening: string;
    food_recommendation: string;
    stay_suggestion: string;
    estimated_day_cost: string;
    notes: string;
  }[];
};



type Highlight = { name: string; description: string };
type DayPlan = {
  day: number;
  title: string;
  morning: string;
  afternoon: string;
  evening: string;
  morning_location?: string;
  afternoon_location?: string;
  evening_location?: string;
  food_recommendation: string;
  stay_suggestion: string;
  estimated_day_cost: string;
  notes: string;
};
type Itinerary = {
  success?: boolean; destination?: string; country?: string;
  introduction?: string; best_time_to_visit?: string; estimated_budget?: string;
  highlights?: Highlight[]; food?: Highlight[]; culture?: string[];
  travel_tips?: string[]; days?: DayPlan[];
};
type TravelResponse = { success?: boolean; itinerary?: Itinerary; error?: string };

export default function PlannerForm() {
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState("");
  const [budget, setBudget] = useState("");
  const [destinationType, setDestinationType] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<TravelResponse | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [dayLocation, setDayLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapLoading, setMapLoading] = useState(false);

  const [dayPhotos, setDayPhotos] = useState<string[]>([]);
const [dayPhotoLoading, setDayPhotoLoading] = useState(false);


  const fetchDayLocation = async (place: string) => {
     console.log("Fetching map for:", place); 
  setMapLoading(true);
  setDayLocation(null);

  try {
    const res = await fetch(`/api/geocode?query=${encodeURIComponent(place)}`);
    const data = await res.json();

    console.log("Geocode query:", place);
    console.log("Geocode response:", data);

    if (
      typeof data?.lat === "number" &&
      !Number.isNaN(data.lat) &&
      typeof data?.lng === "number" &&
      !Number.isNaN(data.lng)
    ) {
      setDayLocation({ lat: data.lat, lng: data.lng });
    } else {
      setDayLocation(null);
    }
  } catch (error) {
    console.error("Geocode fetch failed:", error);
    setDayLocation(null);
  } finally {
    setMapLoading(false);
  }
};


const fetchDayPhoto = async (place: string) => {
  setDayPhotoLoading(true);
  setDayPhotos([]);
  try {
    const res = await fetch(`/api/places?query=${encodeURIComponent(place)}`);
    const data = await res.json();
    setDayPhotos(data.photos?.slice(0, 4) ?? []);
  } catch {
    setDayPhotos([]);
  } finally {
    setDayPhotoLoading(false);
  }
};



  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);
    setActiveDay(0);

    try {
      const res = await fetch("/api/travel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination, days: Number(days),
          budget: Number(budget), destination_type: destinationType,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setResponse({ error: data?.error || "Failed to generate itinerary." }); return; }
      setResponse(data);

      // Fetch photos
      try {
        const photoRes = await fetch(`/api/places?query=${encodeURIComponent(destination)}`);
        const photoData = await photoRes.json();
        setPhotos(photoData.photos ?? []);
      } catch {
        setPhotos([]);
      }

    
     // Fetch map for day 1
if (data?.itinerary?.days?.[0]) {
  const firstDay = data.itinerary.days[0];
  const location =
    firstDay.morning_location ||
    firstDay.afternoon_location ||
    firstDay.evening_location ||
    data?.itinerary?.destination ||
    destination;

  fetchDayLocation(location);
  fetchDayPhoto(location); // ADD THIS
}


    } catch (error) {
      console.error("Planner form error:", error);
      setResponse({ error: "Something went wrong while generating the itinerary." });
    } finally {
      setLoading(false);
    }
  };

  const itinerary = response?.itinerary;

  return (
    <div className="planner-card">

      {/* Form */}
      <form onSubmit={handleSubmit} className="planner-form">
        <div className="form-grid">
          <div className="input-group">
            <label>Destination</label>
            <input type="text" placeholder="e.g. Japan, Bali, Sikkim"
              value={destination} onChange={(e) => setDestination(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Number of Days</label>
            <input type="number" placeholder="e.g. 5"
              value={days} onChange={(e) => setDays(e.target.value)} min="1" required />
          </div>
          <div className="input-group">
            <label>Budget (USD)</label>
            <input type="number" placeholder="e.g. 1000"
              value={budget} onChange={(e) => setBudget(e.target.value)} min="1" required />
          </div>
          <div className="input-group">
           <label>Destination Type <span style={{opacity: 0.4, fontSize: "10px"}}>(optional)</span></label>
            <select value={destinationType} onChange={(e) => setDestinationType(e.target.value)}>
              <option value="">Select a type</option>
              <option value="adventure">Adventure</option>
              <option value="mountain">Mountain</option>
              <option value="beach">Beach</option>
              <option value="city">City</option>
              <option value="cultural">Cultural</option>
              <option value="nature">Nature</option>
              <option value="luxury">Luxury</option>
              <option value="romantic">Romantic</option>
            </select>
          </div>
        </div>
        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? (
            <>
              <svg style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }}
                viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Generating...
            </>
          ) : "Generate Itinerary"}
        </button>
      </form>

      
      {response?.error && <p className="error-text">{response.error}</p>}

    
      {itinerary && (
        <div className="result-card">
          <h3>Your Travel Plan</h3>

          
          <div className="itinerary-hero">
            <h2>{itinerary.destination}{itinerary.country ? `, ${itinerary.country}` : ""}</h2>
            {itinerary.introduction && <p>{itinerary.introduction}</p>}
            <div className="stat-pills">
              {itinerary.best_time_to_visit && (
                <div className="stat-pill">
                  <div className="pill-label">Best Time</div>
                  <div className="pill-value">{itinerary.best_time_to_visit}</div>
                </div>
              )}
              {itinerary.estimated_budget && (
                <div className="stat-pill">
                  <div className="pill-label">Est. Budget</div>
                  <div className="pill-value">{itinerary.estimated_budget}</div>
                </div>
              )}
            </div>
          </div>

          {/* Photo Gallery */}
          {photos.length > 0 && (
            <div className="gallery-section">
              <h4>Photos of {itinerary.destination}</h4>
              <div className="photo-grid">
                {photos.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`${itinerary.destination} photo ${i + 1}`}
                    onClick={() => setLightboxImg(url)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Lightbox */}
          {lightboxImg && (
            <div className="lightbox-overlay" onClick={() => setLightboxImg(null)}>
              <button className="lightbox-close" onClick={() => setLightboxImg(null)}>×</button>
              <img src={lightboxImg} alt="Full view" onClick={(e) => e.stopPropagation()} />
            </div>
          )}

          {/* Highlights + Food */}
          {((itinerary.highlights?.length ?? 0) > 0 || (itinerary.food?.length ?? 0) > 0) && (
            <div className="info-grid">
              {itinerary.highlights && itinerary.highlights.length > 0 && (
                <div className="info-section">
                  <h4>Highlights</h4>
                  {itinerary.highlights.map((item, i) => (
                    <div key={i} className="info-block">
                      <strong>{item.name}</strong>
                      <p>{item.description}</p>
                    </div>
                  ))}
                </div>
              )}
              {itinerary.food && itinerary.food.length > 0 && (
                <div className="info-section">
                  <h4>Food</h4>
                  {itinerary.food.map((item, i) => (
                    <div key={i} className="info-block food-block">
                      <strong>{item.name}</strong>
                      <p>{item.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Culture + Tips */}
          {((itinerary.culture?.length ?? 0) > 0 || (itinerary.travel_tips?.length ?? 0) > 0) && (
            <div className="info-grid">
              {itinerary.culture && itinerary.culture.length > 0 && (
                <div className="info-section">
                  <h4>Culture</h4>
                  <ul className="bullet-list culture">
                    {itinerary.culture.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              )}
              {itinerary.travel_tips && itinerary.travel_tips.length > 0 && (
                <div className="info-section">
                  <h4>Travel Tips</h4>
                  <ul className="bullet-list tips">
                    {itinerary.travel_tips.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Day-wise Plan */}
          {itinerary.days && itinerary.days.length > 0 && (
            <div className="day-plan-section">
              <h4>Day-wise Plan</h4>
              <div className="day-tabs">
                {itinerary.days.map((day, i) => (
                  <button
                    key={i}
                    className={`day-tab${activeDay === i ? " active" : ""}`}
                 onClick={() => {
  setActiveDay(i);
  const selectedDay = itinerary.days![i];
  const location =
    selectedDay.morning_location ||
    selectedDay.afternoon_location ||
    selectedDay.evening_location ||
    (itinerary.destination ?? destination);

  fetchDayLocation(location);
  fetchDayPhoto(location);
}}>
                    Day {day.day}
                  </button>
                ))}
              </div>

              {(() => {
                const day = itinerary.days![activeDay];
                return (
                  <div>
                    <div className="day-title">Day {day.day}: {day.title}</div>
                    <div className="time-grid">
                      <div className="time-card morning">
                        <div className="tc-label">Morning</div>
                        <div className="tc-value">{day.morning}</div>
                      </div>
                      <div className="time-card afternoon">
                        <div className="tc-label">Afternoon</div>
                        <div className="tc-value">{day.afternoon}</div>
                      </div>
                      <div className="time-card evening">
                        <div className="tc-label">Evening</div>
                        <div className="tc-value">{day.evening}</div>
                      </div>
                    </div>
                    <div className="meta-grid">
                      <div className="meta-card">
                        <div className="mc-label">Food</div>
                        <div className="mc-value">{day.food_recommendation}</div>
                      </div>
                      <div className="meta-card">
                        <div className="mc-label">Stay</div>
                        <div className="mc-value">{day.stay_suggestion}</div>
                      </div>
                      <div className="meta-card cost">
                        <div className="mc-label">Est. Cost</div>
                        <div className="mc-value">{day.estimated_day_cost}</div>
                      </div>
                    </div>
                    {day.notes && (
                      <div className="notes-box">
                        <div className="notes-label">Notes</div>
                        <div className="notes-value">{day.notes}</div>
                      </div>
                    )}


                    {/* Day Photo */}
 {/* Day Photo */}
{dayPhotoLoading ? (
  <div className="day-photo-loading">Loading photo...</div>
) :    dayPhotos.length > 0 ? (
  <div className="day-photo-section">
    {dayPhotos.map((url, i) => (
      <img
        key={i}
        src={url}
        alt={`Photo ${i + 1} of day ${day.day}`}
        onClick={() => setLightboxImg(url)}
      />
    ))}
  </div>
) : null}

                  {/* Map */}
<div className="day-map-section">
  {mapLoading ? (
    <div className="map-loading">Loading map...</div>
  ) : dayLocation ? (
    <iframe

  key={`${dayLocation.lat}-${dayLocation.lng}`}

      src={`https://www.openstreetmap.org/export/embed.html?bbox=${dayLocation.lng - 0.05},${dayLocation.lat - 0.05},${dayLocation.lng + 0.05},${dayLocation.lat + 0.05}&layer=mapnik&marker=${dayLocation.lat},${dayLocation.lng}`}
      style={{ width: "100%", height: "100%", border: "none" }}
      loading="lazy"
    />
  ) : (
    <div className="map-loading">Map unavailable</div>
  )}
</div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}