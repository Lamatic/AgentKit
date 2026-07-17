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
    <div>
      <div>
        <div />
        <div />
        <div />
      </div>

      <Header
        bookingsCount={totalBookings}
        onBookingsClick={() => setShowHistory(!showHistory)}
      />

      <main>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div>
            <motion.h2
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Where to next?
              <span>Just tell me where you want to go</span>
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
              >
                <Loader2 />
                <p>Searching for the best deals...</p>
              </motion.div>
            )}

            {!loading && hasSearched && flights.length === 0 && !error && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <div>✈️</div>
                <h3>No flights found</h3>
                <p>Try different dates or destinations</p>
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
