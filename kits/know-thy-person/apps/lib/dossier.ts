export interface Identity {
  name: string;
  role: string | null;
  company: string | null;
  location: string | null;
  sources: string[];
}
export interface OutsideWork {
  note: string;
  source_url: string;
}
export interface TalkingPoint {
  point: string;
  why_it_works: string;
  source_url: string;
}
export type Confidence = "high" | "medium" | "low";

export interface Dossier {
  identity: Identity;
  summary: string;
  outside_work: OutsideWork[];
  talking_points: TalkingPoint[];
  couldnt_confirm: string[];
  sources: string[];
  confidence: Confidence;
}

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const strOrNull = (v: unknown): string | null =>
  typeof v === "string" && v.length > 0 ? v : null;
const strArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
const conf = (v: unknown): Confidence =>
  v === "high" || v === "medium" ? v : "low";

/**
 * Read a key from an object, tolerating both a snake_case and a camelCase
 * spelling. Returns the first defined value.
 */
function pick(
  obj: Record<string, unknown>,
  ...keys: string[]
): unknown {
  for (const k of keys) {
    if (obj[k] !== undefined) return obj[k];
  }
  return undefined;
}

function toObj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function sourceUrl(o: Record<string, unknown>): string {
  return str(pick(o, "source_url", "sourceUrl"));
}

/**
 * Turn the flow's `answer` (a JSON string OR an object, possibly camelCase or
 * snake_case) into a fully-shaped canonical `Dossier` (snake_case internally).
 * Missing fields get safe defaults; talking_points/outside_work items without a
 * source URL are dropped so the UI never renders an unsourced claim.
 */
export function normalizeDossier(raw: unknown): Dossier {
  let obj: Record<string, unknown> = {};
  if (typeof raw === "string") {
    try {
      obj = toObj(JSON.parse(raw));
    } catch {
      obj = {};
    }
  } else {
    obj = toObj(raw);
  }

  const id = toObj(obj.identity);
  const identity: Identity = {
    name: str(id.name),
    role: strOrNull(id.role),
    company: strOrNull(id.company),
    location: strOrNull(id.location),
    sources: strArr(id.sources),
  };

  const outsideRaw = pick(obj, "outside_work", "outsideWork");
  const outside_work: OutsideWork[] = (
    Array.isArray(outsideRaw) ? outsideRaw : []
  )
    .map(toObj)
    .filter((o) => sourceUrl(o).length > 0)
    .map((o) => ({ note: str(o.note), source_url: sourceUrl(o) }));

  const talkingRaw = pick(obj, "talking_points", "talkingPoints");
  const talking_points: TalkingPoint[] = (
    Array.isArray(talkingRaw) ? talkingRaw : []
  )
    .map(toObj)
    .filter((t) => sourceUrl(t).length > 0)
    .map((t) => ({
      point: str(t.point),
      why_it_works: str(pick(t, "why_it_works", "whyItWorks")),
      source_url: sourceUrl(t),
    }));

  return {
    identity,
    summary: str(obj.summary),
    outside_work,
    talking_points,
    couldnt_confirm: strArr(pick(obj, "couldnt_confirm", "couldntConfirm")),
    sources: strArr(obj.sources),
    confidence: conf(obj.confidence),
  };
}
