"use client";

import { motion } from "framer-motion";
import { formatPrice } from "@/lib/formatters";

interface FlightStatsProps {
  totalAvailable: number;
  showing: number;
  cheapestPrice: number | null;
  mostExpensive: number | null;
  currency: string;
  exchangeRate?: number;
  cabinClass?: string;
}

export const FlightStats = ({
  totalAvailable,
  showing,
  cheapestPrice,
  mostExpensive,
  currency,
  exchangeRate,
  cabinClass,
}: FlightStatsProps) => {
  if (totalAvailable === 0) return null;

  const getCabinDisplay = (cabin: string) => {
    const map: Record<string, string> = {
      economy: "Economy",
      premium_economy: "Premium Economy",
      business: "Business",
      first: "First Class",
    };
    return map[cabin] || cabin;
  };

  return (
    <motion.div
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700/30"
    >
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-400">Found</span>
        <span className="font-bold text-white">{totalAvailable}</span>
        <span className="text-slate-400">flights</span>
      </div>

      <div className="w-px h-6 bg-slate-700" />

      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-400">Showing</span>
        <span className="font-bold text-blue-400">{showing}</span>
        <span className="text-slate-400">results</span>
      </div>

      {cabinClass && cabinClass !== "economy" && (
        <>
          <div className="w-px h-6 bg-slate-700" />
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Cabin</span>
            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs border border-purple-500/20">
              {getCabinDisplay(cabinClass)}
            </span>
          </div>
        </>
      )}

      {cheapestPrice !== null &&
        cheapestPrice !== undefined &&
        mostExpensive !== null &&
        mostExpensive !== undefined && (
          <>
            <div className="w-px h-6 bg-slate-700" />
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400">Price Range</span>
              <span className="font-bold text-green-400">
                {formatPrice(cheapestPrice, currency)}
              </span>
              <span className="text-slate-500">—</span>
              <span className="font-bold text-red-400">
                {formatPrice(mostExpensive, currency)}
              </span>
            </div>
          </>
        )}

      {exchangeRate && (
        <>
          <div className="w-px h-6 bg-slate-700" />
          <div className="text-xs text-slate-500">
            Rate: 1 USD = {exchangeRate.toFixed(2)} {currency}
          </div>
        </>
      )}
    </motion.div>
  );
};
