# Isolate interface system

## Direction

The interface behaves like a forensic evidence docket: inputs, investigative hypothesis, observed runs, and certification remain visibly separate. It refuses the generic dashboard of interchangeable cards.

## Surface

- Daylight paper ground (`#f3f1ea`) with white evidence sheets and deep ink (`#17211b`).
- Navy (`#173b57`) marks interactive controls and agent-authored material.
- Evidence green (`#176b45`) is reserved for deterministic passes and certification.
- Amber (`#9a5a12`) marks blocked or incomplete evidence; red (`#a13a32`) marks failures.
- One-pixel rules, square document tabs, and restrained 12px radii establish hierarchy without decorative glass or glow.

## Typography

- UI and long-form evidence use a native sans-serif stack for sustained readability.
- Commands, output, hashes, and measured values use the native monospace stack.
- Headings are compact, heavy, and sentence case; tracked uppercase appears only on docket metadata.

## Composition

- The first viewport pairs a narrow issue intake ledger with a larger evidence workspace.
- Investigation stages form one vertical record rather than separate statistic cards.
- Certification owns the strongest visual field and never shares styling with AI hypotheses.
- On narrow screens the intake precedes the evidence record; no evidence is hidden behind horizontal scrolling except terminal output.

## Interaction and state

- One primary action begins isolation; disabled and loading states name the current operation.
- Focus rings are high contrast and always visible.
- Status uses icon, text, and color together.
- Evidence sections disclose progressively but commands and final outcomes remain visible.
