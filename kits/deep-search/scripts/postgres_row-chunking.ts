// Code: Row Chunking
// Flow: postgres

function objectToString(obj) {
  return Object.entries(obj)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
}

output = [objectToString({{ triggerNode_1.output }})]
