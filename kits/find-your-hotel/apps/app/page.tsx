"use client";

import { useState, useEffect } from "react";
import HotelForm from "@/components/HotelForm";
import HotelResults from "@/components/HotelResults";
import type { HotelSearchRequest, HotelSearchResponse } from "@/lib/hotel-client";

const STORAGE_KEY = "find-your-hotel-state";

function loadState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveState(data: { hotelResult: HotelSearchResponse | null }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export default function Home() {
  const saved = loadState();

  const [hotelResult, setHotelResult] = useState<HotelSearchResponse | null>(saved?.hotelResult ?? null);
  const [hotelLoading, setHotelLoading] = useState(false);
  const [hotelError, setHotelError] = useState<string | null>(null);

  useEffect(() => {
    saveState({ hotelResult });
  }, [hotelResult]);

  async function handleHotelSubmit(values: HotelSearchRequest) {
    setHotelLoading(true);
    setHotelError(null);
    setHotelResult(null);
    try {
      const res = await fetch("/api/hotels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setHotelResult(data);
    } catch (err) {
      setHotelError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setHotelLoading(false);
    }
  }

  function clearResults() {
    setHotelResult(null);
    setHotelError(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <main className="max-w-4xl mx-auto px-5 py-12 md:py-16">
      <header className="mb-8">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-pine/60">
          Lamatic AgentKit
        </span>
        <h1 className="font-display font-extrabold text-4xl md:text-5xl text-ink mt-2">
          Find Your Hotel
        </h1>
        <p className="font-body text-ink/60 mt-3 max-w-xl">
          Honest, AI-estimated hotel suggestions for your trip — with a
          confidence label, a real phone number only when we're sure of one,
          and a map link for every result.
        </p>
      </header>

      <HotelForm onSubmit={handleHotelSubmit} loading={hotelLoading} />

      {hotelError && (
        <p className="mt-6 font-mono text-sm text-stamp border border-stamp/30 bg-stamp/5 rounded-lg px-4 py-3">
          {hotelError}
        </p>
      )}

      {hotelResult && (
        <div className="mt-10 space-y-8">
          <div className="flex items-center justify-between">
            <HotelResults data={hotelResult} />
            <button
              onClick={clearResults}
              className="ml-4 shrink-0 font-mono text-xs uppercase tracking-wide text-stamp/70 hover:text-stamp border border-stamp/20 rounded-lg px-3 py-2 hover:bg-stamp/5 transition-colors"
            >
              Clear results
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
