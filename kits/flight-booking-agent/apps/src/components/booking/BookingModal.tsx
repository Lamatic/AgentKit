"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  const [status, setStatus] = useState<"idle" | "loading" | "demo" | "error">(
    "idle",
  );
  const [bookingRef, setBookingRef] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const resetModal = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setStatus("idle");
    setName("");
    setEmail("");
    setBookingRef("");
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleConfirm = async () => {
    if (!flight || !name.trim() || !email.trim()) return;

    setStatus("loading");
    const booking = await onConfirm(flight, name, email);

    if (booking) {
      setBookingRef(booking.bookingReference);
      setStatus("demo");
      timerRef.current = setTimeout(() => {
        handleClose();
      }, 3000);
    } else {
      setStatus("error");
    }
  };

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && flight && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl"
            role="dialog"
            aria-labelledby="booking-modal-title"
            aria-modal="true"
          >
            {status === "demo" ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-blue-400" />
                </div>
                <h3
                  id="booking-modal-title"
                  className="text-xl font-bold text-white"
                >
                  Booking Saved! 🎉
                </h3>
                <p className="text-slate-400 text-sm mt-2">
                  Your flight has been saved to your demo history.
                </p>
                <div className="mt-4 p-4 bg-slate-700/50 rounded-xl">
                  <p className="text-sm text-slate-300">Demo Reference</p>
                  <p className="text-xl font-mono font-bold text-blue-400">
                    {bookingRef}
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3
                    id="booking-modal-title"
                    className="text-xl font-bold text-white"
                  >
                    Book Flight
                  </h3>
                  <button
                    onClick={handleClose}
                    className="text-slate-400 hover:text-white transition-colors"
                    aria-label="Close booking modal"
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
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
                    required
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    disabled={status === "loading"}
                    required
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
                  {status === "loading" ? "Processing..." : "Save to Demo"}
                </Button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
