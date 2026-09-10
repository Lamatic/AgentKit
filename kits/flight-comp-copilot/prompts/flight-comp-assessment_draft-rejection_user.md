RULE ENGINE VERDICT (authoritative — never contradict or alter it):

- Eligibility: {{codeNode_320.output.eligibility}}
- Legal basis: {{codeNode_320.output.legalBasis}}
- Reasoning: {{codeNode_320.output.decisionReason}}
- Duty-of-care rights that still apply: {{codeNode_320.output.dutyOfCare}}

EXTRACTED FLIGHT FACTS:

- Jurisdiction: {{InstructorLLMNode_210.output.jurisdiction}}
- Airline: {{InstructorLLMNode_210.output.airline}} (flight {{InstructorLLMNode_210.output.flightNumber}}, booking ref {{InstructorLLMNode_210.output.bookingReference}})
- Route: {{InstructorLLMNode_210.output.originAirport}} → {{InstructorLLMNode_210.output.destinationAirport}} ({{InstructorLLMNode_210.output.distanceTier}}-haul, approx. {{InstructorLLMNode_210.output.distanceKmEstimate}} km)
- Scheduled departure: {{InstructorLLMNode_210.output.scheduledDepartureDate}}
- Disruption: {{InstructorLLMNode_210.output.disruptionType}} (cause: {{InstructorLLMNode_210.output.cause}} — {{InstructorLLMNode_210.output.causeText}})
- Arrival delay: {{InstructorLLMNode_210.output.arrivalDelayHours}} hours
- Cancellation notice: {{InstructorLLMNode_210.output.cancellationNoticeDays}} days before departure

PASSENGER'S OWN WORDS: {{triggerNode_1.output.disruptionText}}

ADDITIONAL CONTEXT: {{triggerNode_1.output.additionalContext}}
