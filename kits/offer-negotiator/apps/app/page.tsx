"use client";

import { useState } from "react";
import { OfferForm } from "@/components/offer-form";
import { NegotiationBrief } from "@/components/negotiation-brief";
import { negotiateOffer } from "@/actions/orchestrate";
import type { NegotiationResult, OfferInput } from "@/lib/types";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NegotiationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (offer: OfferInput) => {
    setLoading(true);
    setError(null);
    setResult(null);
    const res = await negotiateOffer(offer);
    if (res.success && res.data) {
      setResult(res.data);
    } else {
      setError(res.error ?? "Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <main className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
      <header className="mb-12">
        <p className="eyebrow">The offer stage</p>
        <h1
          className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight"
          style={{ lineHeight: 1.05 }}
        >
          You got the offer.
          <br />
          Now counter like you&apos;ve{" "}
          <span style={{ color: "var(--teal)" }}>done this before.</span>
        </h1>
        <p
          className="mt-5 text-lg leading-relaxed"
          style={{ color: "var(--muted)" }}
        >
          Paste the numbers and what you care about. Get an honest read, the
          leverage you actually hold, target figures, and a counter-offer email
          you can send today.
        </p>
      </header>

      {!result ? (
        <OfferForm onSubmit={handleSubmit} loading={loading} />
      ) : (
        <div className="mb-8 flex items-center justify-between gap-4">
          <p className="eyebrow">Your negotiation brief</p>
          <button
            type="button"
            onClick={reset}
            className="copy-btn"
          >
            New offer
          </button>
        </div>
      )}

      {error ? (
        <div
          className="card mt-6 p-5"
          style={{ borderColor: "var(--clay)" }}
          role="alert"
        >
          <p className="font-semibold" style={{ color: "var(--clay)" }}>
            Couldn&apos;t build your brief
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            {error}
          </p>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-8 space-y-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="card p-6"
              style={{ opacity: 0.6 }}
            >
              <div
                style={{
                  height: 10,
                  width: "35%",
                  background: "var(--line)",
                  borderRadius: 6,
                }}
              />
              <div
                style={{
                  height: 10,
                  width: "80%",
                  background: "var(--line)",
                  borderRadius: 6,
                  marginTop: 14,
                }}
              />
              <div
                style={{
                  height: 10,
                  width: "60%",
                  background: "var(--line)",
                  borderRadius: 6,
                  marginTop: 10,
                }}
              />
            </div>
          ))}
        </div>
      ) : null}

      {result ? <NegotiationBrief result={result} /> : null}

      <footer
        className="mt-16 pt-6 text-sm"
        style={{ borderTop: "1px solid var(--line)", color: "var(--muted)" }}
      >
        Offer Negotiator reasons from the numbers you provide. It flags
        estimates as assumptions and isn&apos;t legal or financial advice. Built
        on{" "}
        <a
          href="https://lamatic.ai"
          target="_blank"
          rel="noreferrer"
          style={{ color: "var(--teal)" }}
        >
          Lamatic
        </a>
        .
      </footer>
    </main>
  );
}
