# Flows

## agentic-generate-content
Generates text, image descriptions, or structured JSON content based on user instructions.

**Trigger:** API Request — accepts mode (text/image/json) and instructions
**Processing:** Condition node routes to Text LLM, JSON LLM, or Image Gen based on mode
**Response:** API Response — returns the generated content

### Usage
Call via the server action in `apps/actions/orchestrate.ts` with:
- `inputType`: "text" | "image" | "json"
- `instructions`: the generation prompt
