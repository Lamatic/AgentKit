const email = ({{triggerNode_1.output.email}} || "").trim();
const name = ({{triggerNode_1.output.name}} || "").trim();
const pc = ({{triggerNode_1.output.person_context}} || "").trim();
const domain = email.includes("@") ? email.split("@")[1].toLowerCase().trim() : "";

const GENERIC = ["gmail.com","outlook.com","yahoo.com","icloud.com","proton.me","protonmail.com","hotmail.com","aol.com","live.com","me.com","gmx.com"];
const isGeneric = !domain || GENERIC.includes(domain);
const company = isGeneric ? "" : (domain.split(".")[0].charAt(0).toUpperCase() + domain.split(".")[0].slice(1));

// crawl the company site if it's a company email; else the person_context link if it's a URL; else nothing
const pcIsUrl = /^https?:\/\//i.test(pc) || /^[^\s]+\.[a-z]{2,}([\/?#].*)?$/i.test(pc);
let research_url = "";
if (!isGeneric && domain) research_url = "https://" + domain;
else if (pcIsUrl) research_url = /^https?:\/\//i.test(pc) ? pc : "https://" + pc;

output = { name, company, domain: isGeneric ? "" : domain, research_url };