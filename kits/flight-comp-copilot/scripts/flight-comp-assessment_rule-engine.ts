// Code: Rule Engine
// Flow: flight-comp-assessment
//
// Deterministic EU261 / UK261 eligibility and amount rules. The LLM upstream only
// extracts facts; every money rule below is plain code so the verdict is reproducible
// and auditable. Verdicts: "eligible" | "not-eligible" | "needs-info".
//
// Boundary note: Article 7(2) halves long-haul compensation for delays of 3–4 hours.
// Sources split on whether exactly 4.0h falls inside the halved window (Flightright:
// 3–4h inclusive; UK CAA wording "less than four hours"). This engine treats 4.0h
// as halved and documents the choice here; real arrival delays rarely land exactly
// on the boundary.

// Tiered fixed amounts, per EU Regulation 261/2004 Article 7(1) and the UK-retained
// equivalent (amounts in GBP):
//   short  = flights ≤ 1,500 km
//   medium = intra-EU/UK flights > 1,500 km, and all other flights 1,500–3,500 km
//   long   = all other flights (> 3,500 km outside EU/UK)
const AMOUNTS = {
  "EU-261": { short: 250, medium: 400, long: 600 },
  "UK-261": { short: 220, medium: 350, long: 520 },
};

const TIERS = ["short", "medium", "long"];
const UNKNOWN = -1;

function tierLabel(tier) {
  if (tier === "short") return "≤ 1,500 km";
  if (tier === "medium") return "1,500–3,500 km";
  return "over 3,500 km";
}

function needsInfo(reason) {
  return {
    eligibility: "needs-info",
    compensationAmount: null,
    currency: null,
    legalBasis: "EU Regulation 261/2004 / UK261 (facts incomplete)",
    decisionReason: reason,
    dutyOfCare:
      "Under Article 9, passengers are entitled to meals, refreshments, hotel accommodation where an overnight stay becomes necessary, and transfers, regardless of whether cash compensation is ultimately owed.",
    missingFacts: [reason],
  };
}

function notEligible(legalBasis, decisionReason) {
  return {
    eligibility: "not-eligible",
    compensationAmount: null,
    currency: null,
    legalBasis: legalBasis,
    decisionReason: decisionReason,
    dutyOfCare:
      "Article 9 duty of care still applies: meals and refreshments proportionate to the wait, hotel accommodation and transfers if the delay runs overnight, plus two free communications. If the airline provided none of these, reasonable receipts can be reclaimed from the airline directly. Under Articles 8/10, the ticket cost can be refunded instead if travel no longer serves a purpose.",
  };
}

// The extraction schema types delay/notice as numbers, but a lax provider response can
// still surface null or "". Number(null) === 0 and Number("") === 0, which would read
// as "no delay at all" and produce a confident not-eligible verdict — on a legal claim
// that must instead surface as unknown.
function toNumberOrNullSentinel(raw) {
  if (raw === null || raw === undefined || raw === "" || typeof raw === "boolean") {
    return null;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function assess(f) {
  // "unknown" jurisdiction (no route info extracted) must not silently default to
  // EU-261 — the amounts differ between regulations, so ask instead of guess.
  // "out-of-scope" (a route neither regulation covers, e.g. a domestic flight in a
  // third country) is a definitive not-eligible, not a question.
  if (f.jurisdiction === "out-of-scope") {
    return notEligible(
      "EU Regulation 261/2004 / UK261 scope (Article 3): the regulation covers flights departing an EU/UK airport, and flights arriving in the EU on an EU carrier (or in the UK on a UK/EU carrier)",
      "The route described falls outside EU261/UK261: the flight did not depart from an EU or UK airport, and it was not flying into the EU on an EU carrier or into the UK on a UK/EU carrier. Neither regulation applies, so no compensation is owed under them. Other jurisdictions (for example the US DOT framework) may provide different rights, but this flow does not assess those."
    );
  }
  if (f.jurisdiction !== "EU-261" && f.jurisdiction !== "UK-261") {
    return needsInfo(
      "The flight's jurisdiction (EU-261 vs UK-261) could not be determined from the description. Which regulation applies depends on where the flight departed from and the operating carrier — confirm the departure airport and the airline's registration."
    );
  }
  const jurisdiction = f.jurisdiction;
  const currency = jurisdiction === "UK-261" ? "GBP" : "EUR";
  const amounts = AMOUNTS[jurisdiction];

  const delay = toNumberOrNullSentinel(f.arrivalDelayHours);
  const notice = toNumberOrNullSentinel(f.cancellationNoticeDays);

  // A hallucinated or unmapped distance tier must not silently pick an amount — the
  // largest tier was previously the fallback, which overstated claims.
  if (!TIERS.includes(f.distanceTier)) {
    return needsInfo(
      "The flight's distance tier (" + String(f.distanceTier) + ") was not recognised. The compensation amount depends on route distance: up to 1,500 km, 1,500–3,500 km, or over 3,500 km. Confirm the origin and final destination airports."
    );
  }
  const base = amounts[f.distanceTier];

  // A disruption type we cannot map to a rule set is not a claim we can assess.
  if (!["delay", "cancellation", "denied-boarding", "downgrade"].includes(f.disruptionType)) {
    return needsInfo(
      "The disruption type described (" + f.disruptionType + ") is not covered by the EU261/UK261 compensation rules this flow implements. Provide details for a delay, cancellation, denied boarding, or downgrade."
    );
  }

  // Article 5(3) and recital 15: genuinely external causes exclude cash compensation —
  // but only for delays and cancellations. Denied boarding (Article 4(3)) and downgrade
  // (Article 10(2)) carry no extraordinary-circumstances defense in the regulation, so
  // the gate must not touch them.
  if (
    f.cause === "extraordinary" &&
    (f.disruptionType === "delay" || f.disruptionType === "cancellation")
  ) {
    return notEligible(
      "EU Regulation 261/2004, Article 5(3) / recital 15 (extraordinary circumstances), as interpreted by CJEU Wallentin-Hermann; UK261 equivalent",
      "The stated cause (" + (f.causeText || "extraordinary circumstances") + ") falls outside the airline's control. Extraordinary circumstances exclude cash compensation under EU261/UK261. Note that the airline bears the burden of proving the circumstance was genuinely unavoidable, and technical faults, crew shortages, and overbookings do not count as extraordinary under CJEU case law."
    );
  }

  if (f.disruptionType === "delay") {
    if (delay === null || delay === UNKNOWN) {
      return needsInfo(
        "The arrival delay at the final destination is missing or unknown. EU261 compensation for a delay requires knowing whether you arrived 3 or more hours late."
      );
    }
    if (delay < 3) {
      return notEligible(
        "EU Regulation 261/2004, Article 7 (delay below the 3-hour threshold); UK261 equivalent",
        "The arrival delay was " + delay + " hours. Fixed cash compensation under EU261/UK261 requires an arrival delay of at least 3 hours at the final destination."
      );
    }
    // Article 7(2): long-haul delays of 3–4 hours are halved (boundary choice documented
    // in the header comment).
    const halved = f.distanceTier === "long" && delay <= 4;
    const amount = halved ? amounts.long / 2 : base;
    return {
      eligibility: "eligible",
      compensationAmount: Math.round(amount),
      currency: currency,
      legalBasis: halved
        ? "EU Regulation 261/2004, Article 7(2) (50% reduction for delays of 3–4 hours on flights over 3,500 km); UK261 equivalent"
        : "EU Regulation 261/2004, Article 7(1)(c) / Sturgeon (C-402/07): arrival delay of 3+ hours is treated as a cancellation for compensation purposes; UK261 equivalent",
      decisionReason:
        "The flight arrived " + delay + " hours late on a " + tierLabel(f.distanceTier) + " route" +
        (halved
          ? ". Delays of 3–4 hours on long-haul routes qualify for 50% of the full long-haul amount under Article 7(2)."
          : ". Arrival delays of 3 hours or more qualify for fixed compensation by distance tier."),
      dutyOfCare:
        "Under Article 9, meals, refreshments, hotel accommodation where needed, and airport transfers are owed regardless of compensation. Under Articles 8/10, the ticket cost can be refunded instead if travel no longer serves a purpose.",
    };
  }

  if (f.disruptionType === "cancellation") {
    // Article 5(1)(c): notified ≥ 14 days → exempt. Notified 7–14 days → exempt only if
    // the reroute arrives ≤ 4 hours after the original schedule. Notified < 7 days →
    // exempt only if it arrives ≤ 2 hours after.
    if (notice === null || notice === UNKNOWN) {
      return needsInfo(
        "How far in advance the cancellation was notified is missing or unknown. The 14-day and 7-day notice windows in Article 5(1)(c) decide whether compensation is owed for a cancellation."
      );
    }
    if (notice >= 14) {
      return notEligible(
        "EU Regulation 261/2004, Article 5(1)(c)(i) (14-day notice exemption); UK261 equivalent",
        "The cancellation was notified " + notice + " days before scheduled departure. Cancellations notified at least 14 days in advance are exempt from cash compensation."
      );
    }
    const windowExemptDelay = notice >= 7 ? 4 : 2;
    const rerouteOk = delay !== null && delay !== UNKNOWN && delay <= windowExemptDelay;
    if (rerouteOk) {
      return notEligible(
        "EU Regulation 261/2004, Article 5(1)(c)(" + (notice >= 7 ? "ii" : "iii") + ") (notice within the compensation window with compliant re-routing); UK261 equivalent",
        "The cancellation was notified " + notice + " days ahead (inside the Article 5(1)(c) window) and the re-routing arrived " + delay + " hours late — within the " + windowExemptDelay + "-hour allowance for that notice period — which exempts the airline from compensation."
      );
    }
    // Inside the notice window without a proven compliant reroute, compensation stands.
    // The burden of proving the reroute complied sits with the airline.
    return {
      eligibility: "eligible",
      compensationAmount: base,
      currency: currency,
      legalBasis:
        "EU Regulation 261/2004, Articles 5(1)(c) and 7(1) (cancellation without compliant notice or re-routing); UK261 equivalent",
      decisionReason:
        "The cancellation was notified " + notice + " days before departure, inside the Article 5(1)(c) window" +
        (delay !== null && delay !== UNKNOWN
          ? ", and the re-routing arrived " + delay + " hours late — beyond the " + windowExemptDelay + "-hour allowance for that notice period"
          : ". The re-routing arrival delay is unknown, so the exemption cannot be established — the airline bears the burden of proving the re-routing complied") +
        ". Fixed compensation applies by distance tier (" + tierLabel(f.distanceTier) + ").",
      dutyOfCare:
        "Under Article 9, meals, refreshments, hotel accommodation where needed, and airport transfers are owed regardless of compensation. Under Articles 8/10, the ticket cost can be refunded instead if travel no longer serves a purpose.",
    };
  }

  if (f.disruptionType === "denied-boarding") {
    // Article 4(3): involuntary denied boarding carries full compensation — no halving,
    // no notice exemption, and no extraordinary-circumstances defense. Voluntary
    // surrender for vouchers voids it.
    return {
      eligibility: "eligible",
      compensationAmount: base,
      currency: currency,
      legalBasis:
        "EU Regulation 261/2004, Article 4(3) (involuntary denied boarding); UK261 equivalent",
      decisionReason:
        "Boarding was denied against the passenger's will (involuntary denied boarding). Full fixed compensation applies by distance tier (" +
        tierLabel(f.distanceTier) + ") with no 50% reduction, notice exemption, or extraordinary-circumstances defense. Voluntary surrender in exchange for vouchers voids this — only involuntary denial qualifies.",
      dutyOfCare:
        "Under Article 9, meals, refreshments, hotel accommodation where needed, and airport transfers are owed regardless of compensation. Under Articles 8/10, the ticket cost can be refunded instead if travel no longer serves a purpose.",
    };
  }

  // Remaining case: downgrade. Article 10(2) requires a refund of 30/50/75% of the
  // ticket price by distance tier — a percentage of a price the flow does not extract.
  // Rather than emit an eligible verdict with no computable amount, ask for the price;
  // the percentage itself is stated so the passenger knows the basis.
  const PERCENT = { short: 30, medium: 50, long: 75 };
  return needsInfo(
    "The ticket was downgraded. Article 10(2) requires a refund of " + PERCENT[f.distanceTier] + "% of the ticket price for the " +
    tierLabel(f.distanceTier) + " tier. Provide the price paid for the downgraded segment so the exact amount can be computed."
  );
}

output = assess({
  jurisdiction: {{InstructorLLMNode_210.output.jurisdiction}},
  airline: {{InstructorLLMNode_210.output.airline}},
  flightNumber: {{InstructorLLMNode_210.output.flightNumber}},
  originAirport: {{InstructorLLMNode_210.output.originAirport}},
  destinationAirport: {{InstructorLLMNode_210.output.destinationAirport}},
  scheduledDepartureDate: {{InstructorLLMNode_210.output.scheduledDepartureDate}},
  disruptionType: {{InstructorLLMNode_210.output.disruptionType}},
  arrivalDelayHours: {{InstructorLLMNode_210.output.arrivalDelayHours}},
  cancellationNoticeDays: {{InstructorLLMNode_210.output.cancellationNoticeDays}},
  cause: {{InstructorLLMNode_210.output.cause}},
  causeText: {{InstructorLLMNode_210.output.causeText}},
  distanceTier: {{InstructorLLMNode_210.output.distanceTier}}
});
