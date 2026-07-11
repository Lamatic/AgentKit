function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) {
    throw new Error(
      `Invalid embeddings.\na: ${JSON.stringify(a)}\nb: ${JSON.stringify(b)}`
    );
  }

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  if (magA === 0 || magB === 0) return 0;

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

const SIMILARITY_THRESHOLD = 0.82;

// Loop End output
const embeddedLogs = {{forLoopEndNode_781.output.loopOutput}};

// Make sure it's an array
if (!Array.isArray(embeddedLogs)) {
  throw new Error(
    "LoopEnd output is not an array:\n" +
    JSON.stringify(embeddedLogs, null, 2)
  );
}

const clusters = [];

for (const log of embeddedLogs) {

  // Detect where the embedding actually lives
  const embedding =
    log.vectorizeNode_123?.output?.vectors?.[0];

if (!embedding) {
    throw new Error(
        "No embedding found:\n" +
        JSON.stringify(log, null, 2)
    );
}

  let placed = false;

  for (const cluster of clusters) {

    const sim = cosineSimilarity(
      embedding,
      cluster.centroidEmbedding
    );

    if (sim >= SIMILARITY_THRESHOLD) {
      cluster.members.push(log);
      placed = true;
      break;
    }
  }

  if (!placed) {
    clusters.push({
      centroidEmbedding: embedding,
      members: [log]
    });
  }
}

return {
  total_logs: embeddedLogs.length,
  clusters_count: clusters.length,
  clusters
};