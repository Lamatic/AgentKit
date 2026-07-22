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
    <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/30 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
          Your Bookings
        </h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors"
          aria-label="Close booking history"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {bookings.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-8">
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
                    ? "bg-red-500/5 border-red-500/20 opacity-60"
                    : booking.status === "demo"
                      ? "bg-blue-500/5 border-blue-500/20"
                      : "bg-slate-700/30 border-slate-600/30"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white">
                        {booking.flight.airline}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-sm text-slate-300">
                        {booking.flight.flightNumber}
                      </span>

                      {booking.status === "demo" && (
                        <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
                          Demo Saved
                        </span>
                      )}
                      {booking.status === "cancelled" && (
                        <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">
                          Removed
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-300">
                      {booking.flight.departureAirport} →{" "}
                      {booking.flight.arrivalAirport}
                    </div>
                    <div className="text-xs text-slate-400">
                      {formatDateFull(booking.flight.departureTime)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Ref: {booking.bookingReference} • {booking.passengerName}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-lg font-bold text-blue-400">
                      {formatPrice(displayPrice, displayCurrency)}
                    </div>
                    {/* ✅ Remove button for demo bookings */}
                    {booking.status === "demo" && (
                      <button
                        onClick={() => onCancel(booking.id)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
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
