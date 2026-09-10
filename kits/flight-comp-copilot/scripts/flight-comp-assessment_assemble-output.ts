// Code: Assemble Output
// Flow: flight-comp-assessment
//
// Merges the extracted facts, the rule engine's verdict, and whichever letter branch
// ran, into one response object. Model outputs are never trusted blindly: the letter is
// picked from whichever drafting node produced text, and missing facts come from the
// rule engine's own verdict — the only source that knows the rules.

const missingFromEngine = {{codeNode_320.output.missingFacts}};
const missingFacts = Array.isArray(missingFromEngine)
  ? missingFromEngine
  : missingFromEngine
    ? [missingFromEngine]
    : [];

output = {
  extractedFacts: {
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
    reroutingStatus: {{InstructorLLMNode_210.output.reroutingStatus}},
    reroutedDepartureOffsetHours: {{InstructorLLMNode_210.output.reroutedDepartureOffsetHours}},
    cause: {{InstructorLLMNode_210.output.cause}},
    causeText: {{InstructorLLMNode_210.output.causeText}},
    distanceKmEstimate: {{InstructorLLMNode_210.output.distanceKmEstimate}},
    distanceTier: {{InstructorLLMNode_210.output.distanceTier}},
    bookingReference: {{InstructorLLMNode_210.output.bookingReference}},
  },
  letter:
    {{LLMNode_540.output.generatedResponse}} ||
    {{LLMNode_650.output.generatedResponse}} ||
    {{LLMNode_760.output.generatedResponse}},
  missingFacts: missingFacts,
};
