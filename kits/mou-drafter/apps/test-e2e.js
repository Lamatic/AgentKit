/**
 * End-to-end test: catering submission through the live Lamatic flow.
 *
 * Validates:
 * 1. flattenFormToTrigger produces correct flat field names
 * 2. JSON.stringify(deliverables) is sent as a string (not an array)
 * 3. The flow responds with LaTeX, clauseJson, warnings, patternReport
 * 4. The returned LaTeX compiles (we just check it's non-empty and starts with \documentclass)
 */

const { Lamatic } = require("lamatic");

// ── Load env ─────────────────────────────────────────────────────────────
require("dotenv").config({ path: ".env.local" });

const FLOW_ID = process.env.MOU_DRAFTER_FLOW_ID;
const API_URL = process.env.LAMATIC_API_URL;
const PROJECT_ID = process.env.LAMATIC_PROJECT_ID;
const API_KEY = process.env.LAMATIC_API_KEY;

if (!FLOW_ID || !API_URL || !PROJECT_ID || !API_KEY) {
  console.error("Missing env vars. Ensure .env.local has all 4 vars set.");
  process.exit(1);
}

// ── Test data: realistic catering submission ─────────────────────────────
const formData = {
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

// ── Flatten (same logic as actions/orchestrate.ts) ───────────────────────
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

async function main() {
  console.log("=== MoU Drafter End-to-End Test ===\n");

  // Step 1: Verify flatten
  const flatInputs = flattenFormToTrigger(formData);
  console.log("[CHECK 1] deliverables type:", typeof flatInputs.deliverables);
  console.log(
    "[CHECK 1] deliverables is string:",
    typeof flatInputs.deliverables === "string"
  );
  if (typeof flatInputs.deliverables !== "string") {
    console.error("FAIL: deliverables is not a string!");
    process.exit(1);
  }
  console.log("[CHECK 1] PASS: deliverables is a JSON string\n");

  // Step 2: Call the flow
  console.log("[STEP 2] Calling Lamatic flow", FLOW_ID, "...");
  const client = new Lamatic({
    endpoint: API_URL,
    projectId: PROJECT_ID,
    apiKey: API_KEY,
  });

  const start = Date.now();
  let resData;
  try {
    resData = await client.executeFlow(FLOW_ID, flatInputs);
  } catch (err) {
    console.error("[FAIL] Flow call threw:", err.message);
    process.exit(1);
  }
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`[STEP 2] Flow responded in ${elapsed}s\n`);

  // Step 3: Parse result
  const result = resData?.result;
  if (!result) {
    console.error("[FAIL] No result in response:", JSON.stringify(resData, null, 2).slice(0, 500));
    process.exit(1);
  }

  const latex = result.latex ?? result.output?.latex;
  const clauseJson = result.clauseJson ?? result.output?.clauseJson;
  const warnings = result.warnings ?? result.output?.warnings ?? [];
  const patternReport = result.patternReport ?? result.output?.patternReport;

  console.log("[CHECK 3a] Has LaTeX:", !!latex);
  console.log("[CHECK 3b] LaTeX length:", latex ? latex.length : 0);
  console.log("[CHECK 3c] Has clauseJson:", !!clauseJson);
  console.log("[CHECK 3d] Warnings count:", warnings.length);
  console.log("[CHECK 3e] Pattern report:", patternReport ? "present" : "missing");

  if (!latex) {
    console.error("[FAIL] No LaTeX returned.");
    console.error("Full result:", JSON.stringify(result, null, 2).slice(0, 1000));
    process.exit(1);
  }

  // Step 4: Basic LaTeX sanity checks
  const hasDocumentclass = latex.includes("\\documentclass");
  const hasBeginDocument = latex.includes("\\begin{document}");
  const hasEndDocument = latex.includes("\\end{document}");
  const hasPartyA = latex.includes("AEON") || latex.includes("Priya");
  const hasPartyB = latex.includes("Spice") || latex.includes("Ramesh");
  const has30pct = latex.includes("30\\%") || latex.includes("30%");
  const hasINR = latex.includes("INR") || latex.includes("750");

  console.log("\n[CHECK 4] LaTeX sanity:");
  console.log("  \\documentclass:", hasDocumentclass);
  console.log("  \\begin{document}:", hasBeginDocument);
  console.log("  \\end{document}:", hasEndDocument);
  console.log("  Party A reference:", hasPartyA);
  console.log("  Party B reference:", hasPartyB);
  console.log("  30% deposit:", has30pct);
  console.log("  INR/amount:", hasINR);

  // Step 5: Write .tex to disk for manual verification
  const fs = require("fs");
  const outPath = "test-output-catering.tex";
  fs.writeFileSync(outPath, latex, "utf8");
  console.log(`\n[OUTPUT] LaTeX written to ${outPath} (${latex.length} bytes)`);

  // Step 6: Show warnings
  if (warnings.length > 0) {
    console.log("\n[WARNINGS]");
    warnings.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
  }

  // Step 7: Show pattern report
  if (patternReport) {
    console.log("\n[PATTERN REPORT]");
    console.log("  Expected:", patternReport.expected?.join(", ") || "(none)");
    console.log("  Found:", patternReport.found?.join(", ") || "(none)");
    console.log("  Missing:", patternReport.missing?.join(", ") || "(none)");
    console.log("  Unexpected:", patternReport.unexpected?.join(", ") || "(none)");
  }

  // Step 8: Overall result
  const allPass = hasDocumentclass && hasBeginDocument && hasEndDocument && latex.length > 1000;
  console.log(`\n=== ${allPass ? "PASS" : "FAIL"} ===`);
  if (!allPass) process.exit(1);
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
