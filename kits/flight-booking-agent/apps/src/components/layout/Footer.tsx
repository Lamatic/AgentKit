"use client";

interface FooterProps {
  bookingsCount: number;
}

export const Footer = ({ bookingsCount }: FooterProps) => {
  return (
    <footer className="relative z-10 border-t border-white/5 mt-12 py-6 text-center text-xs text-slate-500">
      <p>FlightFinder — AI-powered flight search. Data provided by Duffel.</p>
      <p className="mt-1">{bookingsCount} bookings saved locally</p>
    </footer>
  );
};
