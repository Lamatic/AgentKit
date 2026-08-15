import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export type ApprovalContext = {
  approvedTask: Record<string, unknown>;
  requirements: Record<string, unknown>[];
  documents: Record<string, unknown>[];
};

export type ApprovalLocator = {
  nonce: string;
  taskId: string;
  issuedAt: number;
  expiresAt: number;
};

export type ApprovalRecord = ApprovalLocator & ApprovalContext & {
  requirementIds: string[];
  documentIds: string[];
  consumedAt: number | null;
};

const TOKEN_TTL_MS = 5 * 60 * 1000;

export function resolveApprovedContext(input: ApprovalContext): ApprovalContext {
  const linkedRequirementIds = Array.isArray(input.approvedTask.requirementIds)
    ? input.approvedTask.requirementIds.filter((id): id is string => typeof id === "string")
    : [];
  const requirements = input.requirements.filter((requirement) =>
    typeof requirement.id === "string" && linkedRequirementIds.includes(requirement.id)
  );
  const linkedDocumentIds = requirements
    .map((requirement) => requirement.documentId)
    .filter((id): id is string => typeof id === "string");
  const documents = input.documents.filter((document) =>
    typeof document.id === "string" && linkedDocumentIds.includes(document.id)
  );
  return { approvedTask: input.approvedTask, requirements, documents };
}

function requireSecret(secret: string | undefined): string {
  if (!secret || secret.length < 32) throw new Error("ATLAS_APPROVAL_SECRET must contain at least 32 characters");
  return secret;
}

function sign(encodedPayload: string, secret: string): string {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

export function createApprovalRecord(context: ApprovalContext, now = Date.now()): ApprovalRecord {
  const taskId = context.approvedTask.id;
  if (typeof taskId !== "string" || !taskId.trim()) throw new Error("An approved task ID is required");
  return {
    ...context,
    nonce: randomUUID(),
    taskId,
    requirementIds: context.requirements.map((item) => item.id).filter((id): id is string => typeof id === "string"),
    documentIds: context.documents.map((item) => item.id).filter((id): id is string => typeof id === "string"),
    issuedAt: now,
    expiresAt: now + TOKEN_TTL_MS,
    consumedAt: null
  };
}

export function createApprovalToken(record: ApprovalRecord, secret: string | undefined): string {
  const signingSecret = requireSecret(secret);
  const locator: ApprovalLocator = {
    nonce: record.nonce,
    taskId: record.taskId,
    issuedAt: record.issuedAt,
    expiresAt: record.expiresAt
  };
  const encodedPayload = Buffer.from(JSON.stringify(locator)).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload, signingSecret)}`;
}

export function verifyApprovalToken(token: string | undefined, secret: string | undefined, now = Date.now()): ApprovalLocator {
  const signingSecret = requireSecret(secret);
  if (!token) throw new Error("Approval token is required");
  const [encodedPayload, suppliedSignature, extra] = token.split(".");
  if (!encodedPayload || !suppliedSignature || extra) throw new Error("Invalid approval token");

  const expectedSignature = Buffer.from(sign(encodedPayload, signingSecret));
  const receivedSignature = Buffer.from(suppliedSignature);
  if (expectedSignature.length !== receivedSignature.length || !timingSafeEqual(expectedSignature, receivedSignature)) {
    throw new Error("Invalid approval token");
  }

  let locator: ApprovalLocator;
  try {
    locator = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as ApprovalLocator;
  } catch {
    throw new Error("Invalid approval token");
  }
  if (!locator.nonce || !locator.taskId || !Number.isFinite(locator.issuedAt) || !Number.isFinite(locator.expiresAt)) {
    throw new Error("Invalid approval token");
  }
  if (now >= locator.expiresAt) throw new Error("Approval token has expired");
  return locator;
}
