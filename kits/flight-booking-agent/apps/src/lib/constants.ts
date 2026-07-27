import { Suggestion } from "@/types";

export const SUGGESTIONS: Suggestion[] = [
  {
    label: "✈️ JFK → LHR",
    query: "Flights from JFK to LHR on July 20 for 2 people",
  },
  {
    label: "🌴 NYC → MIA",
    query: "Flights from New York to Miami on July 25 for 1 person",
  },
  {
    label: "🗽 JFK → LAX",
    query: "Flights from JFK to LAX on August 1 for 2 people",
  },
  {
    label: "🇯🇵 NYC → Tokyo",
    query: "Flights from New York to Tokyo on August 15 for 2 people",
  },
];

export const APP_CONFIG = {
  name: "FlightFinder",
  tagline: "Find budget-friendly flights in seconds",
  defaultCurrency: "ZAR",
  flightsPerPage: 10,
  minSearchLength: 3,
} as const;
