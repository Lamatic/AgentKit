// Type surface of lib/truth-fetch.js (plain JavaScript: it is inlined into codeNode_211).
export const TRUTH_MAX_BYTES: number;
export function readCapped(res: Response, max: number): Promise<string>;
export function fetchTruth(url: string, ids: string[], hosts?: string[] | null, token?: string | null): Promise<{ fetched: unknown; error: string }>;
