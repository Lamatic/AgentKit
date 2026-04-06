# RAG Chatbot

A chatbot that answers questions based on a context database containing all relevant information. User queries are answered using the existing documentation.

## Structure

```
rag-chatbot/
├── flows/
│   ├── flows.md                  # Flow descriptions
│   ├── rag-chatbot.ts            # Flow definition
│   ├── rag-chatbot.inputs.json   # Input schema
│   └── rag-chatbot.meta.json     # Metadata
├── prompts/
│   └── system.md                 # System prompt for RAG node
├── constitutions/
│   └── default.md                # Default guardrails
├── lamatic.config.ts             # Project config
└── README.md
```

## Flow

**Chat Widget** (trigger) → **RAG** (retrieval + generation) → **Chat Response**

1. User sends a message via Chat Widget
2. RAG node retrieves relevant context from vector DB and generates an answer
3. Chat Response returns the answer

## Deploy

[Deploy on Lamatic](https://studio.lamatic.ai/template/rag-chatbot)

## Tags

`support` `startup`
