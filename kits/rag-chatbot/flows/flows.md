# Flows

## rag-chatbot

RAG-powered chatbot that answers user questions using a vector knowledge base.

**Trigger:** Chat Widget — accepts user messages via chat interface
**Processing:** RAG Node — retrieves relevant context from vector DB, generates answer using LLM
**Response:** Chat Response — returns the generated answer to the user

### Node Chain

```
Chat Widget (trigger) → RAG → Chat Response
```

### Configuration Required

- Vector DB connection (embedding model + generative model)
- System prompt (see `prompts/system.md`)
