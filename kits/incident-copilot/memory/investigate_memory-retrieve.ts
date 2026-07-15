// Memory config: Memory Retrieve (memoryRetrieveNode)
// Flow: investigate
//
// Reads back prior hypotheses for THIS incident before diagnosing. Filtered by the
// incidentId so only this incident's history is returned. On the first
// investigation of an incident this returns empty, which the Diagnose prompt
// treats as a cold start (not an error).
//
// Concrete collection name, filters, and models are set in Lamatic Studio.

export default {
  "memoryCollection": "@memory/investigate_memory-retrieve.ts",
  "searchQuery": "@memory/investigate_memory-retrieve.ts",
  "limit": "@memory/investigate_memory-retrieve.ts",
  "filters": "@memory/investigate_memory-retrieve.ts",
  "embeddingModelName": "@memory/investigate_memory-retrieve.ts",
  "generativeModelName": "@memory/investigate_memory-retrieve.ts"
};
