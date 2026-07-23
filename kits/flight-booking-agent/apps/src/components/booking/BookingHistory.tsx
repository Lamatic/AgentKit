"use client";

import { Booking } from "@/types";
import { X } from "lucide-react";
import { formatDateFull, formatPrice } from "@/lib/formatters";

interface BookingHistoryProps {
  bookings: Booking[];
  onClose: () => void;
  onRemove: (bookingId: string) => void;
}

export const BookingHistory = ({
  bookings,
  onClose,
  onRemove,
}: BookingHistoryProps) => {
  return (
    <div className="bg-card/40 backdrop-blur-sm border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          Your Bookings
        </h3>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close booking history"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {bookings.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          No bookings yet. Start searching and book your first flight!
        </p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {bookings.map((booking) => {
            const displayPrice =
              booking.flight.price || booking.flight.originalPrice || 0;
            const displayCurrency = booking.flight.currency || "ZAR";

            return (
              <div
                key={booking.id}
                className={`p-4 rounded-xl border ${
                  booking.status === "cancelled"
                    ? "bg-destructive/5 border-destructive/20 opacity-60"
                    : booking.status === "demo"
                      ? "bg-primary/5 border-primary/20"
                      : "bg-muted/30 border-border"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">
                        {booking.flight.airline}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-sm text-foreground/80">
                        {booking.flight.flightNumber}
                      </span>

                      {booking.status === "demo" && (
                        <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                          Demo Saved
                        </span>
                      )}
                      {booking.status === "cancelled" && (
                        <span className="text-xs px-2 py-0.5 bg-destructive/20 text-destructive rounded-full">
                          Removed
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-foreground/80">
                      {booking.flight.departureAirport} →{" "}
                      {booking.flight.arrivalAirport}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateFull(booking.flight.departureTime)}
                    </div>
                    <div className="text-xs text-muted-foreground/70 mt-1">
                      Ref: {booking.bookingReference} • {booking.passengerName}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-lg font-bold text-primary">
                      {formatPrice(displayPrice, displayCurrency)}
                    </div>
                    {booking.status === "demo" && (
                      <button
                        onClick={() => onRemove(booking.id)}
                        className="text-xs text-destructive hover:text-destructive/80 transition-colors"
                      >
                        Remove
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
