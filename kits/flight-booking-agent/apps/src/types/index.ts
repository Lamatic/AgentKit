// types/index.ts

export interface Flight {
  offerId: string;
  airline: string;
  airlineLogo: string;
  flightNumber: string;
  departureAirport: string;
  departureTime: string;
  arrivalAirport: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: number;
  currency: string;
  expiresAt: string;
  isRoundTrip: boolean;
  returnFlightNumber?: string;
  returnDepartureTime?: string;
  returnArrivalTime?: string;
  originalPrice?: number;
  originalCurrency?: string;
  exchangeRate?: number;
  isConverted?: boolean;
  cabinClass?: string; // ✅ Already exists
}

export interface SearchResponse {
  status: string;
  message: string;
  totalAvailable: number;
  totalResults: number;
  displayCurrency: string;
  exchangeRate: number;
  requestedCurrency: string;
  cabinClass?: string; // ✅ Added
  cheapestPrice?: number | null; // ✅ Added
  mostExpensive?: number | null; // ✅ Added
  showing?: number; // ✅ Added
  searchParams: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate: string | null;
    passengers: number;
    minPrice?: number | null;
    maxPrice?: number | null;
    cabinClass?: string; // ✅ Added
  };
  flights: Flight[];
}

export interface Booking {
  id: string;
  flight: Flight;
  bookingReference: string;
  passengerName: string;
  passengerEmail: string;
  bookedAt: string;
  status: "demo" | "pending" | "cancelled";
}

export interface Suggestion {
  label: string;
  query: string;
}
