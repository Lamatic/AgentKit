/**
 * Normalizes Lamatic executeWorkflow `result` into subject_line, email_body, personalized_hook.
 * Handles: flat object, nested generatedResponse (string or object), and ```json fences.
 */
export type ColdEmailOutput = {
  subject_line: string
  email_body: string
  personalized_hook: string
}

function stripJsonFences(s: string): string {
  return s
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()
}

function parseFromJsonString(raw: string): ColdEmailOutput {
  const cleaned = stripJsonFences(raw)
  const parsed = JSON.parse(cleaned) as Record<string, unknown>

  const subject_line = parsed.subject_line
  const email_body = parsed.email_body
  const personalized_hook = parsed.personalized_hook

  if (
    typeof subject_line !== "string" || subject_line.trim() === "" ||
    typeof email_body !== "string" || email_body.trim() === ""
  ) {
    throw new Error("Parsed JSON is missing required subject_line or email_body.")
  }

  return {
    subject_line,
    email_body,
    personalized_hook: typeof personalized_hook === "string" ? personalized_hook : "",
  }
}

function isColdEmailShape(o: Record<string, unknown>): boolean {
  return (
    typeof o.subject_line === "string" && o.subject_line.trim() !== "" &&
    typeof o.email_body === "string" && o.email_body.trim() !== ""
  )
}

function fromShape(o: Record<string, unknown>): ColdEmailOutput {
  return {
    subject_line: o.subject_line as string,
    email_body: o.email_body as string,
    personalized_hook: typeof o.personalized_hook === "string" ? o.personalized_hook : "",
  }
}

function tryParseEmailJsonString(s: string): ColdEmailOutput | null {
  const t = s.trim()
  if (t.length < 15 || !t.includes("subject_line")) return null
  try {
    return parseFromJsonString(t)
  } catch {
    return null
  }
}

const MAX_DEPTH = 6

function findEmailObject(obj: unknown, depth = 0): ColdEmailOutput | null {
  if (obj == null || depth > MAX_DEPTH) return null

  if (typeof obj === "string") {
    return tryParseEmailJsonString(obj)
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findEmailObject(item, depth + 1)
      if (found) return found
    }
    return null
  }

  if (typeof obj !== "object") return null

  const r = obj as Record<string, unknown>

  if (isColdEmailShape(r)) return fromShape(r)

  if (typeof r.generatedResponse === "string" && r.generatedResponse.length > 0) {
    const fromGen = tryParseEmailJsonString(r.generatedResponse)
    if (fromGen) return fromGen
  }

  if (r.generatedResponse && typeof r.generatedResponse === "object" && !Array.isArray(r.generatedResponse)) {
    const nested = r.generatedResponse as Record<string, unknown>
    if (isColdEmailShape(nested)) return fromShape(nested)
  }

  if (typeof r.answer === "string") {
    const fromAnswer = tryParseEmailJsonString(r.answer)
    if (fromAnswer) return fromAnswer
  }

  if (typeof r.output === "string" && r.output.trim().length > 0) {
    const fromOut = tryParseEmailJsonString(r.output)
    if (fromOut) return fromOut
  }

  if (r.output && typeof r.output === "object") {
    const inner = findEmailObject(r.output, depth + 1)
    if (inner) return inner
  }

  for (const v of Object.values(r)) {
    const found = findEmailObject(v, depth + 1)
    if (found) return found
  }

  return null
}

function isSchemaEchoNotEmailData(r: Record<string, unknown>): boolean {
  if (r.type !== "object" || !r.properties || typeof r.properties !== "object") return false
  const props = r.properties as Record<string, unknown>
  const sl = props.subject_line
  const eb = props.email_body
  const ph = props.personalized_hook
  if (!sl || !eb || !ph || typeof sl !== "object" || typeof eb !== "object" || typeof ph !== "object") return false
  return (
    (sl as { type?: string }).type === "string" &&
    (eb as { type?: string }).type === "string" &&
    (ph as { type?: string }).type === "string" &&
    typeof r.subject_line !== "string" &&
    typeof r.email_body !== "string" &&
    typeof r.generatedResponse !== "string"
  )
}

const LAMATIC_SCHEMA_ECHO_MESSAGE =
  "Lamatic returned the API Response JSON Schema instead of email content. " +
  "In Studio → API Response node → set outputMapping to map generatedResponse to " +
  "{{LLMNode_XXX.generatedResponse}}, then Save and Deploy."

export function parseColdEmailResult(result: unknown): ColdEmailOutput {
  if (result == null) {
    throw new Error("No result returned from workflow.")
  }

  if (typeof result === "string") {
    const parsed = tryParseEmailJsonString(result)
    if (parsed) return parsed
    throw new Error("Workflow returned a string that is not valid email JSON.")
  }

  if (typeof result !== "object") {
    throw new Error("Unexpected workflow result type.")
  }

  const found = findEmailObject(result, 0)
  if (found) return found

  const r = result as Record<string, unknown>
  if (isSchemaEchoNotEmailData(r)) {
    throw new Error(LAMATIC_SCHEMA_ECHO_MESSAGE)
  }

  throw new Error(
    "Workflow result did not contain subject_line, email_body, or personalized_hook. " +
    "Check your Lamatic API Response node outputMapping and redeploy.",
  )
}
