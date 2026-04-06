# Flows

## agentic-generate-content

Generates text, image descriptions, or structured JSON content based on user instructions.

**Trigger:** API Request — accepts mode (text/image/json) and instructions
**Processing:** LLM Generation node — processes the request based on mode
**Response:** API Response — returns the generated content

### Usage

Call via the server action in `actions/orchestrate.ts` with:
- `inputType`: "text" | "image" | "json"
- `instructions`: the generation prompt
