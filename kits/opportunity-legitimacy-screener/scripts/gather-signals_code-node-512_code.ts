const llmOutput = {{LLMNode_390.output}};
const raw = llmOutput.generatedResponse;

let parsed;
try {
  // Strip markdown code fences in case the model wrapped the JSON in ```json ... ```
  const cleaned = raw.trim().replace(/^```json\n?/, "").replace(/```$/, "");
  parsed = JSON.parse(cleaned);
} catch (e) {
  parsed = {
    company_name: null,
    claimed_domain: null,
    sender_email: null,
    stated_compensation: null,
    role_title: null,
    contact_method: null,
    parse_error: true
  };
}

output = {
  company_name: parsed.company_name || "",
  claimed_domain: parsed.claimed_domain || "",
  sender_email: parsed.sender_email || "",
  stated_compensation: parsed.stated_compensation || "",
  role_title: parsed.role_title || "",
  contact_method: parsed.contact_method || ""
};