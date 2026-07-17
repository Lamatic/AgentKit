"use client";

import { Booking } from "@/types";
import { X } from "lucide-react";
import { formatDateFull, formatPrice } from "@/lib/formatters";

interface BookingHistoryProps {
  bookings: Booking[];
  onClose: () => void;
  onCancel: (bookingId: string) => void;
}

export const BookingHistory = ({
  bookings,
  onClose,
  onCancel,
}: BookingHistoryProps) => {
  return (
    <div>
      <div>
        <h3>Your Bookings</h3>
        <button onClick={onClose}>
          <X />
        </button>
      </div>

      {bookings.length === 0 ? (
        <p>No bookings yet. Start searching and book your first flight!</p>
      ) : (
        <div>
          {bookings.map((booking) => {
            const displayPrice = booking.flight.isConverted
              ? booking.flight.price
              : booking.flight.originalPrice || booking.flight.price;
            const displayCurrency = booking.flight.isConverted
              ? booking.flight.currency
              : booking.flight.originalCurrency || "ZAR";

            return (
              <div key={booking.id}>
                <div>
                  <div>
                    <div>
                      <span>{booking.flight.airline}</span>
                      <span>•</span>
                      <span>{booking.flight.flightNumber}</span>
                      {booking.status === "confirmed" && (
                        <span>✓ Confirmed</span>
                      )}
                      {booking.status === "cancelled" && <span>Cancelled</span>}
                    </div>
                    <div>
                      {booking.flight.departureAirport} →{" "}
                      {booking.flight.arrivalAirport}
                    </div>
                    <div>{formatDateFull(booking.flight.departureTime)}</div>
                    <div>
                      Ref: {booking.bookingReference} • {booking.passengerName}
                    </div>
                  </div>
                  <div>
                    <div>{formatPrice(displayPrice, displayCurrency)}</div>
                    {booking.status === "confirmed" && (
                      <button onClick={() => onCancel(booking.id)}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
