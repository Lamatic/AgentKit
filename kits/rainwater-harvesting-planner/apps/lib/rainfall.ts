import type { DailyRain } from "./calc";

/**
 * Real rainfall data from Open-Meteo (free, no API key, non-commercial use).
 * - Geocoding API turns a city name into coordinates.
 * - Historical Weather API (ERA5 reanalysis) returns daily precipitation.
 */

export type Place = {
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
};

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive";
export const YEARS_OF_HISTORY = 5;

/**
 * Open-Meteo matches on the place name only, so "Ludhiana, Punjab" is split:
 * the first part is searched, and the rest (state / country) picks the best match.
 */
export async function geocodeCity(query: string): Promise<Place> {
  const [name, ...hints] = query.split(",").map((s) => s.trim()).filter(Boolean);
  if (!name) throw new Error("Please enter a city.");

  const url = `${GEOCODE_URL}?name=${encodeURIComponent(name)}&count=10&language=en&format=json`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`Location lookup failed (HTTP ${res.status}).`);
  const json = (await res.json()) as { results?: Place[] };
  const results = json.results ?? [];
  if (results.length === 0) {
    throw new Error(`Could not find "${name}". Check the spelling or try a nearby larger town.`);
  }

  if (hints.length === 0) return results[0];
  const lowerHints = hints.map((h) => h.toLowerCase());
  const matches = (p: Place) =>
    lowerHints.every((h) => [p.admin1, p.country].some((field) => field?.toLowerCase().includes(h)));
  return results.find(matches) ?? results[0];
}

/** Daily rainfall for the last N complete calendar years. */
export async function fetchDailyRain(lat: number, lon: number, years = YEARS_OF_HISTORY): Promise<DailyRain[]> {
  const lastYear = new Date().getUTCFullYear() - 1;
  const start = `${lastYear - years + 1}-01-01`;
  const end = `${lastYear}-12-31`;
  const url =
    `${ARCHIVE_URL}?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}` +
    `&start_date=${start}&end_date=${end}&daily=precipitation_sum&timezone=auto`;

  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`Rainfall data request failed (HTTP ${res.status}).`);
  const json = (await res.json()) as { daily?: { time: string[]; precipitation_sum: (number | null)[] } };
  const time = json.daily?.time ?? [];
  const mm = json.daily?.precipitation_sum ?? [];
  if (time.length === 0) throw new Error("No rainfall data returned for this location.");
  return time.map((date, i) => ({ date, mm: mm[i] }));
}
