// Data Extraction (Lamatic Studio template bindings)
const rawV1 = {{triggerNode_1.output.v1_schema}};
const rawV2 = {{triggerNode_1.output.v2_schema}};

// Schema Parser (CodeRabbit Fix: Throws error on invalid schema)
function parseSchema(val) {
  if (!val) {
    throw new Error("Invalid schema: Input is missing or empty.");
  }
  let parsed = val;
  if (typeof val === 'string') {
    try {
      parsed = JSON.parse(val);
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }
    } catch (e) {
      throw new Error("Invalid JSON schema: Failed to parse string.");
    }
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error("Invalid schema: Schema must be a valid object.");
  }
  return parsed;
}

// Schema Normalization
const v1 = parseSchema(rawV1);
const v2 = parseSchema(rawV2);

const diffs = [];

// Endpoint & Method Checks
if (v1.endpoint && v2.endpoint && v1.endpoint !== v2.endpoint) {
  diffs.push({
    type: 'ENDPOINT_CHANGED',
    severity: 'BREAKING',
    details: `Endpoint changed from '${v1.endpoint}' to '${v2.endpoint}'`
  });
}

if (v1.method && v2.method && v1.method !== v2.method) {
  diffs.push({
    type: 'METHOD_CHANGED',
    severity: 'BREAKING',
    details: `HTTP Method changed from '${v1.method}' to '${v2.method}'`
  });
}

// Request Body Comparison
const v1Body = v1.request_body || {};
const v2Body = v2.request_body || {};

const v1Keys = Object.keys(v1Body);
const v2Keys = Object.keys(v2Body);

// Breaking Changes Check (Removed Fields & Type Changes)
// CodeRabbit Fix: Uses Object.hasOwn for sandbox safety
for (const key of v1Keys) {
  if (!Object.hasOwn(v2Body, key)) {
    diffs.push({
      type: 'FIELD_REMOVED',
      severity: 'BREAKING',
      field: key,
      old_type: v1Body[key],
      details: `Field '${key}' (${v1Body[key]}) was removed from request body.`
    });
  } else if (v1Body[key] !== v2Body[key]) {
    diffs.push({
      type: 'TYPE_CHANGED',
      severity: 'BREAKING',
      field: key,
      old_type: v1Body[key],
      new_type: v2Body[key],
      details: `Field '${key}' type changed from '${v1Body[key]}' to '${v2Body[key]}'.`
    });
  }
}

// Non-Breaking Changes Check (Added Fields)
for (const key of v2Keys) {
  if (!Object.hasOwn(v1Body, key)) {
    diffs.push({
      type: 'FIELD_ADDED',
      severity: 'NON_BREAKING',
      field: key,
      new_type: v2Body[key],
      details: `Field '${key}' (${v2Body[key]}) was added to request body.`
    });
  }
}

// Output Payload Generation
const hasBreaking = diffs.some(d => d.severity === 'BREAKING');

const finalOutput = {
  has_breaking_changes: hasBreaking,
  total_changes: diffs.length,
  breaking_count: diffs.filter(d => d.severity === 'BREAKING').length,
  diffs: diffs,
  v1_summary: v1,
  v2_summary: v2
};

// CodeRabbit Fix: No top-level return
output = finalOutput;