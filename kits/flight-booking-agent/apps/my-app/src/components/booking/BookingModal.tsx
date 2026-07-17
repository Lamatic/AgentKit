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
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {status === "confirmed" ? (
              <div>
                <div>
                  <CheckCircle />
                </div>
                <h3>Booking Confirmed! 🎉</h3>
                <p>Your flight has been booked successfully.</p>
                <div>
                  <p>Booking Reference</p>
                  <p>{bookingRef}</p>
                </div>
                <button onClick={onClose}>Done</button>
              </div>
            ) : (
              <>
                <div>
                  <h3>Book Flight</h3>
                  <button onClick={onClose}>
                    <X />
                  </button>
                </div>

                <div>
                  <div>
                    <span>{flight.airline}</span>
                    <span>{flight.flightNumber}</span>
                  </div>
                  <div>
                    {flight.departureAirport} → {flight.arrivalAirport}
                  </div>
                  <div>{formatDateFull(flight.departureTime)}</div>
                  <div>{formatPrice(flight.price, flight.currency)}</div>
                </div>

                <div>
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
