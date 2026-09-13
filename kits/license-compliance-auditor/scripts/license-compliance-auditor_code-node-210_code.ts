// Data Extraction
const rawDeps = {{triggerNode_1.output.dependency_licenses}};
const rawAllowList = {{triggerNode_1.output.allow_list}};

// Default allow-list: permissive licenses considered safe to use as-is.
const DEFAULT_ALLOW_LIST = [
  'MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', '0BSD', 'Unlicense', 'CC0-1.0'
];

// Known copyleft / high-risk licenses that require legal review before use.
const COPYLEFT_LICENSES = [
  'GPL-1.0', 'GPL-2.0', 'GPL-3.0', 'AGPL-1.0', 'AGPL-3.0',
  'LGPL-2.1', 'LGPL-3.0', 'SSPL-1.0', 'CC-BY-SA-4.0', 'EUPL-1.2'
];

function normalize(license) {
  if (!license || typeof license !== 'string') return '';
  return license.trim().replace(/^\(|\)$/g, '').split(/\s+OR\s+|\s+AND\s+/i)[0].trim();
}

function parseDeps(val) {
  if (!val) {
    throw new Error("Invalid input: dependency_licenses is missing or empty.");
  }

  let parsed = val;
  if (typeof val === 'string') {
    try {
      parsed = JSON.parse(val);
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }
    } catch (e) {
      throw new Error("Invalid JSON: Failed to parse dependency_licenses string.");
    }
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Invalid input: dependency_licenses must be a JSON array of {name, version, license} objects.");
  }

  if (parsed.length === 0) {
    throw new Error("Invalid input: dependency_licenses array cannot be empty.");
  }

  for (const dep of parsed) {
    if (typeof dep !== 'object' || dep === null || Array.isArray(dep)) {
      throw new Error("Invalid input: each dependency entry must be a non-null object.");
    }
    if (!dep.name || typeof dep.name !== 'string') {
      throw new Error("Invalid input: every dependency entry needs a string 'name'.");
    }
  }

  return parsed;
}

function parseAllowList(val) {
  if (!val || typeof val !== 'string' || val.trim() === '') return [];
  return val.split(',').map(s => s.trim()).filter(Boolean);
}

// Classify a single dependency against the effective allow-list / copyleft set.
function classify(dep, allowSet, copyleftSet) {
  const license = normalize(dep.license);

  if (!license || license.toUpperCase() === 'UNKNOWN') {
    return { status: 'REVIEW_NEEDED', reason: 'No license declared for this dependency.' };
  }
  if (copyleftSet.has(license)) {
    return { status: 'BLOCKED', reason: `'${license}' is a copyleft license that may impose reciprocal obligations on this project.` };
  }
  if (allowSet.has(license)) {
    return { status: 'OK', reason: `'${license}' is on the approved allow-list.` };
  }
  return { status: 'REVIEW_NEEDED', reason: `'${license}' is not on the allow-list and is not a recognized copyleft license — needs manual classification.` };
}

// Main
const deps = parseDeps(rawDeps);
const userAllowList = parseAllowList(rawAllowList);
const effectiveAllowList = Array.from(new Set([...DEFAULT_ALLOW_LIST, ...userAllowList]));
const allowSet = new Set(effectiveAllowList);
const copyleftSet = new Set(COPYLEFT_LICENSES);

const findings = deps.map((dep) => {
  const result = classify(dep, allowSet, copyleftSet);
  return {
    name: dep.name,
    version: dep.version || 'unknown',
    license: normalize(dep.license) || 'unknown',
    status: result.status,
    reason: result.reason
  };
});

const blocked_count = findings.filter(f => f.status === 'BLOCKED').length;
const review_count = findings.filter(f => f.status === 'REVIEW_NEEDED').length;

const finalOutput = {
  has_violations: blocked_count > 0,
  total_deps: findings.length,
  blocked_count,
  review_count,
  findings,
  allow_list_used: effectiveAllowList
};

output = finalOutput;
