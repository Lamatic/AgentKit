export type WeatherSummary = {
  source: "forecast" | "climate-average";
  tempMinC: number;
  tempMaxC: number;
  precipitationChance: number; // 0-100
  conditions: string;
};

async function geocode(destination: string) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", destination);
  url.searchParams.set("count", "1");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);
  const data = await res.json();

  const match = data?.results?.[0];
  if (!match) throw new Error(`Could not find location "${destination}"`);

  return {
    latitude: match.latitude as number,
    longitude: match.longitude as number,
    resolvedName: `${match.name}${match.country ? ", " + match.country : ""}` as string,
  };
}

const DAILY_FORECAST_LIMIT_DAYS = 16;

export async function getWeatherSummary(
  destination: string,
  startDate: string,
  endDate: string
): Promise<WeatherSummary & { resolvedName: string }> {
  const { latitude, longitude, resolvedName } = await geocode(destination);

  const daysOut = Math.ceil(
    (new Date(startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (daysOut <= DAILY_FORECAST_LIMIT_DAYS) {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(latitude));
    url.searchParams.set("longitude", String(longitude));
    url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_probability_max");
    url.searchParams.set("start_date", startDate);
    url.searchParams.set("end_date", endDate);
    url.searchParams.set("timezone", "auto");

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Forecast lookup failed: ${res.status}`);
    const data = await res.json();

    const maxes: number[] = data?.daily?.temperature_2m_max ?? [];
    const mins: number[] = data?.daily?.temperature_2m_min ?? [];
    const precip: number[] = data?.daily?.precipitation_probability_max ?? [];

    return {
      source: "forecast",
      tempMinC: Math.round(Math.min(...mins)),
      tempMaxC: Math.round(Math.max(...maxes)),
      precipitationChance: Math.round(Math.max(...precip, 0)),
      conditions: summarizeConditions(Math.min(...mins), Math.max(...maxes), Math.max(...precip, 0)),
      resolvedName,
    };
  }

  // Beyond forecast range: use historical climate average for that month.
  const month = new Date(startDate).getMonth() + 1;
  const url = new URL("https://climate-api.open-meteo.com/v1/climate");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("start_date", "2015-01-01");
  url.searchParams.set("end_date", "2024-12-31");
  url.searchParams.set("models", "MRI_AGCM3_2_S");
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum");

  try {
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error("climate lookup failed");
    const data = await res.json();

    const dates: string[] = data?.daily?.time ?? [];
    const maxes: number[] = data?.daily?.temperature_2m_max ?? [];
    const mins: number[] = data?.daily?.temperature_2m_min ?? [];
    const precip: number[] = data?.daily?.precipitation_sum ?? [];

    const idxForMonth = dates
      .map((d, i) => ({ d, i }))
      .filter(({ d }) => new Date(d).getMonth() + 1 === month)
      .map(({ i }) => i);

    const monthMax = idxForMonth.map((i) => maxes[i]).filter((n) => Number.isFinite(n));
    const monthMin = idxForMonth.map((i) => mins[i]).filter((n) => Number.isFinite(n));
    const monthPrecip = idxForMonth.map((i) => precip[i]).filter((n) => Number.isFinite(n));

    const avgMax = average(monthMax);
    const avgMin = average(monthMin);
    const rainyDayShare =
      (monthPrecip.filter((p) => p > 1).length / Math.max(monthPrecip.length, 1)) * 100;

    return {
      source: "climate-average",
      tempMinC: Math.round(avgMin),
      tempMaxC: Math.round(avgMax),
      precipitationChance: Math.round(rainyDayShare),
      conditions: summarizeConditions(avgMin, avgMax, rainyDayShare),
      resolvedName,
    };
  } catch {
    // Last-resort fallback so the flow never hard-fails on weather data.
    return {
      source: "climate-average",
      tempMinC: 10,
      tempMaxC: 20,
      precipitationChance: 30,
      conditions: "Typical seasonal weather (climate data unavailable — pack flexibly)",
      resolvedName,
    };
  }
}

function average(nums: number[]) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function summarizeConditions(min: number, max: number, precipChance: number) {
  const tempWord = max >= 28 ? "hot" : max >= 18 ? "mild" : max >= 8 ? "cool" : "cold";
  const rainWord = precipChance >= 60 ? "wet" : precipChance >= 30 ? "showery" : "mostly dry";
  return `${tempWord}, ${rainWord} (${Math.round(min)}–${Math.round(max)}°C, ${Math.round(precipChance)}% precip chance)`;
}
