"use client";

import { useState, useEffect } from "react";
import { Flight } from "@/types";
import { FlightCard } from "./FlightCard";
import { FlightStats } from "./FlightStats";
import { Pagination } from "@/components/ui/Pagination";
import { APP_CONFIG } from "@/lib/constants";
import { motion } from "motion/react";

interface FlightResultsProps {
  flights: Flight[];
  totalAvailable: number;
  cheapestPrice: number | null;
  mostExpensive: number | null;
  currency: string;
  exchangeRate?: number;
  cabinClass?: string;
  onBook: (flight: Flight) => void;
}

export const FlightResults = ({
  flights,
  totalAvailable,
  cheapestPrice,
  mostExpensive,
  currency,
  exchangeRate,
  cabinClass,
  onBook,
}: FlightResultsProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = APP_CONFIG.flightsPerPage;
  const totalPages = Math.ceil(flights.length / perPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [flights]);

  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;
  const currentFlights = flights.slice(startIndex, endIndex);

  if (flights.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-8"
    >
      <FlightStats
        totalAvailable={totalAvailable}
        showing={currentFlights.length}
        cheapestPrice={cheapestPrice}
        mostExpensive={mostExpensive}
        currency={currency}
        exchangeRate={exchangeRate}
        cabinClass={cabinClass}
      />

      <div className="space-y-4">
        {currentFlights.map((flight, index) => (
          <FlightCard
            key={flight.offerId || index}
            flight={flight}
            index={index}
            displayCurrency={currency}
            onBook={onBook}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </motion.div>
  );
};
