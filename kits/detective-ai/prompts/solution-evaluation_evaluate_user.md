Player Solution Submission:
{{triggerNode_1.output.submission}}

Objective Culprit Correctness:
{{triggerNode_1.output.objective_culprit_correct}}

Public Case Context:
Scenario Name: {{triggerNode_1.output.scenario_name}}
Suspects: {{triggerNode_1.output.public_suspects}}
Evidence: {{triggerNode_1.output.public_evidence}}
Timeline: {{triggerNode_1.output.public_timeline}}

Investigation Context (Clues and Discoveries):
{{triggerNode_1.output.investigation_context}}

Evaluate the submission and return a structured JSON response matching the following schema:
{
  "evidence_score": number,  // 0 to 20
  "motive_score": number,    // 0 to 15
  "reasoning_score": number,   // 0 to 20
  "timeline_score": number,    // 0 to 15
  "strengths": string[],
  "weaknesses": string[],
  "feedback": string
}
