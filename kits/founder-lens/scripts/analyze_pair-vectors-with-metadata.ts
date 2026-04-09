let vectors = {{vectorizeNode_brief.output.vectors}};
let metaSource = {{codeNode_briefToFacts.output.metadataArray}};

let pairedMetadata = [];

for (const idx in vectors) {
  let i = parseInt(idx);
  let meta = metaSource[i] || {};
  pairedMetadata.push({
    content:   meta.content   || '',
    userId:    meta.userId    || '',
    sessionId: meta.sessionId || ''
  });
}

return {
  vectors:  vectors,
  metadata: pairedMetadata
};