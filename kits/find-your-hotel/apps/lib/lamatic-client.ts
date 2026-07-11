import { Lamatic } from "lamatic";
import type { WeatherSummary } from "./weather";

const endpoint = process.env.LAMATIC_PROJECT_ENDPOINT;
const projectId = process.env.LAMATIC_PROJECT_ID;
const apiKey = process.env.LAMATIC_PROJECT_API_KEY;

export const lamaticClient =
  endpoint && projectId && apiKey
    ? new Lamatic({ endpoint, projectId, apiKey })
    : null;

export const LAMATIC_FLOW_ID = process.env.LAMATIC_FLOW_ID ?? "";
export const LAMATIC_AGENT_ID = process.env.LAMATIC_AGENT_ID ?? "";

export type Traveler = { name: string; tag: "adult" | "child" };

export type PackingListRequest = {
  destination: string;
  startDate: string;
  endDate: string;
  tripType: string;
  travelers: Traveler[];
  weather: WeatherSummary & { resolvedName: string };
};

export type PackingItem = { id: string; label: string; category: string };

export type PackingListResponse = {
  sharedItems: PackingItem[];
  travelers: { name: string; items: PackingItem[] }[];
  notes: string[];
};

/**
 * Calls the "travel-packing-list-generator" flow deployed on Lamatic.
 * Falls back to a deterministic local mock when no credentials are
 * configured, so the UI can be reviewed without a Lamatic account.
 */
export async function generatePackingList(
  input: PackingListRequest
): Promise<PackingListResponse> {
  if (!lamaticClient || !LAMATIC_FLOW_ID) {
    return mockPackingList(input);
  }

  const response = await lamaticClient.executeFlow(LAMATIC_FLOW_ID, input);

  if (response.status === "error") {
    throw new Error(response.message || "Lamatic packing list flow failed");
  }

  const output = response.result;

  if (!output) {
    throw new Error("Lamatic flow returned no output");
  }

  return (typeof output === "string" ? JSON.parse(output) : output) as PackingListResponse;
}

function mockPackingList(input: PackingListRequest): PackingListResponse {
  const { weather, tripType, travelers } = input;
  const days = Math.max(
    1,
    Math.ceil(
      (new Date(input.endDate).getTime() - new Date(input.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1
  );

  const sharedItems: PackingItem[] = [
    { id: "shared-docs", label: "Passport, tickets & documents folder", category: "documents" },
    { id: "shared-charger", label: "Universal power adapter + charging cables", category: "electronics" },
    { id: "shared-first-aid", label: "Small first-aid kit", category: "health" },
  ];

  if (weather.precipitationChance >= 30) {
    sharedItems.push({ id: "shared-rain", label: "Compact travel umbrella", category: "gear" });
  }

  if (tripType === "hiking" || tripType === "winter-sports") {
    sharedItems.push({ id: "shared-map", label: "Offline maps / trail app downloaded", category: "gear" });
  }

  const clothingSets = Math.min(days, 6);

  const travelerResults = travelers.map((t, idx) => {
    const items: PackingItem[] = [
      { id: `${idx}-shirts`, label: `${clothingSets}x tops`, category: "clothing" },
      { id: `${idx}-bottoms`, label: `${Math.max(2, Math.ceil(clothingSets / 2))}x bottoms`, category: "clothing" },
      { id: `${idx}-underwear`, label: `${days}x underwear & socks`, category: "clothing" },
      { id: `${idx}-toiletries`, label: "Toiletry bag (travel-size)", category: "toiletries" },
    ];

    if (weather.tempMinC <= 12) {
      items.push({ id: `${idx}-layer`, label: "Warm layer / jacket", category: "clothing" });
    }
    if (weather.tempMaxC >= 26) {
      items.push({ id: `${idx}-sun`, label: "Sunscreen & sunglasses", category: "health" });
    }
    if (tripType === "beach") {
      items.push({ id: `${idx}-swim`, label: "Swimsuit", category: "clothing" });
    }
    if (tripType === "hiking") {
      items.push({ id: `${idx}-boots`, label: "Hiking boots", category: "gear" });
    }
    if (tripType === "winter-sports") {
      items.push({ id: `${idx}-thermal`, label: "Thermal base layers", category: "clothing" });
    }
    if (tripType === "business") {
      items.push({ id: `${idx}-formal`, label: "Business outfit", category: "clothing" });
    }
    if (t.tag === "child") {
      items.push({ id: `${idx}-entertainment`, label: "Travel entertainment (books/tablet)", category: "gear" });
    }

    return { name: t.name, items };
  });

  const notes = [
    `${weather.resolvedName}: expect ${weather.conditions} during your trip.`,
  ];
  if (weather.source === "climate-average") {
    notes.push("Dates are far enough out that this uses historical climate averages, not a live forecast — recheck closer to departure.");
  }

  return { sharedItems, travelers: travelerResults, notes };
}
