"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle } from "lucide-react";
import { Flight, Booking } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatDateFull, formatPrice } from "@/lib/formatters";

interface BookingModalProps {
  isOpen: boolean;
  flight: Flight | null;
  onClose: () => void;
  onConfirm: (
    flight: Flight,
    name: string,
    email: string,
  ) => Promise<Booking | null>;
}

export const BookingModal = ({
  isOpen,
  flight,
  onClose,
  onConfirm,
}: BookingModalProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "confirmed">(
    "idle",
  );
  const [bookingRef, setBookingRef] = useState("");

  const handleConfirm = async () => {
    if (!flight || !name.trim() || !email.trim()) return;

    setStatus("loading");
    const booking = await onConfirm(flight, name, email);

    if (booking) {
      setBookingRef(booking.bookingReference);
      setStatus("confirmed");
      setTimeout(() => {
        onClose();
        setStatus("idle");
        setName("");
        setEmail("");
        setBookingRef("");
      }, 3000);
    } else {
      setStatus("idle");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && flight && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl"
          >
            {status === "confirmed" ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Booking Confirmed! 🎉
                </h3>
                <p className="text-slate-400 text-sm mt-2">
                  Your flight has been booked successfully.
                </p>
                <div className="mt-4 p-4 bg-slate-700/50 rounded-xl">
                  <p className="text-sm text-slate-300">Booking Reference</p>
                  <p className="text-xl font-mono font-bold text-blue-400">
                    {bookingRef}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">Book Flight</h3>
                  <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-4 p-3 bg-slate-700/30 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">
                      {flight.airline}
                    </span>
                    <span className="text-slate-400 text-sm">
                      {flight.flightNumber}
                    </span>
                  </div>
                  <div className="text-sm text-slate-300">
                    {flight.departureAirport} → {flight.arrivalAirport}
                  </div>
                  <div className="text-xs text-slate-400">
                    {formatDateFull(flight.departureTime)}
                  </div>
                  <div className="text-lg font-bold text-blue-400 mt-1">
                    {formatPrice(flight.price, flight.currency)}
                  </div>
                </div>

                <div className="space-y-3">
                  <Input
                    label="Full Name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    disabled={status === "loading"}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    disabled={status === "loading"}
                  />
                </div>

                <Button
                  onClick={handleConfirm}
                  disabled={
                    !name.trim() || !email.trim() || status === "loading"
                  }
                  fullWidth
                  className="mt-4"
                >
                  {status === "loading" ? "Processing..." : "Confirm Booking"}
                </Button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
