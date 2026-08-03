# Orderly Agent

## Overview

Orderly turns a photograph of a restaurant menu into one concrete order for a
table of diners, respecting every diner's allergies and dietary requirements and
a hard budget ceiling. It pairs a single vision flow with a deterministic
decision engine: the flow reads the menu and reports what it saw, and
unit-tested application code decides what is safe and what to order.

The agent's responsibility ends at reading. It never selects dishes, never
performs budget arithmetic, and never asserts that anything is safe to eat.

---

## Purpose

Menu translation is a solved problem. Google Lens does it free, in 100+
languages, on a phone people already own. What remains unsolved is the decision
that follows: given who is at this table, what they cannot eat, and what the
bill can be, *what should be ordered?*

That question requires cross-referencing every dish against every diner's
constraints, parsing prices in an unfamiliar currency, and finding a combination
that feeds everyone within budget. That is arithmetic and constraint satisfaction that
a language model performs unreliably and that ordinary code performs exactly.

Orderly splits the work along that line. The model does language and vision.
Code does safety and arithmetic.

---

## Flows

### `menu-scan` (mandatory · `MENU_SCAN_FLOW_ID`)

**Trigger: API Request**

| Field | Type | Notes |
|---|---|---|
| `menuImage` | string | A **publicly-fetchable** image URL. The vision node fetches it directly, so `blob:` and `data:` URLs fail. |
| `targetLanguage` | string | Language for translations and descriptions, e.g. `"English"`. |
| `sourceLanguageHint` | string | Optional. The menu's language, when known. |

**Processing**

1. **Multi Modal**: `attachments` bound to `{{triggerNode_1.output.menuImage}}`.
   Reads the photograph and extracts every dish: the name as printed, a
   transliteration, a translation, a one-line description, a best-guess
   ingredient list, the printed price, and a category.
2. **Generate JSON**: structures that reading into typed JSON against the
   schema below.

**Response: API Response**

```json
{
  "detectedLanguage": "Portuguese",
  "currency": "EUR",
  "notes": "The lower third of the menu was out of frame.",
  "dishes": [
    {
      "nameOriginal": "Bacalhau à Brás",
      "nameTransliterated": "",
      "nameTranslated": "Shredded cod with potato and egg",
      "description": "Salt cod scrambled with straw potatoes, egg and olives.",
      "likelyIngredients": ["cod", "potato", "egg", "onion", "olive"],
      "priceRaw": "€18",
      "category": "main",
      "confidence": "high"
    }
  ]
}
```

**When to use**: any time a diner needs a menu read: an unfamiliar language, an
unfamiliar cuisine, or an allergy that makes an unlabelled menu unusable.

**Output consumers**: `apps/actions/orchestrate.ts` passes the result through
`FlowResultSchema`, then `enrichDishes()`, then `planTable()`. Nothing in the
flow output is treated as authoritative; it is all input to deterministic
verification.

**Dependencies**: a vision-capable model credential (Gemini free tier is
sufficient). No RAG, memory, tools, or code nodes.

---

## Guardrails

Full text in [`constitutions/default.md`](constitutions/default.md). The rules
that bind hardest:

- **Never claim any dish is allergen-free.** The kitchen is not visible from a  photograph: not the fryer oil, not the shared grill, not the stock.
- **Inferred ingredients must be labelled as inferences.** The application
  distinguishes what the restaurant printed from what the model guessed, and
  reports them differently. A guess presented as fact defeats that.
- **Never invent a dish.** Illegible lines return `confidence: "unknown"` with
  an empty ingredient list. A missing dish is an inconvenience; a fabricated one
  with fabricated ingredients is a hazard.
- **Never guess a price.** Unreadable prices are left empty; the solver excludes
  those dishes from budget arithmetic and tells the user.
- **Not medical advice.** Every allergen output assumes the diner will confirm
  with staff.

**Operational limits**: party size is capped at 8, uploads at 8 MB
(JPEG/PNG/WebP/HEIC), and scans at 8 per client per 10 minutes.

---

## Integration reference

| Service | Purpose | Credential |
|---|---|---|
| Lamatic | Flow execution | `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` |
| Gemini (via Lamatic) | Vision + JSON structuring | Configured in Studio → Connections |
| Vercel Blob | Hosting uploaded photos so the vision node can fetch them | `BLOB_READ_WRITE_TOKEN` *(optional)* |

Without a Blob token the app accepts a pasted image URL instead. Everything else
works, so the kit is runnable without a second signup.

---

## Environment setup

| Variable | Source | Required |
|---|---|:---:|
| `LAMATIC_API_URL` | Studio → Settings → API Docs → Endpoint | ✅ |
| `LAMATIC_PROJECT_ID` | Studio → Settings → Project → Project ID | ✅ |
| `LAMATIC_API_KEY` | Studio → Settings → API Keys | ✅ |
| `MENU_SCAN_FLOW_ID` | Studio → deployed flow → Flow ID | ✅ |
| `BLOB_READ_WRITE_TOKEN` | Vercel → Storage → Blob | ✗ |

Flow IDs are resolved through `lamatic.config.ts` rather than hardcoded, so a
renamed `envKey` cannot leave the runtime and the metadata out of step.

---

## Quickstart

1. Create a Lamatic project and connect a **vision-capable** model credential.
2. Build `menu-scan` (API Request → Multi Modal → Generate JSON → API Response),
   binding the Multi-Modal node's `attachments` to the trigger's `menuImage`.
3. **Deploy** the flow and wait for a green status.
4. Copy the Flow ID and your three project credentials.
5. `cd kits/orderly/apps && cp .env.example .env.local`, fill in the values.
6. `npm install && npm run dev`, then open http://localhost:3000.
7. Paste a menu image URL, add your diners and budget, and press **Plan our order**.

---

## Common failure modes

| Symptom | Cause | Fix |
|---|---|---|
| "This deployment isn't configured yet" | One or more env vars missing or blank | Copy `.env.example` to `.env.local` and fill it; the error names the missing variables |
| "Lamatic rejected this project's credentials" | Bad API key or project ID | Regenerate in Studio → Settings → API Keys |
| "The menu-scan flow could not be found" | `MENU_SCAN_FLOW_ID` does not match a deployed flow | Confirm the flow is deployed (green) and re-copy its ID |
| No dishes returned, image looks fine | The vision node cannot fetch the URL | The URL must be public, not `blob:`, `data:`, `localhost`, or behind auth |
| Every dish is `unreadable` | Photo too dark, angled, or low-resolution | Retake straight-on with the whole menu in frame |
| Dishes appear but all prices are missing | Prices in a decorative face, or absent from the menu | Expected. Those dishes are excluded from budgeting and reported in warnings |
| "No combination of dishes feeds everyone within budget" | Genuinely infeasible | Raise the budget, or switch to sharing plates |
| A diner is listed as unfed | Nothing on the menu is safe for their constraints | Expected and correct. Ask staff about off-menu options |
| Order excludes a dish that looks fine | Shared-plate cross-contamination rule | Switch to "own plates" for per-diner behaviour |
| "That's 8 menus in ten minutes" | Rate limit | Wait, or raise the limit in `lib/rate-limit.ts` |
