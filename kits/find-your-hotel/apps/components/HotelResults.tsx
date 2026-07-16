"use client";

import type { HotelSearchResponse } from "@/lib/hotel-client";

export default function HotelResults({ data }: { data: HotelSearchResponse }) {
  const { disclaimer, city, country, hotels, currency } = data;

  return (
    <div className="space-y-6">
      <div className="perforated bg-pine text-parchment rounded-xl p-6 shadow-sm">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-marigold">
          AI Estimate — Not Live Availability
        </span>
        <p className="font-display text-2xl font-semibold mt-2">
          {city}, {country}
        </p>
        <p className="font-body text-sm mt-1 text-parchment/80">{disclaimer}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {hotels.map((h, i) => (
          <div
            key={h.name + i}
            className="stamp-in perforated bg-white/70 border border-ink/10 rounded-xl p-6 shadow-sm"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-baseline justify-between gap-3 mb-1">
              <h3 className="font-display font-bold text-xl text-ink">{h.name}</h3>
              <span
                className={`font-mono text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${
                  h.priceConfidence === "medium"
                    ? "bg-pine/10 text-pine"
                    : "bg-stamp/10 text-stamp"
                }`}
              >
                {h.priceConfidence} confidence
              </span>
            </div>
            <p className="font-mono text-xs uppercase tracking-wide text-ink/50 mb-4">
              {h.areaDescription}
            </p>

            <p className="font-display text-2xl font-semibold text-ink">
              {currency} {h.approxPricePerNight}
              <span className="font-body text-sm text-ink/50"> / night (approx.)</span>
            </p>

            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="font-body text-ink/70">
                📞 {h.phoneNumber}
              </span>
              <a
                href={h.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs uppercase tracking-wide text-pine hover:text-pine/70 underline"
              >
                View on Maps →
              </a>
            </div>

            <div className="barcode w-full text-ink/40 mt-5" />
          </div>
        ))}
      </div>
    </div>
  );
}
