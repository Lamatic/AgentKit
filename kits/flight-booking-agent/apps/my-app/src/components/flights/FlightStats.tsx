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
    <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
      <div>
        <span>Found</span>
        <span>{totalAvailable}</span>
        <span>flights</span>
      </div>

      <div />

      <div>
        <span>Showing</span>
        <span>{showing}</span>
        <span>results</span>
      </div>

      {cabinClass && cabinClass !== "economy" && (
        <>
          <div />
          <div>
            <span>Cabin</span>
            <span>{getCabinDisplay(cabinClass)}</span>
          </div>
        </>
      )}

      {cheapestPrice !== null &&
        cheapestPrice !== undefined &&
        mostExpensive !== null &&
        mostExpensive !== undefined && (
          <>
            <div />
            <div>
              <span>Price Range</span>
              <span>{formatPrice(cheapestPrice, currency)}</span>
              <span>—</span>
              <span>{formatPrice(mostExpensive, currency)}</span>
            </div>
          </>
        )}

      {exchangeRate && (
        <>
          <div />
          <div>
            Rate: 1 USD = {exchangeRate.toFixed(2)} {currency}
          </div>
        </>
      )}
    </motion.div>
  );
};
