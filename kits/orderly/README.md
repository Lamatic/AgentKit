# Orderly

**Photograph a menu in any language. Get one concrete order for your table.**

Not a translated menu. An order. Four people, one nut allergy, one vegetarian,
€60 between you, and a menu none of you can read. Orderly answers the actual
question: *what do we order?*

> **The model reads. The solver decides.**
>
> A vision model reads the photograph and writes the prose. Every decision after
> that (what contains an allergen, what each diner may eat, what the table
> should order) is made by deterministic, unit-tested code. No language model
> is asked what is safe to eat.

---

## The problem

You are handed a menu you cannot read. Someone at the table has an allergy.
Someone else is vegetarian. You have a rough idea what you want to spend. You
have no idea which of these thirty lines is safe, which is good, or what the
four of you should actually order.

Existing tools solve a different problem. They translate the menu and hand it
back to you. You still have to do the reasoning: cross-referencing every dish
against every person's constraints, adding up prices in a currency you are still
converting in your head, at a table, with a waiter standing there.

## Why not just use Google Lens?

You should, for translation. Lens does live camera translation in 100+
languages, free, already on your phone, and it does it well. Any tool whose core
feature is "translate the menu" is competing with something you already have.

Lens does not know that Priya cannot eat tree nuts. It does not know you have €60
for four people. It does not know that four of you have to eat from one order,
and that the order has to work for all of you at once.

That is the problem this kit solves, and translation is table stakes underneath
it rather than the point of it.

---

## What it does

```text
┌─ MODEL ─ the menu-scan flow ──────────────────────────┐
│  reads the photograph (OCR + vision)                  │
│  transliterates and translates each dish name         │
│  writes a plain description                           │
│  infers likely ingredients  ← a GUESS, labelled so    │
│  reports lines it could not read                      │
└───────────────────────────────────────────────────────┘
                        ↓  structured JSON
┌─ DETERMINISTIC CODE ─ apps/lib/, 192 tests ───────────┐
│  ingredient → EU-14 allergen mapping                  │
│  dietary rules (vegetarian/vegan/halal/gluten-free)   │
│  price and currency parsing                           │
│  per-diner safety verdicts                            │
│  ★ the solver: party + budget → one order             │
└───────────────────────────────────────────────────────┘
```

The model never sees the budget and never picks a dish.

### Example

> **Party of four.** Priya avoids tree nuts and is vegetarian. Sam avoids
> crustaceans. Alex and Jo have no restrictions. **€60, sharing plates.**

```text
YOUR ORDER                                    €54.00 EUR · €6.00 left
  ✓ Caldo Verde              everyone                          €8.00
  ✓ Grão com Espinafre       everyone                         €12.00
  ✓ Arroz de Tomate          everyone                         €16.00
  ✓ Bacalhau à Brás          Sam, Alex, Jo                    €18.00

EXCLUDED FROM THIS ORDER (3)
  ✕ Priya must avoid an allergen in this dish. On shared plates it
    cannot come to the table at all          (Bolo de Amêndoa)
  ✕ Sam must avoid an allergen in this dish. On shared plates it
    cannot come to the table at all          (Amêijoas à Bulhão Pato)
  ✕ a single serving costs more than the whole budget

⚠ 2 dishes have an unreadable price and cannot be included in a budgeted order.
```

---

## The solver, and what it actually guarantees

[`apps/lib/table-solver.ts`](apps/lib/table-solver.ts) is the heart of this kit.
It is worth being precise about what it promises, because a safety tool that
overclaims is worse than one that claims little.

**Guaranteed:**

1. **Allergen conflicts are eliminated, not penalised.** A dish that any diner
   must avoid is removed from the candidate pool *before* optimisation begins.
   No later stage can reintroduce it: not budget pressure, not a hunt for
   variety, not a tie-break. The guarantee is structural, which is why it can be
   tested by asserting on output rather than by reasoning about weights.

2. **The budget is a ceiling.** The total never exceeds it. When no order can
   feed the table within budget, the solver says so and returns nothing. It
   never offers a plausible order that happens to cost more than you have.

3. **Unpriced dishes are excluded and reported.** A price that could not be read
   is never treated as zero. A dish that appears free would be picked first by
   any budget-aware selection, the worst possible failure mode.

4. **Every dish is accounted for.** Each input dish appears exactly once in
   either the order or the rejection list, and every rejection carries a
   human-readable reason. The decision is auditable end to end.

**Not guaranteed: optimality.** The selection is a deterministic greedy
heuristic with one improvement pass. It is good, explainable, and fast, but not a
proof that no better basket exists within the budget. Set cover is NP-hard and a
restaurant menu does not warrant an exact solver. The claim is that it never
violates a constraint, which is the claim that matters when someone has a nut
allergy.

### Cross-contamination

When plates are shared, an allergen anywhere on the table is an allergen
everywhere on it. Serving spoons get swapped, plates get passed, crumbs travel.
So in shared mode a dish conflicting with *any* diner's allergy is excluded
outright, not merely withheld from that person.

Dietary requirements are treated differently and deliberately so: a vegetarian
is not harmed by someone else ordering pork, so diets remain a per-diner matter.
Only allergies escalate to the whole table. Switch to "own plates" and the
per-diner behaviour returns.

### "Contains" vs "may contain"

An allergen is reported as **contains** only when its keyword appears in the
dish *name*: the original as printed, or a transliteration or translation of it.
Those last two are model output, but they render a string the restaurant chose
rather than an inference about what is in the pot. Anything derived from the
model's guessed ingredient list is **may contain**.

Both disqualify equally. The distinction informs the human; it never relaxes the
constraint. A maybe-allergen is not a risk anyone should be asked to take on the
strength of an OCR pass.

---

## The flow

**`menu-scan`** is the kit's single flow.

| Node | Role |
|---|---|
| API Request | `{ menuImage, targetLanguage, sourceLanguageHint }` |
| Multi Modal | vision: reads the photo, `attachments` bound to `menuImage` |
| Generate JSON | structures the reading into typed JSON |
| API Response | `{ dishes[], detectedLanguage, currency, notes }` |

`menuImage` must be a **publicly-fetchable URL**. The vision node fetches it
itself, so a `blob:` or `data:` URL from the browser will not work. The app
uploads to Vercel Blob first, or accepts a pasted URL.

---

## Setup

**Prerequisites:** Node 18+, a [Lamatic](https://studio.lamatic.ai) account with
a **vision-capable** model credential (Gemini's free tier works).

```bash
cd kits/orderly/apps
cp .env.example .env.local     # fill in the values below
npm install
npm run dev
```

### Environment

| Variable | Where to find it | Required |
|---|---|:---:|
| `LAMATIC_API_URL` | Studio → Settings → API Docs → Endpoint | ✅ |
| `LAMATIC_PROJECT_ID` | Studio → Settings → Project → Project ID | ✅ |
| `LAMATIC_API_KEY` | Studio → Settings → API Keys | ✅ |
| `MENU_SCAN_FLOW_ID` | Studio → open the deployed flow → Flow ID | ✅ |
| `BLOB_READ_WRITE_TOKEN` | [Vercel Blob](https://vercel.com/dashboard/stores) | ✗ |

Without `BLOB_READ_WRITE_TOKEN` the file picker is unavailable and the app
accepts a pasted image URL instead. Everything else works. This is deliberate:
the kit should be runnable and reviewable without signing up for a second
service.

### Scripts

```bash
npm run dev         # development server
npm run build       # production build
npm run typecheck   # tsc --noEmit
npm test            # 192 tests across 6 suites
```

---

## Tests

The decision engine is pure functions with exact expected outputs, so it is
tested properly rather than smoke-tested.

| Suite | Covers |
|---|---|
| `allergen-table.test.ts` | EU-14 mapping, word boundaries, plurals, multi-language keys |
| `diet-rules.test.ts` | vegetarian/vegan/halal/gluten-free, and when to answer "unknown" |
| `price.test.ts` | European vs Anglo separators, ranges, unparseable prices |
| `allergen-engine.test.ts` | contains vs may-contain provenance, per-diner verdicts |
| `table-solver.test.ts` | **every guarantee above, asserted on output** |
| `scan-schema.test.ts` | strict inbound validation, permissive model-output parsing, image-URL safety |

The test worth reading is the adversarial one: on a menu where the almond cake
is by far the cheapest way to feed everyone, a nut-allergic diner at the table
means it is never ordered, at €10, €50, €1000, or with no budget at all.

---

## Honest limitations

- **OCR fails on hard menus.** Handwriting, chalkboards, glare, steep angles,
  and decorative type all degrade the reading. Illegible lines are reported as
  unreadable and excluded rather than guessed at, but a badly-lit photo produces
  a thin menu.
- **Ingredient inference is inference.** The model reasons from dish names. It
  does not know the stock was made with fish, or that the fryer is shared. This
  is why every allergen output is hedged and why the disclaimer is permanent.
- **Halal cannot be determined from a photograph.** Whether meat is halal
  depends on slaughter method. The engine returns `"unknown"` for any meat dish
  rather than guessing in either direction.
- **No currency conversion.** Prices are compared within one currency. A dish
  priced differently from the budget is excluded and reported rather than
  converted at a stale rate.
- **The rate limiter is per-process.** Fine for a demo, insufficient for a
  scaled-out deployment; swap in a shared store if you deploy this seriously.
- **The solver is a heuristic**, as described above.

---

## Not medical advice

Orderly is AI-assisted and can be wrong. It never claims a dish is
allergen-free. Always confirm allergens with restaurant staff before ordering.
Nothing here substitutes for an allergist's guidance or a conversation with the
kitchen.
