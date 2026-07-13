# Hybrid RRF Search Agent

## Overview
This bundle implements a **Data Retrieval and Reranking Agent**. It does not engage in conversational chat. Instead, its sole purpose is to act as an incredibly precise and intelligent search engine. 

## Purpose
In standard RAG (Retrieval-Augmented Generation) applications, the VectorDB returns results based strictly on mathematical distance. However, these results often contain noise or lack exact keyword matches.

This Agent solves that by acting as a **Judge**. It receives the raw results from the VectorDB (which themselves are a fusion of keyword and vector search) and evaluates them one by one against the user's original query, assigning a relevance score from 0.0 to 1.0. 

## Capabilities
- **Hybrid Retrieval**: Queries Weaviate using both BM25 and Vector search.
- **Data Transformation**: Uses embedded code nodes to safely stringify complex JSON objects so the LLM can read them.
- **Relevance Scoring**: Evaluates retrieved passages purely on relevance.
- **Strict JSON Formatting**: Enforces a strict JSON schema output so that the API always returns structured data, never raw markdown.

## Guardrails
- The agent is instructed to **ONLY** output a JSON object with a top-level `results` array.
- It will not answer questions or generate conversational text.
- It relies on `gemini-2.5-flash` for high-speed, structured output.
