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

function stripParens(license) {
  if (!license || typeof license !== 'string') return '';
  return license.trim().replace(/^\(|\)$/g, '').trim();
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

// Classify a single SPDX license id (no OR/AND) against the effective
// allow-list / copyleft set.
function classifySingle(license, allowSet, copyleftSet) {
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

// Classify a dependency's full license expression, honoring SPDX OR/AND
// compound expressions instead of only looking at the first term:
//  - "A OR B" (dual-licensed): usable under whichever operand is most
//    permissive, so OK if ANY operand is allow-listed.
//  - "A AND B" (compound): all operands' obligations apply simultaneously,
//    so BLOCKED if ANY operand is copyleft.
function classify(dep, allowSet, copyleftSet) {
  const expr = stripParens(dep.license);

  if (!expr) {
    return { status: 'REVIEW_NEEDED', reason: 'No license declared for this dependency.' };
  }

  if (/\sOR\s/i.test(expr)) {
    const operands = expr.split(/\s+OR\s+/i).map(stripParens);
    const allowed = operands.find(op => allowSet.has(op));
    if (allowed) {
      return { status: 'OK', reason: `Dual-licensed as '${expr}'; the '${allowed}' option is on the approved allow-list.` };
    }
    if (operands.every(op => copyleftSet.has(op))) {
      return { status: 'BLOCKED', reason: `Every option in '${expr}' is a copyleft license.` };
    }
    return { status: 'REVIEW_NEEDED', reason: `None of the options in '${expr}' are on the allow-list — needs manual classification.` };
  }

  if (/\sAND\s/i.test(expr)) {
    const operands = expr.split(/\s+AND\s+/i).map(stripParens);
    const blocking = operands.find(op => copyleftSet.has(op));
    if (blocking) {
      return { status: 'BLOCKED', reason: `'${expr}' includes copyleft component '${blocking}', whose obligations apply to the combined work.` };
    }
    if (operands.every(op => allowSet.has(op))) {
      return { status: 'OK', reason: `Every component of '${expr}' is on the approved allow-list.` };
    }
    return { status: 'REVIEW_NEEDED', reason: `'${expr}' includes an unrecognized license component — needs manual classification.` };
  }

  return classifySingle(expr, allowSet, copyleftSet);
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
    license: stripParens(dep.license) || 'unknown',
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
