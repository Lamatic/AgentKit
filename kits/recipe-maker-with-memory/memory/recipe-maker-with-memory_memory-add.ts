// Memory config: Memory Add (memoryNode)
// Flow: recipe-maker-with-memory

export default {
  "memoryCollection": "receipeTest",
  "uniqueId": "{{triggerNode_1.output.id}}",
  "sessionId": "",
  "memoryValue": [
    {
      "role": "user",
      "content": "{{triggerNode_1.output.query}}"
    }
  ],
  "embeddingModelName": {},
  "generativeModelName": {}
};
