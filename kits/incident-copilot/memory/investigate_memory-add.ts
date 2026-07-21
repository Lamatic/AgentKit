// Memory config: Memory Add (memoryNode)
// Flow: investigate
//
// Writes the hypothesis set produced this run back to memory, scoped to the
// incident. `sessionId` is the incidentId, so a later investigation of the SAME
// incident retrieves these hypotheses and revises them instead of starting over.
// `memoryValue` is the ranked hypotheses JSON from the Diagnose node.
//
// Concrete collection name, embedding model, and generative model are set in
// Lamatic Studio. Values below follow the repo convention of self-referencing the
// resource file; Studio holds the real configuration.

export default {
  "memoryCollection": "@memory/investigate_memory-add.ts",
  "uniqueId": "@memory/investigate_memory-add.ts",
  "sessionId": "@memory/investigate_memory-add.ts",
  "memoryValue": "@memory/investigate_memory-add.ts",
  "embeddingModelName": "@memory/investigate_memory-add.ts",
  "generativeModelName": "@memory/investigate_memory-add.ts"
};
