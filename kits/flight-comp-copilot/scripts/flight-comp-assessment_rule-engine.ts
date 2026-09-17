// Code: Rule Engine
// Flow: flight-comp-assessment
//
// Deterministic EU261 / UK261 eligibility and amount rules. The LLM upstream only
// extracts facts; every money rule below is plain code so the verdict is reproducible
// and auditable. Verdicts: "eligible" | "not-eligible" | "needs-info".
//
// Boundary note: Article 7(2) permits a 50% reduction in two situations:
// 1. Where re-routing under Article 8 was offered (cancellations and involuntary
//    denied boarding) and the replacement arrives within the tier limit — 2 hours
//    for short, 3 for medium, 4 for long, inclusive.
// 2. For long-haul delays (> 3,500 km) where the arrival delay is between 3 and 4
//    hours (delay >= 3 && delay < 4), as established by CJEU Sturgeon (Joined Cases
//    C-402/07 and C-432/07, para 63) and Nelson (Joined Cases C-581/10 and C-629/10,
//    para 78) applying Article 7(2)(c). Delays of 4+ hours receive the full tier amount.
//    (For short and medium flights, compensable delays >= 3h already exceed the 2h/3h
//    Article 7(2)(a)/(b) thresholds, so full compensation applies).

// Tiered fixed amounts, per EU Regulation 261/2004 Article 7(1) and the UK-retained
// equivalent (amounts in GBP):
//   short  = flights ≤ 1,500 km
//   medium = intra-EU/UK flights > 1,500 km, and all other flights 1,500–3,500 km
//   long   = all other flights (> 3,500 km outside EU/UK)
const AMOUNTS = {
  "EU-261": { short: 250, medium: 400, long: 600 },
  "UK-261": { short: 220, medium: 350, long: 520 },
};

// Article 7(2) rerouting arrival limits (inclusive), by distance tier. Also used as
// the Article 6(1) care thresholds reference for delay duty-of-care wording.
const ART72_LIMIT = { short: 2, medium: 3, long: 4 };

const TIERS = ["short", "medium", "long"];
const UNKNOWN = -1;
// Sentinel for the reroute offset fields. Unlike the delay/notice fields, these
// accept genuinely negative values (a reroute that arrived early), so the unknown
// sentinel must sit outside the plausible value range to avoid collisions.
const UNKNOWN_REROUTE = -999;

// Cancellations carry the Articles 8/9 rights immediately, with no departure-delay
// threshold: the passenger is entitled to the Article 8 choice (refund or re-routing)
// and Article 9 care while waiting, whatever the notice period or the
// extraordinary-circumstances outcome of the cash-compensation question.
const CANCELLATION_CARE =
  "The cancellation itself carries rights independent of cash compensation: under Article 8, the choice between a refund within seven days, re-routing at the earliest opportunity, or re-routing at a later date; and under Article 9, meals and refreshments proportionate to the wait, hotel accommodation and transfers if an overnight stay becomes necessary, and two free communications. These apply even where the cash-compensation exemption holds.";

// For delays, Articles 6/8/9 attach rights to the waiting time and the departure
// delay — facts the extraction schema does not capture (it extracts the arrival
// delay). The engine therefore states the thresholds instead of asserting the
// rights, so a rejection never grants assistance the stated facts cannot support.
function delayDutyOfCare(tier) {
  const careThreshold = ART72_LIMIT[tier] || 2;
  return (
    "The flow extracts the arrival delay but not the departure or waiting time, so it cannot determine these rights on the stated facts. For reference: Article 9 assistance (meals and refreshments, plus hotel accommodation and transfers if an overnight stay becomes necessary) is owed once the wait reaches " +
    careThreshold +
    " hours on this route length, and a full refund of the ticket instead of travel under Article 8 requires a departure delay of at least five hours. If the wait met those thresholds, the passenger can claim these rights from the airline directly with receipts, regardless of the cash-compensation outcome."
  );
}

function needsInfo(reason) {
  return {
    eligibility: "needs-info",
    compensationAmount: null,
    currency: null,
    legalBasis: "EU Regulation 261/2004 / UK261 (facts incomplete)",
    decisionReason: reason,
    dutyOfCare:
      "These rights cannot be confirmed until the missing facts are provided. For reference: a cancellation always carries the Article 8 choice of a refund or re-routing plus Article 9 care while waiting; for delays, Article 9 assistance is owed once the wait reaches 2–4 hours by route length, and a full refund instead of travel requires a departure delay of at least five hours.",
    missingFacts: [reason],
  };
}

function notEligible(legalBasis, decisionReason, dutyOfCare) {
  return {
    eligibility: "not-eligible",
    compensationAmount: null,
    currency: null,
    legalBasis: legalBasis,
    decisionReason: decisionReason,
    dutyOfCare: dutyOfCare === undefined ? null : dutyOfCare,
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
  // Only non-negative values and the -1 unknown sentinel are meaningful for a delay
  // or a notice period; any other negative (e.g. -2 from a lax provider response)
  // must surface as unknown, not as a confident verdict.
  return Number.isFinite(n) && (n >= 0 || n === UNKNOWN) ? n : null;
}

// Reroute offsets differ from delay/notice: negative values are valid (the reroute
// arrived or departed earlier than the original schedule), so this normalizer
// accepts any finite number and leaves sentinel interpretation to the engine.
function toRerouteOffsetOrNull(raw) {
  if (raw === null || raw === undefined || raw === "" || typeof raw === "boolean") {
    return null;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

// A ticket currency must be a stated 3-letter code — anything else (missing, "N/A",
// a currency name) means the refund amount cannot be computed in a real unit.
function toTicketCurrency(raw) {
  if (typeof raw !== "string") {
    return null;
  }
  const c = raw.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(c) ? c : null;
}

// ISO 4217 minor-unit digits by currency. Most currencies have 2 (EUR, GBP, USD);
// the exceptions are listed explicitly: three-decimal (BHD–TND), zero-decimal
// (BIF–XPF), and four-decimal (CLF, UYW) codes. 2 is the safe default for unknown
// codes, matching ISO 4217's "2 unless otherwise specified" convention. Codes that
// ISO lists as 2 but that use 1/5 subunits in practice (MGA, MRU) are deliberately
// NOT overridden here: ISO's published minor unit for both is 2, and CLDR-style
// zero-fraction handling would contradict the published table, so the default
// applies.
const CURRENCY_MINOR_DIGITS = {
  BHD: 3, IQD: 3, JOD: 3, KWD: 3, LYD: 3, OMR: 3, TND: 3,
  BIF: 0, CLP: 0, DJF: 0, GNF: 0, ISK: 0, JPY: 0, KMF: 0, KRW: 0,
  PYG: 0, RWF: 0, UGX: 0, UYI: 0, VND: 0, VUV: 0, XAF: 0, XOF: 0, XPF: 0,
  CLF: 4, UYW: 4,
};

// Round a refund to the currency's ISO 4217 minor-unit precision deterministically.
// The percentage is applied to the price scaled to integer minor units first, so
// exact half-way ties become exact .5 integers and Math.round rounds them half-up
// consistently — floating-point noise can never flip the direction of a tie the
// way the naive Math.round(amount * factor) / factor idiom does (e.g. 0.29 EUR at
// 50% rounding down while 0.99 EUR at 50% rounds up). Zero-decimal currencies such
// as JPY round to whole units; three-decimal (KWD) and four-decimal (CLF) codes
// keep their extra digits.
function toRefundUnits(price, percent, currency) {
  const digits = CURRENCY_MINOR_DIGITS[currency] !== undefined ? CURRENCY_MINOR_DIGITS[currency] : 2;
  const factor = Math.pow(10, digits);
  const priceMinor = Math.round(price * factor);
  const refundMinor = Math.round((priceMinor * percent) / 100);
  return refundMinor / factor;
}

function assess(f) {
  // "unknown" jurisdiction (no route info extracted) must not silently default to
  // EU-261 — the amounts differ between regulations, so ask instead of guess.
  // "out-of-scope" (a route neither regulation covers, e.g. a domestic flight in a
  // third country) is a definitive not-eligible, not a question.
  if (f.jurisdiction === "out-of-scope") {
    // Deliberately NOT notEligible(): that helper attaches Article 8/9/10 rights,
    // which must not be asserted for a route both regulations do not cover.
    return {
      eligibility: "not-eligible",
      compensationAmount: null,
      currency: null,
      legalBasis:
        "EU Regulation 261/2004 / UK261, Article 3 (scope): the regulations cover flights departing an EU/UK airport, arriving in the EU on an EU carrier, or arriving in the UK on a UK or EU carrier",
      decisionReason:
        "The route described falls outside EU261/UK261: the flight did not depart from an EU or UK airport, did not arrive in the EU on an EU carrier, and did not arrive in the UK on a UK or EU carrier. Neither regulation applies, so no compensation is owed under them. Other jurisdictions (for example the US DOT framework) may provide different rights, but this flow does not assess those.",
      dutyOfCare: null,
    };
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
      "The stated cause (" + (f.causeText || "extraordinary circumstances") + ") falls outside the airline's control. Extraordinary circumstances exclude cash compensation under EU261/UK261. Note that the airline bears the burden of proving the circumstance was genuinely unavoidable, and technical faults, crew shortages, and overbookings do not count as extraordinary under CJEU case law.",
      f.disruptionType === "cancellation" ? CANCELLATION_CARE : delayDutyOfCare(f.distanceTier)
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
        "The arrival delay was " + delay + " hours. Fixed cash compensation under EU261/UK261 requires an arrival delay of at least 3 hours at the final destination.",
        delayDutyOfCare(f.distanceTier)
      );
    }
    // CJEU Sturgeon (Joined Cases C-402/07 and C-432/07, para 63) and Nelson (Joined
    // Cases C-581/10 and C-629/10, para 78) established that under Article 7(2)(c),
    // long-haul flight delays (> 3,500 km) between 3 and 4 hours (< 4 hours) receive
    // a 50% reduction in statutory compensation. Delays of 4+ hours receive full compensation.
    // For short and medium routes, compensable delays (>= 3h) already exceed the Article
    // 7(2)(a)/(b) limits (2h and 3h), so the full tier amount applies.
    const isLongHaulHalved = f.distanceTier === "long" && delay >= 3 && delay < 4;
    const delayAmount = isLongHaulHalved ? Math.round(amounts.long / 2) : base;

    return {
      eligibility: "eligible",
      compensationAmount: delayAmount,
      currency: currency,
      legalBasis: isLongHaulHalved
        ? "EU Regulation 261/2004, Article 7(2)(c) / Sturgeon (Joined Cases C-402/07 and C-432/07) and Nelson (Joined Cases C-581/10 and C-629/10): arrival delay between 3 and 4 hours on a flight over 3,500 km qualifies for a 50% statutory reduction; UK261 equivalent"
        : "EU Regulation 261/2004, Article 7(1) / Sturgeon (C-402/07): arrival delay of 3+ hours is treated as a cancellation for compensation purposes; UK261 equivalent",
      decisionReason: isLongHaulHalved
        ? "The flight arrived " + delay + " hours late on a " + tierLabel(f.distanceTier) + " route. Under CJEU Sturgeon / Nelson case law applying Article 7(2)(c), an arrival delay between 3 and 4 hours on a flight over 3,500 km entitles the passenger to 50% of the long-haul fixed compensation (" + delayAmount + " " + currency + "). Delays of 4 hours or more receive the full tier amount."
        : "The flight arrived " + delay + " hours late on a " + tierLabel(f.distanceTier) + " route. Arrival delays of 3 hours or more qualify for the full fixed compensation by distance tier" + (f.distanceTier === "long" ? " (exceeding the 4-hour threshold for Article 7(2)(c) reduction)." : "."),
      dutyOfCare: delayDutyOfCare(f.distanceTier),
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
        "The cancellation was notified " + notice + " days before scheduled departure. Cancellations notified at least 14 days in advance are exempt from cash compensation.",
        CANCELLATION_CARE
      );
    }
    // Article 5(1)(c) requires BOTH reroute conditions for the exemption: the
    // rerouted flight must depart no more than one hour before the original
    // scheduled departure (two hours for 7-14 days' notice) AND arrive no more
    // than two hours after (four hours for 7-14 days' notice). Either value
    // unknown means the exemption cannot be established -> needs-info.
    // Article 5(1)(c) exempts the airline only when it OFFERED rerouting within the
    // notice-window limits. Three distinct states matter, and conflating them was a
    // real defect: an explicitly absent offer means the exemption cannot apply at all
    // (compensation stands), while an unknown offer or unknown times means the facts
    // needed to decide the exemption are missing (needs-info).
    const reroutingStatus = f.reroutingStatus;
    const reroute = toRerouteOffsetOrNull(f.reroutedArrivalDelayHours);
    const rerouteDep = toRerouteOffsetOrNull(f.reroutedDepartureOffsetHours);
    // Article 5(1)(c)(ii)-(iii) requires the reroute to arrive LESS than four (or two)
    // hours late and to depart no more than two (or one) hours early — the arrival
    // bound is strict, the departure bound is inclusive.
    const windowExemptArrive = notice >= 7 ? 4 : 2;
    const windowExemptDepart = notice >= 7 ? 2 : 1;
    // Both reroute offsets are signed relative to the original schedule: negative
    // means earlier, 0 means on time (or later, which is equally compliant for
    // departures), positive means later. The Article 5(1)(c) departure bound is
    // therefore a LOWER bound: the reroute must not depart more than
    // windowExemptDepart hours early, i.e. offset >= -windowExemptDepart.
    const rerouteOk =
      reroute !== null && reroute !== UNKNOWN_REROUTE &&
      rerouteDep !== null && rerouteDep !== UNKNOWN_REROUTE &&
      reroute < windowExemptArrive && rerouteDep >= -windowExemptDepart;
    const rerouteArrivalHours = reroute;
    if (reroutingStatus === "unknown" || reroutingStatus === undefined || reroutingStatus === null) {
      return needsInfo(
        "Whether the airline offered a replacement flight (re-routing) is not stated. The Article 5(1)(c) exemption depends on whether a compliant re-routing was offered — did the airline provide or arrange any alternative flight?"
      );
    }
    if (reroutingStatus === "not-offered") {
      return {
        eligibility: "eligible",
        compensationAmount: base,
        currency: currency,
        legalBasis:
          "EU Regulation 261/2004, Articles 5(1)(c) and 7(1) (cancellation without a re-routing offer); UK261 equivalent",
        decisionReason:
          "The cancellation was notified " + notice + " days before departure, inside the Article 5(1)(c) window, and the account states that no re-routing was offered. The Article 5(1)(c) exemption requires the airline to have offered a compliant replacement flight, so with no offer it cannot apply — fixed compensation stands at the full tier amount (" + tierLabel(f.distanceTier) + "), with no Article 7(2) reduction because no re-routing was offered.",
        dutyOfCare: CANCELLATION_CARE,
      };
    }
    if (reroute === null || reroute === UNKNOWN_REROUTE || rerouteDep === null || rerouteDep === UNKNOWN_REROUTE) {
      return needsInfo(
        "For the Article 5(1)(c) exemption, both rerouting facts are needed: how late the replacement flight arrived compared to the original schedule, and how much earlier it departed (the exemption allows at most " + windowExemptDepart + " hour(s) early departure and " + windowExemptArrive + " hours late arrival for a cancellation notified " + notice + " days ahead). How did the re-routing times compare to your original schedule?"
      );
    }
    if (rerouteOk) {
      return notEligible(
        "EU Regulation 261/2004, Article 5(1)(c)(" + (notice >= 7 ? "ii" : "iii") + ") (notice within the compensation window with compliant re-routing); UK261 equivalent",
        "The cancellation was notified " + notice + " days ahead (inside the Article 5(1)(c) window) and the re-routing arrived " + rerouteArrivalHours + " hours late — within the " + windowExemptArrive + "-hour arrival allowance (and no more than " + windowExemptDepart + " hour(s) early departure) for that notice period — which exempts the airline from compensation.",
        CANCELLATION_CARE
      );
    }
    // Inside the notice window without a proven compliant reroute, compensation stands.
    // Article 7(2) then halves it where the offered re-routing still arrived within
    // the tier limit (2h short / 3h medium / 4h long, inclusive) — the reduction is
    // conditioned only on the arrival time, so it applies whether the exemption
    // failed on the arrival bound or the departure bound. The burden of proving the
    // reroute complied sits with the airline either way.
    const art72Limit = ART72_LIMIT[f.distanceTier];
    const withinArt72 = reroute <= art72Limit;
    const amount = withinArt72 ? Math.round(base / 2) : base;
    return {
      eligibility: "eligible",
      compensationAmount: amount,
      currency: currency,
      legalBasis: withinArt72
        ? "EU Regulation 261/2004, Articles 5(1)(c) and 7(2) (cancellation with re-routing arriving within the " + art72Limit + "-hour tier limit); UK261 equivalent"
        : "EU Regulation 261/2004, Articles 5(1)(c) and 7(1) (cancellation without compliant notice or re-routing); UK261 equivalent",
      decisionReason: withinArt72
        ? "The cancellation was notified " + notice + " days before departure, inside the Article 5(1)(c) window, and the re-routing does not meet the exemption limits (it arrived " + rerouteArrivalHours + " hours late against a " + windowExemptArrive + "-hour allowance, or departed more than " + windowExemptDepart + " hour(s) early). The replacement did arrive within " + art72Limit + " hours of the original schedule, so the compensation is halved to 50% of the " + tierLabel(f.distanceTier) + " tier amount under Article 7(2). The airline bears the burden of proving the re-routing complied."
        : "The cancellation was notified " + notice + " days before departure, inside the Article 5(1)(c) window, and the re-routing does not meet the exemption limits (it arrived " + rerouteArrivalHours + " hours late against a " + windowExemptArrive + "-hour allowance, or departed more than " + windowExemptDepart + " hour(s) early). The replacement also exceeded the Article 7(2) " + art72Limit + "-hour tier limit, so the full fixed compensation applies by distance tier (" + tierLabel(f.distanceTier) + "). The airline bears the burden of proving the re-routing complied.",
      dutyOfCare: CANCELLATION_CARE,
    };
  }

  if (f.disruptionType === "denied-boarding") {
    // Article 2(j) defines denied boarding as a refusal to carry passengers on a flight,
    // although they have presented themselves for boarding, except where there are
    // reasonable grounds to deny them boarding, such as reasons of health, safety or
    // security, or inadequate travel documentation. Refusal on reasonable grounds
    // excludes both compensation and care rights under the regulation.
    const dbReason = f.deniedBoardingReason;
    if (dbReason === "reasonable-grounds") {
      return notEligible(
        "EU Regulation 261/2004, Article 2(j) (refusal of carriage on reasonable grounds); UK261 equivalent",
        "Boarding was denied on reasonable grounds under Article 2(j) (such as reasons of health, safety, security, or inadequate travel documentation). Under EU261/UK261, refusal of carriage on these statutory grounds is excluded from the definition of denied boarding and does not qualify for cash compensation or assistance.",
        null
      );
    }
    if (dbReason === "unknown" || dbReason === undefined || dbReason === null || dbReason === "") {
      return needsInfo(
        "The reason boarding was denied is missing or unknown. Article 2(j) excludes refusal of carriage on reasonable grounds (such as health, safety, security, or inadequate travel documentation). Did the airline deny boarding due to commercial/operational reasons (e.g. overbooking) against your will, or on reasonable grounds under Article 2(j)?"
      );
    }
    if (dbReason !== "compensable-involuntary") {
      return needsInfo(
        "The reason boarding was denied is unclear. Under Article 2(j), compensation applies only to involuntary denial of boarding (e.g. overbooking), not where carriage is refused on reasonable grounds (health, safety, security, or travel documents)."
      );
    }

    // Article 4(3) sends involuntary denied-boarding compensation to Article 7, and
    // Article 7(2) permits a 50% reduction when the passenger received Article 8
    // re-routing arriving within the tier limit (2/3/4 hours) — the provision is not
    // limited to cancellations. There is no notice-window exemption here (that is
    // Article 5(1)(c), cancellation-only) and no extraordinary-circumstances defense
    // (Article 4(3)). Voluntary surrender for vouchers voids the right entirely.
    const dbReroutingStatus = f.reroutingStatus;
    if (dbReroutingStatus === "unknown" || dbReroutingStatus === undefined || dbReroutingStatus === null || dbReroutingStatus === "") {
      return needsInfo(
        "Whether the airline re-booked you on another flight after boarding was denied is not stated. Under Article 7(2), the fixed compensation for involuntary denied boarding is reduced by 50% when the replacement flight arrived within the distance-tier limit (2 hours for short routes, 3 for medium, 4 for long) of the original schedule — did the airline provide or arrange any replacement flight, and how late did it arrive compared to your original arrival time?"
      );
    }
    if (dbReroutingStatus === "not-offered") {
      return {
        eligibility: "eligible",
        compensationAmount: base,
        currency: currency,
        legalBasis:
          "EU Regulation 261/2004, Article 4(3) with Article 7(1) (involuntary denied boarding without re-routing); UK261 equivalent",
        decisionReason:
          "Boarding was denied against the passenger's will for commercial or operational reasons (involuntary denied boarding) without Article 2(j) reasonable grounds, and no re-routing was offered. The full fixed compensation applies by distance tier (" +
          tierLabel(f.distanceTier) + ") with no notice exemption or extraordinary-circumstances defense, and no Article 7(2) reduction because no re-routing was provided. Voluntary surrender in exchange for vouchers voids this — only involuntary denial qualifies.",
        dutyOfCare:
          "As an involuntarily denied boarding passenger, the Article 8 choice applies immediately — re-routing at the earliest opportunity, re-routing at a later date, or a refund of the ticket — together with Article 9 care while waiting: meals and refreshments proportionate to the wait, hotel accommodation and transfers if an overnight stay becomes necessary, and two free communications.",
      };
    }
    // dbReroutingStatus === "offered": Article 7(2) reduces the compensation by 50%
    // only when the replacement arrived within the tier-specific limit; beyond it,
    // the full amount stands. Unknown arrival times cannot support a reduction.
    const dbRerouteArrival = toRerouteOffsetOrNull(f.reroutedArrivalDelayHours);
    if (dbRerouteArrival === null || dbRerouteArrival === UNKNOWN_REROUTE) {
      return needsInfo(
        "The account says the airline re-booked you on another flight after boarding was denied, but not how late that replacement arrived compared to your original arrival time. Under Article 7(2), the fixed compensation is reduced by 50% only when the replacement arrived within the distance-tier limit (2 hours for short routes, 3 for medium, 4 for long) — about how many hours late did the replacement flight arrive at your final destination?"
      );
    }
    const dbArt72Limit = ART72_LIMIT[f.distanceTier];
    const dbWithinArt72 = dbRerouteArrival <= dbArt72Limit;
    const dbAmount = dbWithinArt72 ? Math.round(base / 2) : base;
    return {
      eligibility: "eligible",
      compensationAmount: dbAmount,
      currency: currency,
      legalBasis: dbWithinArt72
        ? "EU Regulation 261/2004, Article 4(3) with Article 7(2) (involuntary denied boarding with re-routing arriving within the " + dbArt72Limit + "-hour tier limit); UK261 equivalent"
        : "EU Regulation 261/2004, Article 4(3) with Article 7(1) (involuntary denied boarding with re-routing beyond the tier limit); UK261 equivalent",
      decisionReason: dbWithinArt72
        ? "Boarding was denied against the passenger's will for commercial or operational reasons (involuntary denied boarding) without Article 2(j) reasonable grounds, and the airline re-booked the passenger on a replacement that arrived " + dbRerouteArrival + " hours after the original schedule — within the Article 7(2) " + dbArt72Limit + "-hour limit for a " + tierLabel(f.distanceTier) + " route — so the fixed compensation is reduced by 50%. There is no notice exemption or extraordinary-circumstances defense for denied boarding. Voluntary surrender in exchange for vouchers voids this — only involuntary denial qualifies."
        : "Boarding was denied against the passenger's will for commercial or operational reasons (involuntary denied boarding) without Article 2(j) reasonable grounds, and the airline re-booked the passenger on a replacement that arrived " + dbRerouteArrival + " hours after the original schedule — beyond the Article 7(2) " + dbArt72Limit + "-hour limit for a " + tierLabel(f.distanceTier) + " route — so the full fixed compensation applies by distance tier. There is no notice exemption or extraordinary-circumstances defense for denied boarding. Voluntary surrender in exchange for vouchers voids this — only involuntary denial qualifies.",
      dutyOfCare:
        "As an involuntarily denied boarding passenger, the Article 8 choice applies immediately — re-routing at the earliest opportunity, re-routing at a later date, or a refund of the ticket — together with Article 9 care while waiting: meals and refreshments proportionate to the wait, hotel accommodation and transfers if an overnight stay becomes necessary, and two free communications.",
    };
  }

  // Remaining case: downgrade. Article 10(2) requires a refund of 30/50/75% of the
  // price paid for the downgraded segment, by distance tier. The refund is computed
  // only when BOTH the price and its currency were extracted — a percentage of an
  // unstated price, or a price in an unknown currency, is not a claimable amount.
  const PERCENT = { short: 30, medium: 50, long: 75 };
  const percent = PERCENT[f.distanceTier];
  const price = toNumberOrNullSentinel(f.ticketPrice);
  const ticketCurrency = toTicketCurrency(f.ticketCurrency);
  if (price === null || price === UNKNOWN || price <= 0) {
    return needsInfo(
      "The ticket was downgraded. Article 10(2) requires a refund of " + percent + "% of the price paid for the " +
      tierLabel(f.distanceTier) + " tier. The price paid for the downgraded segment was not stated — provide the full price of that segment (not just the fare difference) so the exact refund can be computed."
    );
  }
  if (ticketCurrency === null) {
    return needsInfo(
      "The ticket was downgraded. Article 10(2) requires a refund of " + percent + "% of the price paid for the " +
      tierLabel(f.distanceTier) + " tier. The price is known but the currency it was paid in is not stated — confirm the currency (for example EUR or GBP) so the exact refund can be computed."
    );
  }
  const refund = toRefundUnits(price, percent, ticketCurrency);
  if (refund === 0) {
    return needsInfo(
      "The ticket was downgraded. Article 10(2) sets a refund of " + percent + "% of the price paid for the " +
      tierLabel(f.distanceTier) + " tier, but on the stated price of " + price + " " + ticketCurrency + " that percentage rounds below the smallest unit of the currency, so no refund amount can be paid. Confirm the ticket price (the full price of the downgraded segment, not just the fare difference) so the refund can be computed."
    );
  }
  return {
    eligibility: "eligible",
    compensationAmount: refund,
    currency: ticketCurrency,
    legalBasis:
      "EU Regulation 261/2004, Article 10(2) (downgrade reimbursement); UK261 equivalent",
    decisionReason:
      "The ticket was downgraded on a " + tierLabel(f.distanceTier) + " route, where Article 10(2) sets a refund of " + percent + "% of the price paid. On a stated price of " + price + " " + ticketCurrency + ", the reimbursement is " + refund + " " + ticketCurrency + ", payable within seven days by the means provided for in Article 7(3) (cash, electronic bank transfer, bank orders or bank cheques, or travel vouchers with the passenger's signed agreement). No extraordinary-circumstances defense applies to a downgrade refund.",
    dutyOfCare:
      "Article 10(2) reimbursement is the remedy for a downgrade. The Article 8/9 re-routing and care rights attach to cancellations and long waiting times, not to a completed flight in a lower cabin, so the flow does not assert them here.",
  };
}

function tierLabel(tier) {
  if (tier === "short") return "≤ 1,500 km";
  if (tier === "medium") return "1,500–3,500 km";
  return "over 3,500 km";
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
  reroutedArrivalDelayHours: {{InstructorLLMNode_210.output.reroutedArrivalDelayHours}},
  reroutedDepartureOffsetHours: {{InstructorLLMNode_210.output.reroutedDepartureOffsetHours}},
  reroutingStatus: {{InstructorLLMNode_210.output.reroutingStatus}},
  cause: {{InstructorLLMNode_210.output.cause}},
  causeText: {{InstructorLLMNode_210.output.causeText}},
  ticketPrice: {{InstructorLLMNode_210.output.ticketPrice}},
  ticketCurrency: {{InstructorLLMNode_210.output.ticketCurrency}},
  distanceTier: {{InstructorLLMNode_210.output.distanceTier}},
  deniedBoardingReason: {{InstructorLLMNode_210.output.deniedBoardingReason}}
});
