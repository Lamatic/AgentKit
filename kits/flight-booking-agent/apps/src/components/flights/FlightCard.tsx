"use client";

import { motion } from "motion/react";
import { Plane, ArrowRight } from "lucide-react";
import { Flight } from "@/types";
import { Button } from "@/components/ui/button";
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
              <span className="font-semibold text-foreground">
                {flight.airline}
              </span>
              <span className="text-muted-foreground text-sm">
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
              <div className="text-center min-w-[60px]">
                <div className="text-xl font-bold text-foreground">
                  {flight.departureAirport}
                </div>
                <ClientOnly
                  fallback={
                    <div className="text-xs text-muted-foreground">--:--</div>
                  }
                >
                  <div className="text-xs text-muted-foreground">
                    {formatTime(flight.departureTime)}
                  </div>
                </ClientOnly>
                <div className="text-[10px] text-muted-foreground/70">
                  {formatDay(flight.departureTime)}
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center px-2">
                <div className="relative w-full flex items-center">
                  <div className="flex-1 h-px bg-gradient-to-r from-muted-foreground/30 via-primary to-muted-foreground/30" />
                  <Plane className="w-3 h-3 text-primary rotate-90 absolute" />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {flight.duration}
                </div>
              </div>

              <div className="text-center min-w-[60px]">
                <div className="text-xl font-bold text-foreground">
                  {flight.arrivalAirport}
                </div>
                <ClientOnly
                  fallback={
                    <div className="text-xs text-muted-foreground">--:--</div>
                  }
                >
                  <div className="text-xs text-muted-foreground">
                    {formatTime(flight.arrivalTime)}
                  </div>
                </ClientOnly>
                <div className="text-[10px] text-muted-foreground/70">
                  {formatDay(flight.arrivalTime)}
                </div>
              </div>
            </div>

            {flight.isRoundTrip && flight.returnFlightNumber && (
              <div className="mt-2 pt-2 border-t border-border/50 flex items-center gap-2 text-xs text-muted-foreground">
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

          <div className="flex flex-col items-end min-w-[140px]">
            <div className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              {formatPrice(displayPrice, displayCurrency)}
            </div>
            {flight.isConverted && flight.originalPrice && (
              <div className="text-xs text-muted-foreground">
                {flight.originalPrice} {flight.originalCurrency}
                <span className="text-[10px] text-muted-foreground/70 ml-1">
                  (rate: {flight.exchangeRate?.toFixed(2)})
                </span>
              </div>
            )}
            <Button
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                onBook(flight);
              }}
              className="mt-2 px-5"
            >
              Book Now
            </Button>
            <ClientOnly
              fallback={
                <div className="text-[10px] text-muted-foreground">--</div>
              }
            >
              <div className="text-[10px] text-muted-foreground mt-1">
                expires {new Date(flight.expiresAt).toLocaleTimeString()}
              </div>
            </ClientOnly>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
