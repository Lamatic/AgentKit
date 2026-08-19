import { computeDeadlineUrgency } from "./deadline-urgency";
import type { AppealResult } from "./types";

export interface ExampleScenario {
  id: string;
  label: string;
  denialText: string;
  additionalContext: string;
}

/**
 * Renders a date `days` away from now as `YYYY-MM-DD`.
 *
 * Called per request rather than once at module load: a warm serverless instance can
 * live for hours or days, and baking the dates in at import time would drift the demo's
 * notice dates and deadlines out of date (eventually showing an example as long expired).
 */
function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  // Formatted from local calendar components, not toISOString(): setDate() applies the
  // offset in local time, so converting to UTC afterwards shifts the result onto the
  // next day for anyone east of the date line at that moment (e.g. 8pm EDT would emit
  // tomorrow's date). computeDeadlineUrgency reads these back as local dates.
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

/** Builds the example scenarios with deadlines relative to today. */
export function getExampleScenarios(): ExampleScenario[] {
  return [
    {
      id: "medical-necessity",
      label: "Medical necessity — inpatient rehab",
      denialText: `Claim #A88213: Denied. Reason: The requested inpatient rehabilitation stay following hip replacement surgery was determined not medically necessary based on plan clinical guidelines. You may appeal this decision in writing within 180 days of the date of this notice (notice date: ${daysFromNow(-5)}).`,
      additionalContext:
        "Patient's orthopedic surgeon recommended inpatient rehab due to mobility limitations, fall risk at home, and living alone with stairs as the only access to the bathroom.",
    },
    {
      id: "administrative",
      label: "Administrative — missing prior authorization",
      denialText: `Claim #B41209: Denied. Reason: Prior authorization was not obtained before the MRI (CPT 73721) was performed. Per plan policy, appeals must be submitted within 60 days of this notice (notice date: ${daysFromNow(-50)}).`,
      additionalContext:
        "The MRI was ordered and performed the same day during an urgent care visit for sudden-onset severe knee pain after a fall; the ordering physician's office states prior-auth was not feasible given the urgency.",
    },
    {
      id: "coverage",
      label: "Coverage — out-of-network provider",
      denialText: `Claim #C77002: Denied. Reason: Service was rendered by an out-of-network provider and is not covered under the plan's out-of-network benefit. Appeal deadline: ${daysFromNow(20)}.`,
      additionalContext:
        "No in-network specialist for this condition was available within 75 miles or within 6 weeks; patient's PCP referred them to the nearest available specialist, who was out-of-network.",
    },
  ];
}

/** Deadlines are stored as day offsets and resolved per request — see `daysFromNow`. */
type DemoResult = Omit<AppealResult, "daysRemaining" | "urgencyLevel" | "appealDeadline"> & {
  appealDeadlineOffsetDays: number;
};

const DEMO_RESULTS: Record<string, DemoResult> = {
  "medical-necessity": {
    denialCategory: "medical-necessity",
    claimNumber: "A88213",
    denialReasonText: "Inpatient rehabilitation stay was determined not medically necessary per plan clinical guidelines.",
    appealDeadlineOffsetDays: 175,
    appealLetter: `[Date]

Re: Formal Appeal of Denied Claim #A88213 — Inpatient Rehabilitation Services

To Whom It May Concern,

I am writing to formally appeal the denial of claim #A88213 for inpatient rehabilitation services following [Patient Name]'s hip replacement surgery. The denial states the stay was "not medically necessary based on plan clinical guidelines."

The treating orthopedic surgeon determined that inpatient rehabilitation was medically necessary given the patient's post-surgical mobility limitations, elevated fall risk, and a home environment where the only bathroom access requires navigating stairs. I request the specific clinical review criteria your plan applied in reaching this determination.

I further request a peer-to-peer review between the treating provider and your medical director prior to a final decision on this appeal. I am prepared to submit supporting clinical documentation from the treating provider upon request.

Please respond in writing within the appeal window noted in your original denial notice, and specify the exact plan or policy provision relied upon.

Sincerely,
[Patient Name]`,
    strengthScore: 6,
    missingEvidence: [
      "Physician letter of medical necessity describing fall risk and home safety concerns",
      "Post-surgical mobility assessment or physical therapy evaluation",
      "Documentation of home environment (stairs, lack of accessible bathroom)",
    ],
    rationale:
      "The clinical argument is reasonable and specific, but the letter currently asserts medical necessity without attaching supporting documentation. A physician's letter and a mobility assessment would substantially strengthen this appeal.",
  },
  administrative: {
    denialCategory: "administrative",
    claimNumber: "B41209",
    denialReasonText: "Prior authorization was not obtained before the MRI (CPT 73721) was performed.",
    appealDeadlineOffsetDays: 10,
    appealLetter: `[Date]

Re: Formal Appeal of Denied Claim #B41209 — MRI, CPT 73721

To Whom It May Concern,

I am writing to formally appeal the denial of claim #B41209 for an MRI (CPT 73721), denied for lack of prior authorization.

This MRI was ordered and performed the same day during an urgent care visit for sudden-onset severe knee pain following a fall. Prior authorization was not obtainable given the urgent nature of the visit. I am requesting retroactive authorization on the basis of medical urgency, and I ask that you confirm this service would otherwise meet your plan's medical necessity standard for this diagnosis.

Please respond in writing before the appeal deadline stated in your original notice, and confirm the specific prior-authorization policy provision that applies to urgent same-day imaging.

Sincerely,
[Patient Name]`,
    strengthScore: 5,
    missingEvidence: [
      "Urgent care visit record showing same-day onset and MRI order",
      "Ordering physician's note confirming urgency precluded prior authorization",
      "Plan's own prior-authorization policy language regarding urgent/emergency exceptions",
    ],
    rationale:
      "Urgency is a recognized basis for retroactive authorization, but the appeal needs the visit record and physician note attached to substantiate the timeline before an insurer is likely to grant an exception.",
  },
  coverage: {
    denialCategory: "coverage",
    claimNumber: "C77002",
    denialReasonText: "Service was rendered by an out-of-network provider and is not covered under the out-of-network benefit.",
    appealDeadlineOffsetDays: 20,
    appealLetter: `[Date]

Re: Formal Appeal of Denied Claim #C77002 — Out-of-Network Coverage Exception Request

To Whom It May Concern,

I am writing to formally appeal the denial of claim #C77002, denied on the basis that the provider was out-of-network.

No in-network specialist for this condition was available within 75 miles or within a 6-week timeframe. My primary care physician referred me to the nearest available specialist, who is out-of-network, because no reasonable in-network alternative existed. I am requesting a network-adequacy exception on this basis, and I ask that you confirm which in-network providers you consider to have met this need within a comparable distance and timeframe.

Please respond in writing before the appeal deadline stated in your original notice, and cite the specific plan provision governing network-adequacy exceptions.

Sincerely,
[Patient Name]`,
    strengthScore: 7,
    missingEvidence: [
      "Written referral from PCP naming the out-of-network specialist and the reason",
      "List of in-network providers contacted, with distances and earliest available appointment dates",
      "Copy of the plan's network-adequacy exception policy language",
    ],
    rationale:
      "A documented, specific network search (who was contacted, how far, how long the wait) is the single strongest lever for a network-adequacy exception — attaching it would likely move this appeal into the 8-9 range.",
  },
};

/** Builds a demo result with its deadline resolved relative to today. */
export function getDemoResult(scenarioId: string): AppealResult {
  const { appealDeadlineOffsetDays, ...base } =
    DEMO_RESULTS[scenarioId] ?? DEMO_RESULTS["medical-necessity"];
  const appealDeadline = daysFromNow(appealDeadlineOffsetDays);
  return { ...base, appealDeadline, ...computeDeadlineUrgency(appealDeadline) };
}
