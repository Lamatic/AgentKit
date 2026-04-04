# Founder Lens — Chat Flow

## Trigger Input
```json
{
  "message": "string",
  "userId": "string",
  "sessionId": "string"
}
```

## Response Output
```json
{
  "answer": "string"
}
```

## What It Does
1. Retrieves the indexed Founder Brief from Weaviate using RAGNode (filtered by userId + sessionId)
2. Retrieves conversation history from semantic memory (filtered by userId + sessionId)
3. Passes both to GPT-4o to answer the founder's question with full context
4. Stores the exchange back to memory for future turns

## Notes
- The analyze flow must be run first for the same userId + sessionId before the chat flow will have context
- sessionId scopes the brief — a new sessionId means a fresh analysis
