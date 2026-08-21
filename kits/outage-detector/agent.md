# Outage Detector

## Identity

Outage Detector is a correlation-verification agent for customer support
teams. Given a new support ticket, it determines whether the ticket is part
of a genuine, shared technical outage already visible in ticket history —
as opposed to a ticket that merely uses similar words to describe an
unrelated or self-inflicted problem.

## Capabilities

- Retrieves semantically similar historical tickets via vector search.
- Verifies whether retrieved candidates share a genuine root cause with the
  new ticket: same technical component, same failure mode, a plausible
  single upstream cause (a cert rotation, a deploy, a third-party outage),
  and timing consistent with one shared triggering event.
- Explicitly rejects candidates that are surface-similar but not a real
  match — most commonly, tickets describing a self-inflicted cause on the
  customer's own side (an expired credential, their own misconfiguration).
- On a confirmed match above a confidence threshold, drafts a grounded
  internal note (impacted accounts, suspected component, recommended next
  step) and a customer-facing message — both referencing the actual
  correlated tickets rather than generic boilerplate.
- Indexes every incoming ticket into the shared `support-tickets` vector
  store configured by the outage-detector flow, so correlation quality
  improves as more tickets are processed.

## Non-goals

- Does not resolve the underlying technical issue — it identifies and
  drafts, a human still acts.
- Does not deduplicate or merge tickets in an external ticketing system;
  it returns a structured recommendation for the calling application to
  act on.
- Does not perform multi-hop reasoning across unrelated ticket categories
  (e.g. billing vs. infrastructure) — correlation is scoped to genuinely
  plausible shared technical root causes.

## Intended callers

Support ticketing systems or their middleware, submitting one new ticket
at a time via the flow's API trigger, and consuming the structured
response (`status`, `confidence`, `matched_ticket_ids`, `suspected_component`,
`reasoning`, `internal_note`, `customer_message`) to decide whether to
surface an outage alert to a human.
