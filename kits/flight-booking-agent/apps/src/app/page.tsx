"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SearchForm } from "@/components/flights/SearchForm";
import { Suggestions } from "@/components/flights/Suggestions";
import { FlightResults } from "@/components/flights/FlightResults";
import { BookingModal } from "@/components/booking/BookingModal";
import { BookingHistory } from "@/components/booking/BookingHistory";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

import { useFlights } from "@/hooks/useFlights";
import { useBookings } from "@/hooks/useBookings";

import { SUGGESTIONS } from "@/lib/constants";

import { Flight, Booking } from "@/types";

export default function Home() {
  const [query, setQuery] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);

  const {
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
    searchFlights,
    clearError,
  } = useFlights();

  const { bookings, addBooking, cancelBooking, totalBookings } = useBookings();

  const openBookingModal = (flight: Flight) => {
    setSelectedFlight(flight);
    setBookingModalOpen(true);
  };

  const closeBookingModal = () => {
    setBookingModalOpen(false);
    setSelectedFlight(null);
  };

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    searchFlights(searchQuery);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    searchFlights(suggestion);
  };

  const handleBookingConfirm = async (
    flight: Flight,
    name: string,
    email: string,
  ): Promise<Booking | null> => {
    return addBooking(flight, name, email);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <Header
        bookingsCount={totalBookings}
        onBookingsClick={() => setShowHistory(!showHistory)}
      />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-3xl mx-auto"
        >
          <div className="text-center mb-8">
            <motion.h2
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-3xl sm:text-4xl font-bold mb-3"
            >
              Where to next?
              <span className="block text-slate-400 text-lg sm:text-xl font-normal mt-2">
                Just tell me where you want to go
              </span>
            </motion.h2>
          </div>

          <SearchForm
            onSearch={handleSearch}
            loading={loading}
            initialQuery={query}
            externalQuery={query}
          />

          <Suggestions
            suggestions={SUGGESTIONS}
            onSelect={handleSuggestionClick}
          />

          <ErrorAlert message={error} onDismiss={clearError} />

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-8 overflow-hidden"
              >
                <BookingHistory
                  bookings={bookings}
                  onClose={() => setShowHistory(false)}
                  onCancel={cancelBooking}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
                <p className="mt-4 text-slate-400 text-sm">
                  Searching for the best deals...
                </p>
              </motion.div>
            )}

            {!loading && hasSearched && flights.length === 0 && !error && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-20"
              >
                <div className="text-6xl mb-4">✈️</div>
                <h3 className="text-xl font-medium text-slate-300">
                  No flights found
                </h3>
                <p className="text-slate-500 text-sm mt-2">
                  Try different dates or destinations
                </p>
              </motion.div>
            )}

            {!loading && flights.length > 0 && (
              <FlightResults
                flights={flights}
                totalAvailable={totalAvailable}
                cheapestPrice={cheapestPrice}
                mostExpensive={mostExpensive}
                currency={currency}
                exchangeRate={exchangeRate}
                cabinClass={cabinClass}
                onBook={openBookingModal}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      <Footer bookingsCount={totalBookings} />

      <BookingModal
        isOpen={bookingModalOpen}
        flight={selectedFlight}
        onClose={closeBookingModal}
        onConfirm={handleBookingConfirm}
      />
    </div>
  );
}
