/**
 * Throws an InvariantError indicating that a prerender-ppr code path was
 * reached. The prerender-ppr work unit type has been removed and all code
 * handling it is dead. Use this in exhaustive switch cases while the
 * prerender-ppr type is being cleaned up.
 */
export declare function throwPrerenderPPRRemovedError(): never;
