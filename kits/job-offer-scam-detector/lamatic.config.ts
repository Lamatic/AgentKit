export default {
  "name": "Job Offer Scam Detector",
  "description": "Analyzes job offer messages and flags fraud signals like urgency tactics, upfront payment requests, and vague company details, helping job seekers spot scams before they respond.",
  "version": "1.0.0",
  "type": "template" as const,
  "author": {
    "name": "Rishi Mathur",
    "email": "rishimathur2004@gmail.com"
  },
  "tags": ["fraud-detection", "career", "safety"],
  "steps": [
    {
      "id": "job-offer-scam-detector",
      "type": "mandatory" as const
    }
  ],
  "links": {
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/job-offer-scam-detector"
  }
};