// Code: Validate Input
// Flow: mou-drafter
//
// Normalises the trigger payload before the LLM call. This script:
//   - trims string fields and uppercases currency codes
//   - expands paymentPreset and terminationPreset enums into concrete numbers
//   - derives jurisdictionFamily from the free-text governingLaw field via a
//     substring lookup table (see PLAN.md §7), with explicit `other` fallback warning
//   - pre-renders deliverables[] into a single deliverablesBlock string
//     (Lamatic prompt interpolation is flat only — no Handlebars block helpers)
//   - resolves ipOwnership default ("not-applicable" for venue/catering/av/goods)
//   - resolves insuranceRequired default by engagementType
//   - builds warnings[] for lump-sum payment, jurisdiction-fallback, missing eventDates
//
// triggerNode_1 below is a placeholder ID. If the deployed trigger node has a
// different ID after Studio export, all {{triggerNode_1.output.*}} refs in this
// file must be updated to match.

// ── Raw inputs from trigger ──────────────────────────────────────────────
let agreementTitle      = {{triggerNode_1.output.agreementTitle}};
let effectiveDate       = {{triggerNode_1.output.effectiveDate}};

let partyAName          = {{triggerNode_1.output.partyAName}};
let partyAType          = {{triggerNode_1.output.partyAType}};
let partyAAddress       = {{triggerNode_1.output.partyAAddress}};
let partyASignatory     = {{triggerNode_1.output.partyASignatory}};
let partyASignatoryRole = {{triggerNode_1.output.partyASignatoryRole}};
let partyAEmail         = {{triggerNode_1.output.partyAEmail}};

let partyBName          = {{triggerNode_1.output.partyBName}};
let partyBType          = {{triggerNode_1.output.partyBType}};
let partyBAddress       = {{triggerNode_1.output.partyBAddress}};
let partyBSignatory     = {{triggerNode_1.output.partyBSignatory}};
let partyBSignatoryRole = {{triggerNode_1.output.partyBSignatoryRole}};
let partyBEmail         = {{triggerNode_1.output.partyBEmail}};

let engagementType      = {{triggerNode_1.output.engagementType}};
let scopeOfWork         = {{triggerNode_1.output.scopeOfWork}};
let deliverables        = {{triggerNode_1.output.deliverables}};

let totalFeeAmount      = {{triggerNode_1.output.totalFeeAmount}};
let totalFeeCurrency    = {{triggerNode_1.output.totalFeeCurrency}};

let paymentSchedule     = {{triggerNode_1.output.paymentSchedule}};
let paymentPreset       = {{triggerNode_1.output.paymentPreset}};

let eventStart          = {{triggerNode_1.output.eventStart}};
let eventEnd            = {{triggerNode_1.output.eventEnd}};

let confidentialityRequired      = {{triggerNode_1.output.confidentialityRequired}};
let confidentialitySurvivalYears = {{triggerNode_1.output.confidentialitySurvivalYears}};

let ipOwnership                  = {{triggerNode_1.output.ipOwnership}};
let ipPortfolioRights            = {{triggerNode_1.output.ipPortfolioRights}};

let terminationPreset            = {{triggerNode_1.output.terminationPreset}};

let governingLaw                 = {{triggerNode_1.output.governingLaw}};
let disputeResolution            = {{triggerNode_1.output.disputeResolution}};
let disputeVenue                 = {{triggerNode_1.output.disputeVenue}};

let insuranceRequired            = {{triggerNode_1.output.insuranceRequired}};
let insuranceGenLiab             = {{triggerNode_1.output.insuranceGenLiab}};
let insuranceProfIndem           = {{triggerNode_1.output.insuranceProfIndem}};

let dataProtectionRequired       = {{triggerNode_1.output.dataProtectionRequired}};
let subcontractingAllowed        = {{triggerNode_1.output.subcontractingAllowed}};
let noPublicityRequired          = {{triggerNode_1.output.noPublicityRequired}};
let liabilityCapMultiplier       = {{triggerNode_1.output.liabilityCapMultiplier}};
let additionalContext            = {{triggerNode_1.output.additionalContext}};

// Optional fields — only used when paymentPreset === 'custom'
let customDepositPct             = {{triggerNode_1.output.customDepositPct}};
let customPaymentDays            = {{triggerNode_1.output.customPaymentDays}};

let warnings = [];

// ── Helpers ──────────────────────────────────────────────────────────────
function trimStr(v) {
  return (typeof v === 'string') ? v.trim() : (v == null ? '' : String(v).trim());
}

function asBool(v) {
  if (typeof v === 'boolean') return v;
  if (v === 'true' || v === 1 || v === '1') return true;
  if (v === 'false' || v === 0 || v === '0' || v == null) return false;
  return !!v;
}

function asNum(v, fallback) {
  let n = Number(v);
  return (isFinite(n) && !isNaN(n)) ? n : fallback;
}

function enforceEnum(fieldName, val, allowed, fallback) {
  if (allowed.indexOf(val) !== -1) return val;
  if (val) {
    warnings.push('Invalid value "' + val + '" for ' + fieldName + '. Allowed values: ' + allowed.join(', ') + '. Defaulting to "' + fallback + '".');
  }
  return fallback;
}

// ── Normalise simple fields ──────────────────────────────────────────────
agreementTitle      = trimStr(agreementTitle);
effectiveDate       = trimStr(effectiveDate);
partyAName          = trimStr(partyAName);
partyAType          = trimStr(partyAType) || 'org';
partyAAddress       = trimStr(partyAAddress);
partyASignatory     = trimStr(partyASignatory);
partyASignatoryRole = trimStr(partyASignatoryRole);
partyAEmail         = trimStr(partyAEmail).toLowerCase();
partyBName          = trimStr(partyBName);
partyBType          = trimStr(partyBType) || 'org';
partyBAddress       = trimStr(partyBAddress);
partyBSignatory     = trimStr(partyBSignatory);
partyBSignatoryRole = trimStr(partyBSignatoryRole);
partyBEmail         = trimStr(partyBEmail).toLowerCase();

// ── Map partyAType / partyBType to a pre-articled entity phrase ──────────
// The LaTeX template uses <<PARTY_A_TYPE>> in the Parties paragraph as:
//   "...is entered into ... between:
//    \item \textbf{Name} (``Engager''), <<PARTY_A_TYPE>>, principal address..."
// Callers pass the raw enum token ('org', 'corp', 'individual', etc.) from
// the trigger schema. Map each to a natural, grammatically complete phrase
// so the rendered sentence reads correctly without needing a hard-coded
// "a" article in the template (the phrase already carries the article).
function entityPhrase(raw) {
  let t = String(raw || '').toLowerCase().trim();
  let MAP = {
    'org': 'an organisation',
    'organisation': 'an organisation',
    'organization': 'an organization',
    'corp': 'a corporation',
    'corporation': 'a corporation',
    'company': 'a company',
    'llc': 'a limited liability company (LLC)',
    'llp': 'a limited liability partnership (LLP)',
    'partnership': 'a partnership',
    'sole-trader': 'a sole trader',
    'sole trader': 'a sole trader',
    'individual': 'an individual',
    'person': 'an individual',
    'trust': 'a trust',
    'ngo': 'a non-governmental organisation',
    'npo': 'a non-profit organisation',
    'non-profit': 'a non-profit organisation',
    'nonprofit': 'a non-profit organisation',
    'government': 'a government body',
    'govt': 'a government body'
  };
  return MAP[t] || (t ? t : 'an organisation');
}
partyAType = entityPhrase(partyAType);
partyBType = entityPhrase(partyBType);
engagementType      = enforceEnum('engagementType', trimStr(engagementType), ['services', 'venue', 'catering', 'av-equipment', 'photography', 'design', 'sponsorship', 'other'], 'other');
scopeOfWork         = trimStr(scopeOfWork);
totalFeeCurrency    = trimStr(totalFeeCurrency).toUpperCase();
totalFeeAmount      = asNum(totalFeeAmount, 0);
paymentSchedule     = enforceEnum('paymentSchedule', trimStr(paymentSchedule), ['milestone-based', 'lump-sum'], 'milestone-based');
paymentPreset       = enforceEnum('paymentPreset', trimStr(paymentPreset), ['30-net-15', '50-net-30', '25-net-7', 'custom'], '30-net-15');
eventStart          = trimStr(eventStart);
eventEnd            = trimStr(eventEnd);
confidentialityRequired      = asBool(confidentialityRequired);
confidentialitySurvivalYears = asNum(confidentialitySurvivalYears, 3);
ipOwnership                  = enforceEnum('ipOwnership', trimStr(ipOwnership), ['engager', 'vendor', 'joint', 'not-applicable', ''], '');
ipPortfolioRights            = asBool(ipPortfolioRights);
terminationPreset            = enforceEnum('terminationPreset', trimStr(terminationPreset), ['short-14-3', 'standard-30-7', 'extended-60-14'], 'standard-30-7');
governingLaw                 = trimStr(governingLaw);
disputeResolution            = enforceEnum('disputeResolution', trimStr(disputeResolution), ['mediation-then-arbitration', 'arbitration-only', 'courts'], 'mediation-then-arbitration');
disputeVenue                 = trimStr(disputeVenue);
insuranceGenLiab             = asNum(insuranceGenLiab, 0);
insuranceProfIndem           = asNum(insuranceProfIndem, 0);
dataProtectionRequired       = asBool(dataProtectionRequired);
subcontractingAllowed        = asBool(subcontractingAllowed);
noPublicityRequired          = asBool(noPublicityRequired);
liabilityCapMultiplier       = asNum(liabilityCapMultiplier, 1);
additionalContext            = trimStr(additionalContext);

if (!Array.isArray(deliverables)) {
  // Tolerate a JSON-stringified array if Studio's schema UI forced flattening.
  if (typeof deliverables === 'string') {
    try { deliverables = JSON.parse(deliverables); } catch (e) { deliverables = []; }
  } else {
    deliverables = [];
  }
}

// ── Expand paymentPreset → depositPct + paymentDays ──────────────────────
let depositPct = 30;
let paymentDays = 15;
if (paymentSchedule === 'lump-sum') {
  // lump-sum has no net-days; preset field is irrelevant per PLAN.md §5
  depositPct = 100;
  paymentDays = 0;
} else if (paymentPreset === '30-net-15') {
  depositPct = 30; paymentDays = 15;
} else if (paymentPreset === '50-net-30') {
  depositPct = 50; paymentDays = 30;
} else if (paymentPreset === '25-net-7') {
  depositPct = 25; paymentDays = 7;
} else if (paymentPreset === 'custom') {
  depositPct  = asNum(customDepositPct, 30);
  paymentDays = asNum(customPaymentDays, 15);
}

// ── Expand terminationPreset → noticeDays + cureDays ─────────────────────
let terminationNoticeDays = 30;
let cureWindowDays = 7;
if (terminationPreset === 'short-14-3') {
  terminationNoticeDays = 14; cureWindowDays = 3;
} else if (terminationPreset === 'extended-60-14') {
  terminationNoticeDays = 60; cureWindowDays = 14;
} // else standard-30-7 defaults already set

// ── Derive jurisdictionFamily from free-text governingLaw ───────────────
// Spec'd in PLAN.md §7. Ordered substring lookup, first match wins,
// each entry wrapped in spaces on both sides during matching so that
// "us" does not match "belarus" etc.
let glNormalised = ' ' + governingLaw.toLowerCase().replace(/[.,;:()\[\]\-]/g, ' ').replace(/\s+/g, ' ') + ' ';

let US_CANADA = [
  ' united states ', ' usa ', ' u s ', ' u s a ',
  ' california ', ' new york ', ' texas ', ' delaware ', ' florida ',
  ' washington ', ' massachusetts ', ' illinois ',
  ' canada ', ' ontario ', ' quebec ', ' british columbia ', ' alberta '
];
let ENGLISH_COMMON = [
  ' united kingdom ', ' uk ', ' u k ', ' britain ', ' england ', ' wales ', ' scotland ', ' northern ireland ',
  ' india ', ' karnataka ', ' maharashtra ', ' delhi ', ' tamil nadu ', ' bengaluru ', ' mumbai ', ' bangalore ',
  ' singapore ',
  ' australia ', ' new south wales ', ' queensland ',
  ' new zealand ', ' aotearoa ',
  ' malaysia ', ' kuala lumpur ',
  ' south africa ', ' cape town ', ' johannesburg ',
  ' hong kong ', ' hksar '
];

function matchAny(haystack, needles) {
  for (let i = 0; i < needles.length; i++) {
    if (haystack.indexOf(needles[i]) !== -1) return true;
  }
  return false;
}

let jurisdictionFamily = 'other';
if (matchAny(glNormalised, US_CANADA)) {
  jurisdictionFamily = 'us-canada';
} else if (matchAny(glNormalised, ENGLISH_COMMON)) {
  jurisdictionFamily = 'english-commonwealth';
}

if (jurisdictionFamily === 'other') {
  warnings.push(
    'Governing law "' + governingLaw + '" could not be classified for ' +
    'jurisdiction-sensitive clause gating. Pattern #3 (liquidated damages) ' +
    'omitted as a precaution; manually verify whether per-day service ' +
    'credits are enforceable in this jurisdiction.'
  );
}

// ── Resolve ipOwnership default by engagementType ───────────────────────
let ipApplicableTypes = { 'services': 1, 'photography': 1, 'design': 1, 'sponsorship': 1 };
let ipNotApplicableTypes = { 'venue': 1, 'catering': 1, 'av-equipment': 1, 'goods': 1 };

if (!ipOwnership) {
  if (ipApplicableTypes[engagementType]) {
    ipOwnership = 'engager';
  } else if (ipNotApplicableTypes[engagementType]) {
    ipOwnership = 'not-applicable';
  } else {
    // engagementType === 'other'. Per PLAN.md §5, the form prompts the user
    // explicitly for 'other'. If we still got here without a value, default
    // to including the clause with a warning rather than silently dropping it.
    ipOwnership = 'engager';
    warnings.push(
      'engagementType is "other" and ipOwnership was not specified. ' +
      'Defaulted to engager-owned IP as a precaution. ' +
      'If no IP is created by this engagement, set ipOwnership to "not-applicable".'
    );
  }
}

// ── Resolve insuranceRequired default by engagementType ─────────────────
let insuranceDefaultTypes = { 'venue': 1, 'catering': 1, 'av-equipment': 1, 'photography': 1 };
if (insuranceRequired === undefined || insuranceRequired === null || insuranceRequired === '') {
  insuranceRequired = !!insuranceDefaultTypes[engagementType];
} else {
  insuranceRequired = asBool(insuranceRequired);
}

// ── Warning: lump-sum payment for high-value engagement ──────────────────
if (paymentSchedule === 'lump-sum') {
  warnings.push(
    'Lump-sum payment chosen' +
    (totalFeeAmount > 0 ? ' for an engagement of ' + totalFeeAmount + ' ' + totalFeeCurrency : '') +
    '. Milestone-based payment is the lower-risk default. ' +
    'Draft honours your choice; this warning is carried into the rendered ' +
    'document so reviewers can see the trade-off.'
  );
}

// ── Warning: missing eventDates for date-sensitive engagement types ─────
let eventTypeRequiresDates = { 'venue': 1, 'catering': 1, 'av-equipment': 1, 'photography': 1 };
if (eventTypeRequiresDates[engagementType] && !eventStart) {
  warnings.push(
    'engagementType is "' + engagementType + '" but eventStart was not provided. ' +
    'Force-majeure carve-outs and date-anchored clauses will be drafted ' +
    'against the contract effectiveDate instead.'
  );
}

// ── Pre-render deliverables[] into a single string for flat interpolation ─
let deliverablesBlock = '';
if (deliverables.length === 0) {
  deliverablesBlock = '- (no deliverables specified)';
  warnings.push('No deliverables were specified. Payment-milestone clause will reference the total scope of work as a single deliverable.');
} else {
  let lines = [];
  for (let i = 0; i < deliverables.length; i++) {
    let d = deliverables[i] || {};
    let label = trimStr(d.label) || ('Deliverable ' + (i + 1));
    let due = trimStr(d.dueDate) || '(date TBD)';
    let acc = trimStr(d.acceptanceCriteria) || '(acceptance criteria TBD)';
    lines.push('- ' + label + ' — due ' + due + ' — acceptance: ' + acc);
  }
  deliverablesBlock = lines.join('\n');
}

let warningsBlock = warnings.length > 0
  ? warnings.map(function (w, i) { return '- ' + w; }).join('\n')
  : '(no upstream warnings)';

// ── Compose normalised payload for downstream nodes ─────────────────────
output = {
  // pass-through
  agreementTitle: agreementTitle,
  effectiveDate: effectiveDate,
  partyAName: partyAName,
  partyAType: partyAType,
  partyAAddress: partyAAddress,
  partyASignatory: partyASignatory,
  partyASignatoryRole: partyASignatoryRole,
  partyAEmail: partyAEmail,
  partyBName: partyBName,
  partyBType: partyBType,
  partyBAddress: partyBAddress,
  partyBSignatory: partyBSignatory,
  partyBSignatoryRole: partyBSignatoryRole,
  partyBEmail: partyBEmail,
  engagementType: engagementType,
  scopeOfWork: scopeOfWork,
  totalFeeAmount: totalFeeAmount,
  totalFeeCurrency: totalFeeCurrency,
  paymentSchedule: paymentSchedule,
  paymentPreset: paymentPreset,
  eventStart: eventStart,
  eventEnd: eventEnd,
  confidentialityRequired: confidentialityRequired,
  confidentialitySurvivalYears: confidentialitySurvivalYears,
  ipOwnership: ipOwnership,
  ipPortfolioRights: ipPortfolioRights,
  terminationPreset: terminationPreset,
  governingLaw: governingLaw,
  disputeResolution: disputeResolution,
  disputeVenue: disputeVenue,
  insuranceRequired: insuranceRequired,
  insuranceGenLiab: insuranceGenLiab,
  insuranceProfIndem: insuranceProfIndem,
  dataProtectionRequired: dataProtectionRequired,
  subcontractingAllowed: subcontractingAllowed,
  noPublicityRequired: noPublicityRequired,
  liabilityCapMultiplier: liabilityCapMultiplier,
  additionalContext: additionalContext,
  // derived
  depositPct: depositPct,
  paymentDays: paymentDays,
  terminationNoticeDays: terminationNoticeDays,
  cureWindowDays: cureWindowDays,
  jurisdictionFamily: jurisdictionFamily,
  deliverablesBlock: deliverablesBlock,
  deliverables: deliverables,
  warningsBlock: warningsBlock,
  warnings: warnings
};
