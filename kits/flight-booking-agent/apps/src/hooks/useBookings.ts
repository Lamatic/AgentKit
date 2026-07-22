"use client";

import { useCallback } from "react";
import { Booking, Flight } from "@/types";
import { useLocalStorage } from "./useLocalStorage";
import { generateBookingRef, generateBookingId } from "@/lib/generators";

/**
 * Custom hook for managing flight bookings with localStorage persistence
 * @returns Booking management functions and state
 */
export function useBookings() {
  const [bookings, setBookings] = useLocalStorage<Booking[]>(
    "flight_bookings",
    [],
  );

  /**
   * Adds a new booking to the list (demo only, no real booking)
   * @param flight - The flight to book
   * @param passengerName - Full name of the passenger
   * @returns The created booking object
   */
  const addBooking = useCallback(
    (flight: Flight, passengerName: string) => {
      const newBooking: Booking = {
        id: generateBookingId(),
        flight,
        bookingReference: generateBookingRef(),
        passengerName: passengerName.trim(),
        bookedAt: new Date().toISOString(),
        status: "demo",
      };

      setBookings((prev) => [newBooking, ...prev]);
      return newBooking;
    },
    [setBookings],
  );

  /**
   * Cancels a booking by ID (marks as cancelled)
   * @param bookingId - ID of the booking to cancel
   */
  const cancelBooking = useCallback(
    (bookingId: string) => {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "cancelled" as const } : b,
        ),
      );
    },
    [setBookings],
  );

  /**
   * Permanently removes a booking from the list
   * @param bookingId - ID of the booking to remove
   */
  const removeBooking = useCallback(
    (bookingId: string) => {
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    },
    [setBookings],
  );

  return {
    bookings,
    addBooking,
    cancelBooking,
    removeBooking,
    totalBookings: bookings.length,
    confirmedBookings: bookings.filter((b) => b.status === "demo").length,
  };
}
