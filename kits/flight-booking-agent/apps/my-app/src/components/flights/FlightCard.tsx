"use client";

import { motion } from "framer-motion";
import { Plane, ArrowRight } from "lucide-react";
import { Flight } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import ClientOnly from "@/components/ClientOnly";
import { formatTime, formatDay, formatPrice } from "@/lib/formatters";

interface FlightCardProps {
  flight: Flight;
  index: number;
  displayCurrency: string;
  onBook: (flight: Flight) => void;
}

export const FlightCard = ({
  flight,
  index,
  displayCurrency,
  onBook,
}: FlightCardProps) => {
  const displayPrice = flight.price || 0;

  const getCabinDisplay = (cabin: string) => {
    const map: Record<string, string> = {
      economy: "Economy",
      premium_economy: "Premium Economy",
      business: "Business",
      first: "First Class",
    };
    return map[cabin] || cabin;
  };

  const cabinDisplayName = flight.cabinClass
    ? getCabinDisplay(flight.cabinClass)
    : "Economy";

  const getCabinVariant = (cabin: string) => {
    if (cabin === "business") return "info";
    if (cabin === "first") return "warning";
    if (cabin === "premium_economy") return "success";
    return "default";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.01 }}
    >
      <Card hoverable>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              {flight.airlineLogo && (
                <img
                  src={flight.airlineLogo}
                  alt={flight.airline}
                  className="h-8 w-auto rounded"
                />
              )}
              <span className="font-semibold text-white">{flight.airline}</span>
              <span className="text-slate-500 text-sm">
                • {flight.flightNumber}
              </span>

              {flight.stops === 0 ? (
                <Badge variant="success">Direct</Badge>
              ) : (
                <Badge variant="warning">
                  {flight.stops} stop{flight.stops > 1 ? "s" : ""}
                </Badge>
              )}

              <Badge variant={getCabinVariant(flight.cabinClass || "economy")}>
                {cabinDisplayName}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-center min-w-15">
                <div className="text-xl font-bold text-white">
                  {flight.departureAirport}
                </div>
                <ClientOnly
                  fallback={<div className="text-xs text-slate-400">--:--</div>}
                >
                  <div className="text-xs text-slate-400">
                    {formatTime(flight.departureTime)}
                  </div>
                </ClientOnly>
                <div className="text-[10px] text-slate-500">
                  {formatDay(flight.departureTime)}
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center px-2">
                <div className="relative w-full flex items-center">
                  <div className="flex-1 h-px bg-linear-to-r from-slate-600 via-blue-500 to-slate-600" />
                  <Plane className="w-3 h-3 text-blue-400 rotate-90 absolute" />
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {flight.duration}
                </div>
              </div>

              <div className="text-center min-w-15">
                <div className="text-xl font-bold text-white">
                  {flight.arrivalAirport}
                </div>
                <ClientOnly
                  fallback={<div className="text-xs text-slate-400">--:--</div>}
                >
                  <div className="text-xs text-slate-400">
                    {formatTime(flight.arrivalTime)}
                  </div>
                </ClientOnly>
                <div className="text-[10px] text-slate-500">
                  {formatDay(flight.arrivalTime)}
                </div>
              </div>
            </div>

            {/* Return info for round trip */}
            {flight.isRoundTrip && flight.returnFlightNumber && (
              <div className="mt-2 pt-2 border-t border-slate-700/30 flex items-center gap-2 text-xs text-slate-400">
                <ArrowRight className="w-3 h-3" />
                <span>Return: {flight.returnFlightNumber}</span>
                <span>•</span>
                <ClientOnly fallback={<span>--:--</span>}>
                  <span>{formatTime(flight.returnDepartureTime || "")}</span>
                </ClientOnly>
                <span>→</span>
                <ClientOnly fallback={<span>--:--</span>}>
                  <span>{formatTime(flight.returnArrivalTime || "")}</span>
                </ClientOnly>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end min-w-35">
            <div className="text-2xl font-bold bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {formatPrice(displayPrice, displayCurrency)}
            </div>
            {flight.isConverted && flight.originalPrice && (
              <div className="text-xs text-slate-500">
                ${flight.originalPrice} USD
                <span className="text-[10px] text-slate-600 ml-1">
                  (rate: {flight.exchangeRate?.toFixed(2)})
                </span>
              </div>
            )}
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onBook(flight);
              }}
              className="mt-2 px-5"
            >
              Book Now
            </Button>
            <ClientOnly
              fallback={<div className="text-[10px] text-slate-500">--</div>}
            >
              <div className="text-[10px] text-slate-500 mt-1">
                expires {new Date(flight.expiresAt).toLocaleTimeString()}
              </div>
            </ClientOnly>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
