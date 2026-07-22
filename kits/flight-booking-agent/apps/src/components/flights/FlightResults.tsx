"use client";

import { useState, useEffect } from "react";
import { Flight } from "@/types";
import { FlightCard } from "./FlightCard";
import { FlightStats } from "./FlightStats";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from "@/components/ui/pagination";
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push(0); // 0 represents ellipsis
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push(0);
      pages.push(totalPages);
    }
    return pages;
  };

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
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                aria-disabled={currentPage === 1}
                className={
                  currentPage === 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>

            {getPageNumbers().map((page, index) => {
              if (page === 0) {
                return (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <span className="px-2 text-muted-foreground">…</span>
                  </PaginationItem>
                );
              }
              return (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => handlePageChange(page)}
                    isActive={page === currentPage}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  handlePageChange(Math.min(totalPages, currentPage + 1))
                }
                aria-disabled={currentPage === totalPages}
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </motion.div>
  );
};
