Calibrate this panel interview into a structured scorecard.

<<<UNTRUSTED_JOB_TITLE>>>
{{triggerNode_1.output.job_title}}
<<<END_UNTRUSTED_JOB_TITLE>>>

<<<UNTRUSTED_LEVEL>>>
{{triggerNode_1.output.level}}
<<<END_UNTRUSTED_LEVEL>>>

<<<UNTRUSTED_RUBRIC>>>
{{triggerNode_1.output.rubric}}
<<<END_UNTRUSTED_RUBRIC>>>

<<<UNTRUSTED_INTERVIEWER_NOTES>>>
{{triggerNode_1.output.interviewer_notes}}
<<<END_UNTRUSTED_INTERVIEWER_NOTES>>>

Produce JSON with this exact shape and constraints:
{
  "candidate_summary": "string",
  "competencies": [
    {
      "name": "string",
      "weight": "string",
      "calibrated_score": 1,
      "evidence": ["string"],
      "missing_evidence": "string",
      "interviewer_spread": "string"
    }
  ],
  "disagreements": [
    {
      "topic": "string",
      "interviewers": ["string"],
      "summary": "string",
      "severity": "low"
    }
  ],
  "recommendation": "hire",
  "confidence": 0.0,
  "rationale": "string",
  "follow_up_questions": ["string"],
  "email_draft": "string"
}

Constraints:
- calibrated_score must be an integer from 1 to 5
- recommendation must be one of: hire | lean-hire | lean-no | no-hire
- severity must be one of: low | medium | high
- confidence must be a number from 0 to 1
- email_draft should start with "Subject: ..."
