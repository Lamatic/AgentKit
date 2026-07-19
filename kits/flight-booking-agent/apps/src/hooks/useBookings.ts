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
   * Adds a new booking to the list
   * @param flight - The flight to book
   * @param passengerName - Full name of the passenger
   * @param passengerEmail - Email of the passenger
   * @returns The created booking object
   */

  const addBooking = useCallback(
    (flight: Flight, passengerName: string, passengerEmail: string) => {
      const newBooking: Booking = {
        id: generateBookingId(),
        flight,
        bookingReference: generateBookingRef(),
        passengerName: passengerName.trim(),
        passengerEmail: passengerEmail.trim(),
        bookedAt: new Date().toISOString(),
        status: "confirmed",
      };

      setBookings((prev) => [newBooking, ...prev]);
      return newBooking;
    },
    [setBookings],
  );

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

  return {
    bookings,
    addBooking,
    cancelBooking,
    totalBookings: bookings.length,
    confirmedBookings: bookings.filter((b) => b.status === "confirmed").length,
  };
}
