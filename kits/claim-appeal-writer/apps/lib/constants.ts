export const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","District of Columbia","Florida",
  "Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts",
  "Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico",
  "New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina",
  "South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"
];

export const SAMPLES = [
  { id: "medical-necessity", label: "MRI denied — not medically necessary", file: "sample-denial-medical-necessity.md",
    context: "My orthopedist ordered the MRI after 8 weeks of physical therapy and anti-inflammatories did not resolve the pain, and I have numbness in my left leg." },
  { id: "prior-authorization", label: "CT scan denied — no prior authorization", file: "sample-denial-prior-authorization.md",
    context: "The imaging center is in-network. Nobody told me authorization was needed; I assumed the provider handled it." },
  { id: "out-of-network", label: "Anesthesia billed out-of-network at an in-network hospital", file: "sample-denial-out-of-network.md",
    context: "I chose an in-network hospital and surgeon. I had no say in which anesthesiologist was assigned." },
  { id: "not-covered", label: "Spinal cord stimulator denied as experimental", file: "sample-denial-not-covered.md",
    context: "I have had chronic pain for 3 years after two back surgeries. My pain specialist says this is a standard, FDA-approved treatment." }
];

export const SAMPLE_POLICY_FILE = "sample-policy.md";

export const CATEGORY_LABEL: Record<string, string> = {
  "medical-necessity": "Medical necessity",
  "prior-authorization": "Prior authorization",
  "out-of-network": "Out of network",
  "not-covered": "Not covered",
  "experimental-investigational": "Experimental / investigational",
  "coding-error": "Coding error",
  "timely-filing": "Timely filing",
  "eligibility": "Eligibility",
  "other": "Other"
};
