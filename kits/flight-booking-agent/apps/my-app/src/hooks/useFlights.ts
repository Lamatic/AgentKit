"use client";

import { useState, useCallback } from "react";
import { Flight } from "@/types";

export function useFlights() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [cheapestPrice, setCheapestPrice] = useState<number | null>(null);
  const [mostExpensive, setMostExpensive] = useState<number | null>(null);
  const [currency, setCurrency] = useState<string>("ZAR");
  const [exchangeRate, setExchangeRate] = useState<number | undefined>(
    undefined,
  );
  const [cabinClass, setCabinClass] = useState<string>("economy");
  const [hasSearched, setHasSearched] = useState(false);
  const [searchParams, setSearchParams] = useState<any>(null);

  const searchFlights = useCallback(async (query: string) => {
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setHasSearched(true);

    try {
      const response = await fetch("/api/flights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`,
        );
      }

      const data = await response.json();

      if (data.status === "vague_request") {
        setError(
          data.message || "Please provide more details about your flight.",
        );
        setFlights([]);
        setTotalAvailable(0);
        setTotalResults(0);
        setCheapestPrice(null);
        setMostExpensive(null);
        setLoading(false);
        return;
      }

      if (
        data.status === "success" &&
        data.flights &&
        data.flights.length > 0
      ) {
        setFlights(data.flights);
        setTotalAvailable(data.totalAvailable || 0);
        setTotalResults(data.totalResults || 0);

        setCheapestPrice(data.cheapestPrice || data.flights[0]?.price || null);
        setMostExpensive(
          data.mostExpensive ||
            data.flights[data.flights.length - 1]?.price ||
            null,
        );

        const apiCurrency =
          data.displayCurrency ||
          data.currency ||
          data.flights[0]?.currency ||
          "ZAR";
        setCurrency(apiCurrency);

        setExchangeRate(data.exchangeRate);

        setCabinClass(
          data.cabinClass || data.flights[0]?.cabinClass || "economy",
        );

        setSearchParams(data.searchParams);

        return data;
      } else {
        setError(
          data.message ||
            "No flights found. Try different dates or destinations.",
        );
        setFlights([]);
        setTotalAvailable(0);
        setTotalResults(0);
        setCheapestPrice(null);
        setMostExpensive(null);
        setCabinClass("economy");

        return null;
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setFlights([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setFlights([]);
    setError("");
    setHasSearched(false);
    setTotalAvailable(0);
    setTotalResults(0);
    setCheapestPrice(null);
    setMostExpensive(null);
    setSearchParams(null);
    setExchangeRate(undefined);
    setCabinClass("economy");
  }, []);

  const clearError = useCallback(() => {
    setError("");
  }, []);

  return {
    flights,
    loading,
    error,
    totalAvailable,
    totalResults,
    cheapestPrice,
    mostExpensive,
    currency,
    exchangeRate,
    cabinClass,
    hasSearched,
    searchParams,

    searchFlights,
    reset,
    clearError,

    hasResults: flights.length > 0,
  };
}
