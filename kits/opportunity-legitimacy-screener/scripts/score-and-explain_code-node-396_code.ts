const company_name = {{triggerNode_1.output.company_name}};
const claimed_domain = {{triggerNode_1.output.claimed_domain}};
const sender_email = {{triggerNode_1.output.sender_email}};
const stated_compensation = {{triggerNode_1.output.stated_compensation}};
const role_title = {{triggerNode_1.output.role_title}};
const contact_method = {{triggerNode_1.output.contact_method}};
const search_results = {{triggerNode_1.output.search_results}};

const genericEmailDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"];

function extractDomain(value) {
  const match = (value || "").toLowerCase().match(/@([a-z0-9.-]+\.[a-z]{2,})/);
  return match ? match[1] : "";
}

const contactDomain = extractDomain(contact_method);
const emailDomain = extractDomain(sender_email);

const emailDomainIsGeneric =
  genericEmailDomains.includes(contactDomain) || genericEmailDomains.includes(emailDomain);

const searchLower = (search_results || "").toLowerCase();
const hasVerifiableWebPresence =
  !!company_name && searchLower.includes((company_name || "").toLowerCase().split(" ")[0]);

// Strip out negated mentions ("not a scam", "isn't a fraud", "no complaints")
// before checking for genuine red-flag keywords, so reassuring text doesn't
// get misread as a warning.
const negationPattern = /\b(not|isn't|never|no)\s+(a\s+|any\s+)?(scam|fraud|complaint)/gi;
const sanitizedSearch = searchLower.replace(negationPattern, "");

const negativeReportsFound =
  sanitizedSearch.includes("scam") || sanitizedSearch.includes("complaint") || sanitizedSearch.includes("fraud");

let redFlags = 0;
if (emailDomainIsGeneric) redFlags++;
if (!hasVerifiableWebPresence) redFlags++;
if (negativeReportsFound) redFlags++;

let risk_tier;
if (redFlags >= 2) {
  risk_tier = "high";
} else if (redFlags === 1) {
  risk_tier = "medium";
} else {
  risk_tier = "low";
}

output = {
  risk_tier,
  signals: {
    company_name,
    claimed_domain,
    sender_email,
    stated_compensation,
    role_title,
    contact_method,
    email_domain_is_generic: emailDomainIsGeneric,
    has_verifiable_web_presence: hasVerifiableWebPresence,
    negative_reports_found: negativeReportsFound
  }
};