# DetectiveAI Agent Specification

## Overview
DetectiveAI is an interactive AI-powered investigation system that simulates a detective scenario. It utilizes LLMs orchestrated via Lamatic AgentKit to handle natural language suspect interrogations, forensic analysis of clues, and hypothesis grading, while maintaining strict state synchronization and rules enforcement through a deterministic Python backend engine.

## Purpose
Traditional detective games feature rigid dialog trees and binary search triggers. DetectiveAI solves this by introducing dynamic generative interactions without sacrificing the integrity of the mystery's ground truth. By isolating the game database from LLM knowledge, it provides deep roleplaying and reasoning capabilities with zero risk of information leakage or game state cheating.

## Flows

### 1. Suspect Interrogation Flow (`suspect-interrogation`)
* **Trigger:** Invoked when an investigator interviews a suspect.
* **Processing:** Injecting suspect-specific alibis, relations, and recent dialogue history into the context, keeping secret files whitelisted out.
* **Response:** Generates an in-character natural response.
* **When to Use:** During suspect dialogue interrogations in the CLI or Web UI.
* **Output:** A single string answer representing the suspect's reply.
* **Dependencies:** Requires `LAMATIC_SUSPECT_FLOW_ID`.

### 2. Evidence Examination Flow (`evidence-examination`)
* **Trigger:** Invoked when analyzing a discovered clue item.
* **Processing:** Evaluates physical alibi logs, forensics description, and investigation context to generate descriptive observations.
* **Response:** Outputs structured forensic details, distinguishing direct observations from inferences.
* **When to Use:** When examining items like modified USB drives, access log files, or physical notes.
* **Output:** String containing the forensic interpretation.
* **Dependencies:** Requires `LAMATIC_EVIDENCE_FLOW_ID`.

### 3. Solution Evaluation Flow (`solution-evaluation`)
* **Trigger:** Invoked when submitting a case hypothesis solution.
* **Processing:** Compares user motives, evidence citation lists, and timeline reconstructions against established public facts.
* **Response:** Generates a structured JSON object containing numerical sub-scores (overall, evidence, motive, reasoning, timeline) and textual feedback.
* **When to Use:** At the end of a session to judge the detective's verdict.
* **Output:** Rubric grading JSON object.
* **Dependencies:** Requires `LAMATIC_SOLUTION_FLOW_ID`.

## Guardrails
* **No Ground-Truth Leaking:** Under no circumstances should the LLM receive the actual killer identity (`culprit_id`, `is_culprit` flag), secret timeline events, or undiscovered clue metadata.
* **Consistency:** Suspects must strictly refuse to invent facts that contradict their provided alibi or alibi relations.
* **No State Mutations:** The LLM cannot mutate database records or game sessions; all state edits remain locked in the Python backend.

## Integration Reference
All flows are hosted on Lamatic Studio. The client application connects using the GraphQL runtime endpoint.
* **Scraper / Connectors:** None (relies on local scenario data).
* **LLM Provider:** OpenAI or Anthropic (configured inside Lamatic Studio).

## Environment Setup
* `LAMATIC_ENDPOINT`: The GraphQL API gateway URL.
* `LAMATIC_PROJECT_ID`: Target project ID.
* `LAMATIC_API_KEY`: API access token.
* `LAMATIC_SUSPECT_FLOW_ID`: Suspect interrogation flow UUID.
* `LAMATIC_EVIDENCE_FLOW_ID`: Evidence examination flow UUID.
* `LAMATIC_SOLUTION_FLOW_ID`: Solution evaluation flow UUID.

## Quickstart
1. Set up python virtual environment in `apps/backend/`.
2. Configure `.env` keys in the root directory.
3. Start the FastAPI uvicorn server.
4. Open the web UI in `apps/frontend/` or launch the interactive terminal game with `python -m cli play the_midnight_archive`.

## Common Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Interrogations return connection error | Unconfigured or invalid `LAMATIC_` keys in `.env` | Verify project ID, API key, and flow IDs in your `.env` file. |
| DB state is not shared between API and CLI | Backend was run from different working directories | The database path has been updated to resolve relative to module path dynamically; ensure `DATABASE_URL` is unset or points to the same SQLite path. |
| Clues are not discoverable | Action points are depleted or stage requirement is not met | Check the current objective or progression requirements in the game dashboard. |
