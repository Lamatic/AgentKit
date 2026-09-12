# Flight Comp Copilot

Paste what happened to your flight. Get back an EU261/UK261 compensation assessment: the exact statutory amount (€250/€400/€600 or £220/£350/£520), the legal basis, and a ready-to-send claim letter — or an honest explanation of why no compensation is owed, and what rights you still have.

A single Lamatic flow, submitted as an **AgentKit template**. The problem is original to this repository: no existing kit assesses air-passenger compensation claims.

---

## Problem

Under EU Regulation 261/2004 and its UK-retained equivalent, passengers whose flights arrive at their final destination at least 3 hours late, flights cancelled at short notice, or flights where passengers are involuntarily denied boarding (often because of overbooking) are owed fixed cash compensation by distance tier when the regulation's conditions are met; downgraded flights are owed a reimbursement of 30–75% of the ticket price. Most eligible passengers never claim. Three things stop them:

- The rules are conditional: the payout depends on route distance, notice period, arrival delay, and cause, so passengers can't tell whether their case qualifies.
- Commercial claim agencies (AirHelp, Flightright, etc.) charge 25–35% of the payout to work the rules out.
- Airlines reject first claims with boilerplate that cites "extraordinary circumstances" whether or not it legally applies.

## Solution

A single flow that splits the work into two layers:

1. **Extraction (LLM, schema-validated)** — turns the messy free-text account ("AF1980 CDG→JFK, hydraulic fault, landed 4.5h late") into structured facts: airline, route, dates, disruption type, arrival delay, notice period, cause, distance tier.
2. **The rules (deterministic code)** — a code node applies the regulation's money rules: distance-tier amounts, the 3-hour delay threshold, cancellation notice windows, the 50% Article 7(2) reduction for re-routed cancellations that still arrive within the tier limit, downgrade percentages (computed from the stated ticket price), and the extraordinary-circumstances exclusion.

The language model never directly selects the verdict or the amount — every verdict comes from the rule engine, and the letter-drafting stage receives that verdict as authoritative input. One honest limitation: the extracted facts are model output and an untrusted input to the rules. Schema validation checks structure, not factual accuracy, so a wrong extracted value (a mis-tiered route, a misread delay) can still produce a wrong assessment. The response returns `distanceKmEstimate` and the full fact set so borderline calls can be checked.

Three outcomes, three different letters:

| Verdict | Letter |
|---|---|
| `eligible` | Formal claim letter citing the exact articles, the computed amount, a 14-day payment deadline, and escalation paths (NEB / CAA PACT / small-claims court) |
| `not-eligible` | Plain-language explanation of which threshold or exemption applies, plus the duty-of-care and refund rights that survive anyway — and a note that the airline carries the legal burden of proving "extraordinary circumstances" |
| `needs-info` | A short list of the specific facts that would decide the case, phrased as one-line questions |

## How it works (built on Lamatic)

```text
API Request → Extract & Classify (InstructorLLMNode, schema-validated)
            → Rule Engine (codeNode, deterministic EU261/UK261 rules)
            → Eligibility Branch (conditionNode)
               ├─ eligible      → Draft Claim (LLMNode)
               ├─ not-eligible  → Draft Rejection Explanation (LLMNode)
               └─ needs-info    → Draft Info Request (LLMNode)
            → Assemble Output (codeNode) → API Response
```

The rule engine implements, with article citations in comments:

- **Article 7(1)** — fixed amounts by tier: ≤1,500 km / 1,500–3,500 km / >3,500 km (250/400/600 EUR; 220/350/520 GBP under UK261)
- **Article 7(2)** — the 50% reduction for re-routed cancellations arriving within the tier limit (2h short / 3h medium / 4h long); ordinary delays are never halved
- **Article 5(1)(c)** — the 14-day and 7–14-day cancellation notice exemptions, including the compliant re-routing test
- **Article 4(3)** — involuntary denied boarding (no halving, no notice exemption)
- **Article 10(2)** — downgrade refunds at 30/50/75% of ticket price
- **Article 5(3) + CJEU Wallentin-Hermann** — extraordinary circumstances exclude compensation, but only genuinely external causes count; technical faults and crew shortages don't, and the burden of proof is the airline's

## Quickstart

1. Sign in to [Lamatic Studio](https://studio.lamatic.ai) and create a project.
2. Recreate or import the flow from `flows/flight-comp-assessment.ts` (9 nodes, wired as above). The prompt files, scripts, and model configs are referenced via `@` paths and sit in their sibling directories.
3. Connect an LLM provider (e.g. OpenAI) and assign a generative model to each of the four model inputs — the model configs ship with `gpt-4o-mini` via OpenAI as tested.
4. Deploy the flow.
5. Invoke it with a payload containing `disruptionText` and `additionalContext`:

   ```json
   { "disruptionText": "Air France AF1980, CDG to JFK, scheduled 2026-07-14 19:30. Delayed by a hydraulic fault, departed 02:10 next morning, landed about 4.5 hours late. Only meal vouchers offered.", "additionalContext": "Booking reference XZ7T2P." }
   ```

Then read `result`: the verdict (`eligible`), the amount (`600` EUR — long-haul, an arrival delay over 3 hours takes the full tier amount, technical fault is airline-controllable), the extracted facts, and the claim letter.

## Files

| Path | Purpose |
|---|---|
| `flows/flight-comp-assessment.ts` | The flow: trigger, extraction, rule engine, branch, three drafts, assemble, response |
| `scripts/flight-comp-assessment_rule-engine.ts` | Deterministic EU261/UK261 rules with article citations |
| `scripts/flight-comp-assessment_assemble-output.ts` | Merges facts, verdict, and letter into the response |
| `prompts/*.md` | Extraction prompt + three letter-drafting prompt pairs |
| `model-configs/*.ts` | Per-node model assignments (tested with `gpt-4o-mini` / OpenAI) |
| `constitutions/default.md` | Guardrails: claim integrity, no invented amounts, injection resistance |

## Scope and honest limits

- Covers EU261 and UK261 only: flights departing the EU/UK, or arriving there on an EU/UK carrier. US DOT rules, APPR (Canada), and other jurisdictions are out of scope by design.
- Assesses past disruptions; it is not a real-time flight tracker.
- Duty-of-care reimbursements (meals, hotels) are flagged as rights but receipts are not summed.
- Distance tiers rely on the extraction model's geographic estimate; the response includes `distanceKmEstimate` so borderline calls can be checked.
- This is a decision-support tool, not legal advice; the generated letter is a draft for the passenger to review and send.

## Acknowledgements

Compensation amounts and rules from EU Regulation 261/2004 and The Air Passenger Rights and Air Travel Organisers' Licensing (Amendment) (EU Exit) Regulations 2019 (UK261). Extraordinary-circumstances interpretation from CJEU Wallentin-Hermann (C-549/07) and van der Lans (C-257/14). Sturgeon (C-402/07) established that 3+ hour delays are treated as cancellations for compensation purposes.
