import { lamaticClient, LAMATIC_FLOW_ID, LAMATIC_AGENT_ID } from "./lamatic-client";

export type HotelSearchRequest = {
  city: string;
  country: string;
  checkIn: string;
  checkOut: string;
  adults: string;
  rooms: string;
  currency: string;
  radius: string;
};

export type Hotel = {
  name: string;
  areaDescription: string;
  approxPricePerNight: number;
  priceConfidence: "low" | "medium";
  phoneNumber: string;
  googleMapsUrl: string;
};

export type HotelSearchResponse = {
  dataSource: string;
  disclaimer: string;
  city: string;
  country: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  rooms: number;
  currency: string;
  hotels: Hotel[];
};

/**
 * Calls the "find-your-hotel" flow deployed on Lamatic. Falls back to a
 * deterministic local mock when no credentials are configured, so the UI
 * can be reviewed without a Lamatic account.
 */
export async function findHotels(
  input: HotelSearchRequest
): Promise<HotelSearchResponse> {
  if (!lamaticClient || !LAMATIC_FLOW_ID) {
    return mockHotelSearch(input);
  }

  const response = await lamaticClient.executeFlow(LAMATIC_FLOW_ID, input);

  if (response.status === "error") {
    throw new Error(response.message || "Lamatic hotel flow failed");
  }

  const output = response.result;

  if (!output) throw new Error("Lamatic hotel flow returned no output");

  return (typeof output === "string" ? JSON.parse(output) : output) as HotelSearchResponse;
}

function toMapsUrl(name: string, area: string, city: string, country: string) {
  const query = `${name}, ${area}, ${city}, ${country}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function mockHotelSearch(input: HotelSearchRequest): HotelSearchResponse {
  const adults = Math.max(1, parseInt(input.adults, 10) || 1);
  const rooms = Math.max(1, parseInt(input.rooms, 10) || 1);
  const currency = input.currency || "INR";

  const base = [
    { name: `${input.city} Central Hotel`, area: "City Center", price: 60 },
    { name: `${input.city} Comfort Inn`, area: "Downtown", price: 80 },
    { name: `${input.city} Garden Suites`, area: "Riverside", price: 110 },
    { name: `${input.city} Business Hotel`, area: "Business District", price: 140 },
    { name: `${input.city} Grand Plaza`, area: "Uptown", price: 190 },
  ];

  const hotels: Hotel[] = base.map((h) => ({
    name: h.name,
    areaDescription: h.area,
    approxPricePerNight: h.price,
    priceConfidence: "low",
    phoneNumber: "Not available",
    googleMapsUrl: toMapsUrl(h.name, h.area, input.city, input.country),
  }));

  return {
    dataSource: "ai-estimate",
    disclaimer:
      "This is a local mock response (no Lamatic credentials configured) — not live availability.",
    city: input.city,
    country: input.country,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    adults,
    rooms,
    currency,
    hotels,
  };
}
