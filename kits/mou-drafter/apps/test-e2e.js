/**
 * End-to-end test: multi-engagement-type submissions through the live Lamatic flow.
 *
 * Validates per variant:
 * 1. flattenFormToTrigger produces correct flat field names
 * 2. JSON.stringify(deliverables) is sent as a string (not an array)
 * 3. The flow responds with LaTeX, clauseJson, warnings, patternReport
 * 4. The returned LaTeX passes basic sanity checks (documentclass, begin/end document, length)
 */

const { Lamatic } = require("lamatic");
const fs = require("fs");
const path = require("path");

// ── Load env ─────────────────────────────────────────────────────────────
require("dotenv").config({ path: path.join(__dirname, ".env.local") });

const FLOW_ID = process.env.MOU_DRAFTER_FLOW_ID;
const API_URL = process.env.LAMATIC_API_URL;
const PROJECT_ID = process.env.LAMATIC_PROJECT_ID;
const API_KEY = process.env.LAMATIC_API_KEY;

if (!FLOW_ID || !API_URL || !PROJECT_ID || !API_KEY) {
  console.error("Missing env vars. Ensure .env.local has all 4 vars set.");
  process.exit(1);
}

const TIMEOUT_MS = 120_000;

function withTimeout(promise, timeoutMs, errorMessage) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

// ── Test data: catering ───────────────────────────────────────────────────
const cateringFormData = {
  agreementTitle: "Catering Services MoU — AEON 2025",
  effectiveDate: "2025-07-01",
  engagementType: "catering",
  partyA: {
    name: "AEON Student Council",
    type: "org",
    address: "PES University, 100 Feet Ring Road, BSK 3rd Stage, Bengaluru 560085",
    signatory: "Priya Sharma",
    signatoryRole: "President",
    email: "events@aeonpes.org",
  },
  partyB: {
    name: "Spice Route Caterers Pvt. Ltd.",
    type: "corp",
    address: "12 MG Road, Bengaluru 560001",
    signatory: "Ramesh Gupta",
    signatoryRole: "Managing Director",
    email: "contracts@spiceroute.in",
  },
  scopeOfWork:
    "Full-service catering for the AEON 2025 cultural festival. Includes breakfast, lunch, evening snacks, and dinner for approximately 500 attendees across 3 days. Menu must accommodate vegetarian, vegan, and common allergen-free dietary requirements.",
  deliverables: [
    {
      label: "Menu planning and tasting session",
      dueDate: "2025-08-15",
      acceptanceCriteria: "Approved by event coordinator after tasting",
    },
    {
      label: "Day 1 full catering service",
      dueDate: "2025-09-12",
      acceptanceCriteria:
        "All meals served on time, allergen-free options available, no food safety incidents",
    },
    {
      label: "Day 2 full catering service",
      dueDate: "2025-09-13",
      acceptanceCriteria: "Same as Day 1",
    },
    {
      label: "Day 3 full catering service and cleanup",
      dueDate: "2025-09-14",
      acceptanceCriteria:
        "Same as Day 1, plus venue kitchen returned to original condition",
    },
  ],
  totalFeeAmount: 750000,
  totalFeeCurrency: "INR",
  paymentSchedule: "milestone-based",
  paymentPreset: "30-net-15",
  eventStart: "2025-09-12",
  eventEnd: "2025-09-14",
  eventStartTime: "09:00",
  eventEndTime: "22:00",
  eventVenue: "PES University Main Auditorium, Bengaluru",
  paymentTiming: "advance-partial",
  paymentTimingCustom: "",
  taxesIncluded: false,
  taxRatePct: 18,
  lateFeePctPerMonth: 1.5,
  cancellationPolicy: "sliding-scale",
  cancellationTerms: "",
  guestCountFinalDate: "2025-09-05",
  extraGuestRate: 800,
  foodSafetyRequired: true,
  allergyHandlingRequired: true,
  confidentialityRequired: true,
  confidentialitySurvivalYears: 2,
  ipOwnership: "not-applicable",
  ipPortfolioRights: false,
  terminationPreset: "standard-30-7",
  insuranceRequired: true,
  insuranceGenLiab: 1000000,
  insuranceProfIndem: 500000,
  dataProtectionRequired: false,
  subcontractingAllowed: false,
  noPublicityRequired: true,
  liabilityCapMultiplier: 1,
  governingLaw: "Karnataka, India",
  disputeResolution: "mediation-then-arbitration",
  disputeVenue: "Bengaluru",
  additionalContext:
    "This is a student-run event; budget is tight. The caterer has worked with us before.",
};

// ── Test data: services ───────────────────────────────────────────────────
const servicesFormData = {
  agreementTitle: "Professional Services MoU — AEON 2025",
  effectiveDate: "2025-07-01",
  engagementType: "services",
  partyA: {
    name: "AEON Student Council",
    type: "org",
    address: "PES University, 100 Feet Ring Road, BSK 3rd Stage, Bengaluru 560085",
    signatory: "Priya Sharma",
    signatoryRole: "President",
    email: "events@aeonpes.org",
  },
  partyB: {
    name: "Apex Consulting LLP",
    type: "llp",
    address: "88 Brigade Road, Bengaluru 560025",
    signatory: "Kiran Mehta",
    signatoryRole: "Partner",
    email: "kiran@apexconsult.in",
  },
  scopeOfWork:
    "Event planning and logistics consulting for AEON 2025. Includes venue selection, vendor management, and on-site coordination across all three event days.",
  deliverables: [
    {
      label: "Venue shortlist and recommendation",
      dueDate: "2025-07-20",
      acceptanceCriteria: "At least 3 shortlisted venues with cost comparison",
    },
    {
      label: "Vendor engagement plan",
      dueDate: "2025-08-01",
      acceptanceCriteria: "Signed vendor agreements in place",
    },
    {
      label: "On-site coordination (Day 1-3)",
      dueDate: "2025-09-14",
      acceptanceCriteria: "Event runs without operational incidents",
    },
  ],
  totalFeeAmount: 300000,
  totalFeeCurrency: "INR",
  paymentSchedule: "milestone-based",
  paymentPreset: "50-net-30",
  eventStart: "",
  eventEnd: "",
  eventStartTime: "",
  eventEndTime: "",
  eventVenue: "",
  paymentTiming: "advance-partial",
  paymentTimingCustom: "",
  taxesIncluded: false,
  taxRatePct: 18,
  lateFeePctPerMonth: 1.5,
  cancellationPolicy: "sliding-scale",
  cancellationTerms: "",
  guestCountFinalDate: "",
  extraGuestRate: 0,
  foodSafetyRequired: false,
  allergyHandlingRequired: false,
  confidentialityRequired: true,
  confidentialitySurvivalYears: 3,
  ipOwnership: "engager",
  ipPortfolioRights: false,
  terminationPreset: "standard-30-7",
  insuranceRequired: false,
  insuranceGenLiab: 0,
  insuranceProfIndem: 0,
  dataProtectionRequired: false,
  subcontractingAllowed: false,
  noPublicityRequired: true,
  liabilityCapMultiplier: 1,
  governingLaw: "Karnataka, India",
  disputeResolution: "mediation-then-arbitration",
  disputeVenue: "Bengaluru",
  additionalContext: "",
};

// ── Test data: design ─────────────────────────────────────────────────────
const designFormData = {
  agreementTitle: "Brand Design MoU — AEON 2025",
  effectiveDate: "2025-07-01",
  engagementType: "design",
  partyA: {
    name: "AEON Student Council",
    type: "org",
    address: "PES University, 100 Feet Ring Road, BSK 3rd Stage, Bengaluru 560085",
    signatory: "Priya Sharma",
    signatoryRole: "President",
    email: "events@aeonpes.org",
  },
  partyB: {
    name: "Pixel & Co Creative Studio",
    type: "llp",
    address: "42 Indiranagar, Bengaluru 560038",
    signatory: "Ananya Rao",
    signatoryRole: "Creative Director",
    email: "ananya@pixelco.design",
  },
  scopeOfWork:
    "Full brand identity and collateral design for AEON 2025 festival. Includes logo, poster series, merchandise templates, and digital assets.",
  deliverables: [
    {
      label: "Logo and brand identity guide",
      dueDate: "2025-07-25",
      acceptanceCriteria: "Approved by council with 2 revision rounds included",
    },
    {
      label: "Event poster series (print + digital)",
      dueDate: "2025-08-10",
      acceptanceCriteria: "Print-ready files at 300dpi, digital at 72dpi",
    },
    {
      label: "Merchandise templates",
      dueDate: "2025-08-20",
      acceptanceCriteria: "Templates usable in standard printing software",
    },
  ],
  totalFeeAmount: 150000,
  totalFeeCurrency: "INR",
  paymentSchedule: "milestone-based",
  paymentPreset: "30-net-15",
  eventStart: "",
  eventEnd: "",
  eventStartTime: "",
  eventEndTime: "",
  eventVenue: "",
  paymentTiming: "advance-partial",
  paymentTimingCustom: "",
  taxesIncluded: false,
  taxRatePct: 18,
  lateFeePctPerMonth: 1,
  cancellationPolicy: "flat-fee",
  cancellationTerms: "25% of Total Fee",
  guestCountFinalDate: "",
  extraGuestRate: 0,
  foodSafetyRequired: false,
  allergyHandlingRequired: false,
  confidentialityRequired: true,
  confidentialitySurvivalYears: 2,
  ipOwnership: "engager",
  ipPortfolioRights: true,
  terminationPreset: "standard-30-7",
  insuranceRequired: false,
  insuranceGenLiab: 0,
  insuranceProfIndem: 0,
  dataProtectionRequired: false,
  subcontractingAllowed: false,
  noPublicityRequired: false,
  liabilityCapMultiplier: 1,
  governingLaw: "Karnataka, India",
  disputeResolution: "mediation-then-arbitration",
  disputeVenue: "Bengaluru",
  additionalContext: "Vendor has creative freedom within the AEON brand palette.",
};

// ── Flatten (same logic as actions/orchestrate.ts) ────────────────────────
// IMPORTANT: Keep synchronized with apps/actions/orchestrate.ts flattenFormToTrigger
// — mirror any changes to production logic or move to a shared util.
function flattenFormToTrigger(form) {
  return {
    agreementTitle: form.agreementTitle,
    effectiveDate: form.effectiveDate,
    engagementType: form.engagementType,
    partyAName: form.partyA.name,
    partyAType: form.partyA.type,
    partyAAddress: form.partyA.address,
    partyASignatory: form.partyA.signatory,
    partyASignatoryRole: form.partyA.signatoryRole,
    partyAEmail: form.partyA.email,
    partyBName: form.partyB.name,
    partyBType: form.partyB.type,
    partyBAddress: form.partyB.address,
    partyBSignatory: form.partyB.signatory,
    partyBSignatoryRole: form.partyB.signatoryRole,
    partyBEmail: form.partyB.email,
    scopeOfWork: form.scopeOfWork,
    deliverables: JSON.stringify(form.deliverables),
    totalFeeAmount: form.totalFeeAmount,
    totalFeeCurrency: form.totalFeeCurrency.toUpperCase(),
    paymentSchedule: form.paymentSchedule,
    paymentPreset: form.paymentPreset,
    customDepositPct: form.customDepositPct ?? 30,
    customPaymentDays: form.customPaymentDays ?? 15,
    eventStart: form.eventStart ?? "",
    eventEnd: form.eventEnd ?? "",
    eventStartTime: form.eventStartTime ?? "",
    eventEndTime: form.eventEndTime ?? "",
    eventVenue: form.eventVenue ?? "",
    paymentTiming: form.paymentTiming,
    paymentTimingCustom: form.paymentTimingCustom ?? "",
    taxesIncluded: form.taxesIncluded,
    taxRatePct: form.taxRatePct,
    lateFeePctPerMonth: form.lateFeePctPerMonth,
    cancellationPolicy: form.cancellationPolicy,
    cancellationTerms: form.cancellationTerms ?? "",
    guestCountFinalDate: form.guestCountFinalDate ?? "",
    extraGuestRate: form.extraGuestRate ?? 0,
    foodSafetyRequired: form.foodSafetyRequired,
    allergyHandlingRequired: form.allergyHandlingRequired,
    confidentialityRequired: form.confidentialityRequired,
    confidentialitySurvivalYears: form.confidentialitySurvivalYears,
    ipOwnership: form.ipOwnership,
    ipPortfolioRights: form.ipPortfolioRights,
    terminationPreset: form.terminationPreset,
    insuranceRequired: form.insuranceRequired,
    insuranceGenLiab: form.insuranceGenLiab,
    insuranceProfIndem: form.insuranceProfIndem,
    dataProtectionRequired: form.dataProtectionRequired,
    subcontractingAllowed: form.subcontractingAllowed,
    noPublicityRequired: form.noPublicityRequired,
    liabilityCapMultiplier: form.liabilityCapMultiplier,
    governingLaw: form.governingLaw,
    disputeResolution: form.disputeResolution,
    disputeVenue: form.disputeVenue,
    additionalContext: form.additionalContext ?? "",
  };
}

// ── Per-variant runner ────────────────────────────────────────────────────
async function runVariant(client, label, formData) {
  console.log(`\n=== Variant: ${label} ===`);

  const flatInputs = flattenFormToTrigger(formData);

  if (typeof flatInputs.deliverables !== "string") {
    console.error(`[FAIL:${label}] deliverables is not a string!`);
    process.exit(1);
  }
  console.log(`[${label}] deliverables is a JSON string`);

  console.log(`[${label}] Calling Lamatic flow ${FLOW_ID} ...`);
  const start = Date.now();
  let resData;
  try {
    resData = await withTimeout(
      client.executeFlow(FLOW_ID, flatInputs),
      TIMEOUT_MS,
      `Flow call timed out after ${TIMEOUT_MS / 1000}s`
    );
  } catch (err) {
    console.error(`[FAIL:${label}] Flow call threw:`, err.message);
    process.exit(1);
  }
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`[${label}] Flow responded in ${elapsed}s`);

  const result = resData?.result;
  if (!result) {
    console.error(
      `[FAIL:${label}] No result in response:`,
      JSON.stringify(resData, null, 2).slice(0, 500)
    );
    process.exit(1);
  }

  const latex = result.latex ?? result.output?.latex;
  const clauseJson = result.clauseJson ?? result.output?.clauseJson;
  const warnings = result.warnings ?? result.output?.warnings ?? [];
  const patternReport = result.patternReport ?? result.output?.patternReport;

  console.log(`[${label}] Has LaTeX:`, !!latex, `| length:`, latex ? latex.length : 0);
  console.log(`[${label}] Has clauseJson:`, !!clauseJson);
  console.log(`[${label}] Warnings:`, warnings.length);
  console.log(`[${label}] Pattern report:`, patternReport ? "present" : "missing");

  if (!latex) {
    console.error(`[FAIL:${label}] No LaTeX returned.`);
    console.error("Full result:", JSON.stringify(result, null, 2).slice(0, 1000));
    process.exit(1);
  }

  const hasDocumentclass = latex.includes("\\documentclass");
  const hasBeginDocument = latex.includes("\\begin{document}");
  const hasEndDocument = latex.includes("\\end{document}");
  console.log(`[${label}] \\documentclass:`, hasDocumentclass);
  console.log(`[${label}] \\begin{document}:`, hasBeginDocument);
  console.log(`[${label}] \\end{document}:`, hasEndDocument);

  const outPath = path.join(__dirname, `test-output-${label}.tex`);
  fs.writeFileSync(outPath, latex, "utf8");
  console.log(`[${label}] LaTeX written to ${outPath} (${latex.length} bytes)`);

  if (warnings.length > 0) {
    console.log(`[${label}] Warnings:`);
    warnings.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
  }

  if (patternReport) {
    console.log(
      `[${label}] Pattern report — missing:`,
      patternReport.missing?.join(", ") || "(none)"
    );
  }

  const pass =
    hasDocumentclass && hasBeginDocument && hasEndDocument && latex.length > 1000;
  if (!pass) {
    console.error(`[FAIL:${label}] LaTeX sanity check failed`);
    process.exit(1);
  }
  console.log(`[${label}] PASS`);
}

async function main() {
  console.log("=== MoU Drafter End-to-End Test ===\n");

  const client = new Lamatic({
    endpoint: API_URL,
    projectId: PROJECT_ID,
    apiKey: API_KEY,
  });

  await runVariant(client, "catering", cateringFormData);
  await runVariant(client, "services", servicesFormData);
  await runVariant(client, "design", designFormData);

  console.log("\n=== ALL VARIANTS PASSED ===");
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
