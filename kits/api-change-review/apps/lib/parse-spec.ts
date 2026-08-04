import yaml from "js-yaml";

/**
 * Accept whatever the user's repo happens to hold. JSON is valid YAML, so the
 * JSON attempt is only a fast path — the YAML fallback is what actually decides.
 */
export function parseSpec(text: string, label: string): any {
  const trimmed = text.trim();
  if (!trimmed) throw new Error(`${label} is empty.`);

  try {
    return JSON.parse(trimmed);
  } catch {
    let parsed: unknown;
    try {
      parsed = yaml.load(trimmed);
    } catch (e: any) {
      throw new Error(`${label} is not valid JSON or YAML: ${e.message}`);
    }
    if (!parsed || typeof parsed !== "object") {
      throw new Error(`${label} is not valid JSON or YAML: it did not parse to an object.`);
    }
    return parsed;
  }
}

/**
 * Cheap sanity check before diffing. Without it, a non-OpenAPI paste produces an
 * empty diff and a confident "no changes" answer, which is the worst failure mode
 * this tool can have.
 */
export function assertLooksLikeOpenApi(spec: any, label: string): void {
  if (!spec.paths || typeof spec.paths !== "object") {
    throw new Error(
      `${label} does not look like an OpenAPI document — no top-level "paths" object was found.`
    );
  }
}
