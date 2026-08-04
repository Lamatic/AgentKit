const meta = {{triggerNode_1.output}};

output = {
  verdict: "no-api-change",
  // Kept identical to the assemble node and the app's local short-circuit —
  // three producers of the same result must not word it three ways.
  summary: "No differences found in the API surface between the two specs.",
  oldVersion: meta.oldVersion,
  newVersion: meta.newVersion,
  totalChanges: 0,
  counts: { breaking: 0, potentiallyBreaking: 0, additive: 0 },
  changes: [],
  migrationNotes: null,
  changelog: null
};