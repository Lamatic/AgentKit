# Flows

It uses intelligent workflows to index PDFs and webpages, then provides an interactive chat interface where users can ask questions about their documents through a modern Next.js interface.

## embedded-search-pdf-indexation
Select the model to convert the texts into vector representations.
**Nodes:** Extract from File → Extract Text → Chunking → Get Chunks → Vectorize → Transform Metadata → Index → Variables → API Request → API Response

## embedded-search-resource-deletion
Select the vector database where the action will be performed.
**Nodes:** Condition → VectorDB → Finalise Output → Loop → Loop End → VectorDB → API Request → API Response → Code

## embedded-search-search
**Nodes:** Search Widget → Search Response → Collate Results → Branching → PDF DB Search → Website DB Search

## embedded-search-websites-indexation
Select the credentials for crawler authentication.
**Nodes:** API Request → API Response → Firecrawl → Loop → Loop End → Variables → Chunking → Extract Chunks → Vectorize → Transform Metadata → Index

