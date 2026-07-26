// Assign the value you want to return from this code node to `output`. 
// The `output` variable is already declared.
const email = ({{triggerNode_1.output.email}} || "").trim();
const name = ({{triggerNode_1.output.name}} || "").trim();
const domain = email.includes("@") ? email.split("@")[1].toLowerCase().trim() : "";

const GENERIC = ["gmail.com","outlook.com","yahoo.com","icloud.com","proton.me","protonmail.com","hotmail.com","aol.com","live.com","me.com","gmx.com"];
const isGeneric = !domain || GENERIC.includes(domain);

// company = capitalized main label of the domain (lamatic.ai -> Lamatic)
const label = isGeneric ? "" : domain.split(".")[0];
const company = label ? label.charAt(0).toUpperCase() + label.slice(1) : "";

const seeds = name && company
  ? [`${name} ${company}`, `${name} ${domain}`]
  : (name ? [name] : []);

output = {
  name,
  company,
  domain: isGeneric ? "" : domain,
  search_seeds: seeds,
};