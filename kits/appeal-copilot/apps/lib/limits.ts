/**
 * Input bounds shared by the client form and the server action, so both sides enforce
 * the same contract and oversized input is rejected before it reaches the paid flow.
 *
 * A denial letter or EOB is typically one to three pages; 32k characters (~8k tokens)
 * leaves generous headroom for a long multi-claim EOB while capping what a single
 * request can spend across the flow's six model calls.
 */
export const MAX_DENIAL_TEXT_CHARS = 32_000;

/** Supporting context is a short note, not a document. */
export const MAX_ADDITIONAL_CONTEXT_CHARS = 4_000;
