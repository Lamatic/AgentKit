"use client";

import { useState } from "react";
import type { HotelSearchRequest } from "@/lib/hotel-client";

const CURRENCIES = [
  { code: "INR", label: "₹ INR — Indian Rupee" },
  { code: "USD", label: "$ USD — US Dollar" },
  { code: "EUR", label: "€ EUR — Euro" },
  { code: "GBP", label: "£ GBP — British Pound" },
  { code: "JPY", label: "¥ JPY — Japanese Yen" },
  { code: "AUD", label: "A$ AUD — Australian Dollar" },
  { code: "CAD", label: "C$ CAD — Canadian Dollar" },
  { code: "SGD", label: "S$ SGD — Singapore Dollar" },
  { code: "AED", label: "د.إ AED — UAE Dirham" },
  { code: "THB", label: "฿ THB — Thai Baht" },
];

const inputClass =
  "mt-1 w-full bg-transparent border-b-2 border-ink/20 focus:border-pine outline-none py-2 font-display text-lg";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function validateDates(checkIn: string, checkOut: string): string | null {
  if (!checkIn || !checkOut) return null;
  const today = todayStr();
  if (checkIn < today) return "Check-in date must be today or in the future.";
  if (checkOut < today) return "Check-out date must be today or in the future.";
  if (checkIn === checkOut) return "Check-in and check-out cannot be the same date.";
  if (checkOut < checkIn) return "Check-out must be after check-in.";
  return null;
}

export default function HotelForm({
  onSubmit,
  loading,
}: {
  onSubmit: (values: HotelSearchRequest) => void;
  loading: boolean;
}) {
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState("2");
  const [rooms, setRooms] = useState("1");
  const [currency, setCurrency] = useState("INR");
  const [dateError, setDateError] = useState<string | null>(null);

  function handleCheckInChange(val: string) {
    setCheckIn(val);
    setDateError(validateDates(val, checkOut));
  }

  function handleCheckOutChange(val: string) {
    setCheckOut(val);
    setDateError(validateDates(checkIn, val));
  }

  const isValid = city.trim() && country.trim() && checkIn && checkOut && !dateError;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const err = validateDates(checkIn, checkOut);
        if (err) { setDateError(err); return; }
        onSubmit({ city, country, checkIn, checkOut, adults, rooms, currency, radius: "10" });
      }}
      className="perforated bg-white/60 border border-ink/10 rounded-xl p-6 md:p-8 shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-pine/70">
          Stay Search
        </span>
        <div className="barcode w-24 text-ink" />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <label className="block">
          <span className="font-mono text-xs uppercase tracking-wide text-ink/60">Location</span>
          <input
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter your Location"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="font-mono text-xs uppercase tracking-wide text-ink/60">Country</span>
          <input
            required
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="India"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="font-mono text-xs uppercase tracking-wide text-ink/60">Check-in</span>
          <input
            required
            type="date"
            value={checkIn}
            min={todayStr()}
            onChange={(e) => handleCheckInChange(e.target.value)}
            className={`${inputClass} date-picker`}
          />
        </label>

        <label className="block">
          <span className="font-mono text-xs uppercase tracking-wide text-ink/60">Check-out</span>
          <input
            required
            type="date"
            value={checkOut}
            min={checkIn || todayStr()}
            onChange={(e) => handleCheckOutChange(e.target.value)}
            className={`${inputClass} date-picker`}
          />
        </label>

        <label className="block">
          <span className="font-mono text-xs uppercase tracking-wide text-ink/60">Adults</span>
          <input
            type="number"
            min={1}
            value={adults}
            onChange={(e) => setAdults(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="font-mono text-xs uppercase tracking-wide text-ink/60">Rooms</span>
          <input
            type="number"
            min={1}
            value={rooms}
            onChange={(e) => setRooms(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="block md:col-span-2">
          <span className="font-mono text-xs uppercase tracking-wide text-ink/60">Currency</span>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className={`${inputClass} cursor-pointer`}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {dateError && (
        <p className="mt-4 font-mono text-sm text-stamp border border-stamp/30 bg-stamp/5 rounded-lg px-4 py-3">
          {dateError}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !isValid}
        className="mt-8 w-full bg-marigold text-ink font-display font-semibold text-lg py-3 rounded-lg hover:bg-marigold/90 disabled:opacity-50 transition-colors"
      >
        {loading ? "Searching…" : "Find hotels"}
      </button>
    </form>
  );
}
