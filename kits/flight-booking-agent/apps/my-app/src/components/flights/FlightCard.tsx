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
        <div>
          <div>
            <div>
              {flight.airlineLogo && (
                <img src={flight.airlineLogo} alt={flight.airline} />
              )}
              <span>{flight.airline}</span>
              <span>• {flight.flightNumber}</span>

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

            <div>
              <div>
                <div>{flight.departureAirport}</div>
                <ClientOnly fallback={<div>--:--</div>}>
                  <div>{formatTime(flight.departureTime)}</div>
                </ClientOnly>
                <div>{formatDay(flight.departureTime)}</div>
              </div>

              <div>
                <div>
                  <div />
                  <Plane />
                </div>
                <div>{flight.duration}</div>
              </div>

              <div>
                <div>{flight.arrivalAirport}</div>
                <ClientOnly fallback={<div>--:--</div>}>
                  <div>{formatTime(flight.arrivalTime)}</div>
                </ClientOnly>
                <div>{formatDay(flight.arrivalTime)}</div>
              </div>
            </div>

            {flight.isRoundTrip && flight.returnFlightNumber && (
              <div>
                <ArrowRight />
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

          <div>
            <div>{formatPrice(displayPrice, displayCurrency)}</div>
            {flight.isConverted && flight.originalPrice && (
              <div>
                ${flight.originalPrice} USD
                <span>(rate: {flight.exchangeRate?.toFixed(2)})</span>
              </div>
            )}
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onBook(flight);
              }}
            >
              Book Now
            </Button>
            <ClientOnly fallback={<div>--</div>}>
              <div>
                expires {new Date(flight.expiresAt).toLocaleTimeString()}
              </div>
            </ClientOnly>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
