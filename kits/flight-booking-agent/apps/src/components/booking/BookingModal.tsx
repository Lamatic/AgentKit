"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Flight, Booking } from "@/types";
import { Button } from "@/components/ui/button";
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

// Zod schema for form validation
const bookingSchema = z.object({
  name: z.string().min(2, "Full name is required").max(100, "Name is too long"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export const BookingModal = ({
  isOpen,
  flight,
  onClose,
  onConfirm,
}: BookingModalProps) => {
  const [status, setStatus] = useState<"idle" | "loading" | "demo" | "error">(
    "idle",
  );
  const [bookingRef, setBookingRef] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus the modal after a short delay
      setTimeout(() => {
        const firstInput = modalRef.current?.querySelector("input");
        if (firstInput) {
          firstInput.focus();
        }
      }, 100);
    } else if (previousFocusRef.current) {
      // Restore focus when modal closes
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && status !== "demo") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, status]);

  const resetModal = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setStatus("idle");
    setBookingRef("");
    reset();
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const onSubmit = async (data: BookingFormData) => {
    if (!flight) return;

    setStatus("loading");
    const booking = await onConfirm(flight, data.name, data.email);

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

  return (
    <AnimatePresence>
      {isOpen && flight && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-background/70 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl"
            role="dialog"
            aria-labelledby="booking-modal-title"
            aria-modal="true"
            tabIndex={-1}
          >
            {status === "demo" ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h3
                  id="booking-modal-title"
                  className="text-xl font-bold text-foreground"
                >
                  Booking Saved! 🎉
                </h3>
                <p className="text-muted-foreground text-sm mt-2">
                  Your flight has been saved to your demo history.
                </p>
                <div className="mt-4 p-4 bg-muted/50 rounded-xl">
                  <p className="text-sm text-muted-foreground">
                    Demo Reference
                  </p>
                  <p className="text-xl font-mono font-bold text-primary">
                    {bookingRef}
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="mt-4 px-6 py-2 bg-primary hover:bg-primary/90 rounded-lg text-primary-foreground transition-colors"
                  aria-label="Close dialog"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3
                    id="booking-modal-title"
                    className="text-xl font-bold text-foreground"
                  >
                    Book Flight
                  </h3>
                  <button
                    onClick={handleClose}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Close booking modal"
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>

                <div className="mb-4 p-3 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {flight.airline}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {flight.flightNumber}
                    </span>
                  </div>
                  <div className="text-sm text-foreground/80">
                    {flight.departureAirport} → {flight.arrivalAirport}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDateFull(flight.departureTime)}
                  </div>
                  <div className="text-lg font-bold text-primary mt-1">
                    {formatPrice(flight.price, flight.currency)}
                  </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                  <Input
                    label="Full Name"
                    type="text"
                    placeholder="John Doe"
                    disabled={isSubmitting}
                    error={errors.name?.message}
                    {...register("name")}
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="john@example.com"
                    disabled={isSubmitting}
                    error={errors.email?.message}
                    {...register("email")}
                  />

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-4"
                  >
                    {isSubmitting ? "Processing..." : "Save to Demo"}
                  </Button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
