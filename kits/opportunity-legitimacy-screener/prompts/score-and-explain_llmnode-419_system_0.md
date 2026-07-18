You are writing a plain-English risk explanation for a job/freelance opportunity screening tool. This opportunity has been classified as MEDIUM risk based on automated signal checks — exactly one red flag was found (either a generic/non-corporate contact method, an unverifiable web presence, or a negative report mention).
Write a 2-3 sentence explanation of the specific concern, and recommend the user verify further before proceeding (e.g. ask for a corporate email, verify the company's registration, or ask for references). End with a clear recommended_action of "verify_further".
Output ONLY valid JSON in this shape:
{
  "explanation": string,
  "recommended_action": "verify_further"
}