# API Documentation Agent

## What it does
Takes a raw OpenAPI 3.x or Swagger 2.0 specification (JSON or YAML) and produces three outputs: structured endpoint documentation, language-specific code examples, and plain-language explanations — all in a single pass through a four-stage pipeline.

## How the pipeline works
1. **Parse & Classify** — An InstructorLLMNode extracts a structured inventory of every endpoint: method, path, summary, parameters, request/response schemas, and authentication requirements. The structured JSON output ensures downstream nodes receive clean, normalised data regardless of whether the input was Swagger 2.0 or OpenAPI 3.x, JSON or YAML.
2. **Document** — An LLMNode generates detailed Markdown documentation for each endpoint group, including parameter tables, status codes, authentication notes, and rate-limiting caveats.
3. **Exemplify** — A second LLMNode generates realistic, runnable code examples (cURL, Python `requests`, JavaScript `fetch`, and TypeScript `axios`) for every endpoint, using plausible sample data derived from the schema constraints.
4. **Review & Assemble** — A final InstructorLLMNode reviews the combined documentation and examples for accuracy, completeness, and consistency against the original spec, then returns the assembled output with a quality score.

## Design decisions

### Why structured extraction first?
OpenAPI specs vary wildly in style — `$ref` nesting depth, vendor extensions, description quality. By normalising into a flat endpoint inventory up front, the downstream doc and example generators operate on consistent input and never hallucinate endpoint paths or parameter names.

### Why a review pass?
Documentation generators can drift from the spec (wrong status codes, missing required fields). The review node cross-checks the generated docs against the parsed inventory and flags discrepancies, producing a confidence score the caller can threshold on.

### Bounded pipeline, not a loop
Like all Lamatic flows, this is a DAG — no cycles. The four-stage pipeline runs exactly once per invocation with deterministic cost (four LLM calls).

## Input
`openapi_spec` (string) — A full OpenAPI 3.x or Swagger 2.0 specification as a JSON or YAML string.

## Output
- `documentation` (string) — Structured Markdown documentation for all endpoints.
- `examples` (string) — Runnable code examples in cURL, Python, JavaScript, and TypeScript.
- `summary` (string) — A plain-language API overview covering purpose, auth, and key patterns.
- `quality_score` (number, 0–1) — Review score reflecting accuracy and completeness against the original spec.
- `issues` (array of strings) — Specific discrepancies or improvement suggestions found during review.

## Nodes
| Node | Type | Purpose |
|---|---|---|
| parser | InstructorLLMNode | Extracts a structured endpoint inventory from the raw spec |
| documenter | LLMNode | Generates Markdown endpoint documentation |
| exemplifier | LLMNode | Generates runnable code examples per endpoint |
| reviewer | InstructorLLMNode | Cross-checks docs + examples against the parsed spec, scores quality |
