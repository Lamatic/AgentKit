# SnapKart Agent

## Overview
SnapKart is a two-flow WhatsApp ordering agent for Indian kirana stores. It processes every incoming WhatsApp message through a 4-intent classification pipeline, handles orders end-to-end, answers catalog inquiries with real prices, and routes complaints to the shop owner.

## Flows

### order-intake
Trigger: Twilio WhatsApp webhook (POST)
Purpose: Process every incoming customer message

Pipeline:
1. Memory Retrieve - semantic retrieval of past customer interactions
2. Classifier - 4-class intent detection using llama-3.3-70b-versatile on Groq
3. Branch - routes to the correct handler based on classified intent
4. new_order path: Generate JSON extraction, Condition gate, Code node formatter, Airtable write, Slack alert
5. inquiry path: Hybrid Search against the catalog VectorDB
6. All paths converge to Generate Text universal responder
7. Twilio sends the reply as WhatsApp message

Input fields used from Twilio payload:
- Body: the customer message text
- From: customer WhatsApp number
- WaId: clean phone number used as memory key and Airtable phone field
- ProfileName: customer WhatsApp display name for personalized greetings

### catalog-indexer
Trigger: HTTP POST webhook with catalog JSON payload
Purpose: Index the shop product catalog into the vector database

Pipeline:
1. Code formatter - transforms each item into searchable text
2. Vectorize - generates 3072-dimensional embeddings using Gemini
3. Code packager - pairs vectors with metadata, handles type coercion
4. VectorDB - indexes all records with overwrite deduplication

## Models
- Classifier: Groq llama-3.3-70b-versatile
- Generate JSON: Groq llama-3.3-70b-versatile
- Generate Text: Groq llama-3.3-70b-versatile
- Vectorize: Google gemini-embedding-001 3072d
- Hybrid Search: Google gemini-embedding-001 3072d

## Known limitations
- Twilio sandbox sessions expire every 72 hours
- Airtable OAuth node has a platform bug - kit uses API node with PAT as workaround
- Memory Add node LLM extraction did not trigger reliably - returning customer memory is wired but inactive