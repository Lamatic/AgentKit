# 🚀 Pitch: Hybrid RRF Search Bundle

## The Problem with Standard RAG

The biggest complaint about standard Retrieval-Augmented Generation (RAG) is that **vector search alone is not enough**.
While vector search is great for finding semantic meaning ("planetary vehicle" matches "rover"), it is terrible at exact keyword matching. If a user searches for a specific ID like `MBA-9932-REV-B`, vector search often completely misses it.

On the flip side, traditional keyword search (BM25) is great at exact matches, but terrible at understanding intent.

## The Solution: Hybrid Search + Reciprocal Rank Fusion

This bundle solves that problem by implementing a true **Hybrid Search Pipeline**.
It runs both a Vector Search and a Keyword Search at the exact same time, and uses a mathematical algorithm called **Reciprocal Rank Fusion (RRF)** to combine the results. The passages that rank high in *both* searches bubble to the top.

## The Secret Sauce: LLM Reranking

We don't stop at RRF. This pipeline pipes the top fused results directly into an LLM (Gemini 2.5 Flash) configured with a strict JSON schema. The LLM acts as a **Judge**, reading the passages and scoring them against the user's exact query from 0.0 to 1.0.

It outputs a perfectly formatted JSON object with a `results` key containing the definitive Top 5 passages, completely eliminating noise.

## Why Lamatic Needs This

Building an RRF pipeline with an LLM reranker usually requires writing hundreds of lines of complex orchestration code in Python or LangChain.
With this bundle, developers can import a production-ready RRF pipeline directly into their Lamatic workspace and deploy it instantly as a scalable GraphQL API. It perfectly showcases Lamatic's ability to orchestrate multi-step data transformations and structured LLM outputs!
