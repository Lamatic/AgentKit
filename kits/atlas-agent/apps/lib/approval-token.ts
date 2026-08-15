import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export type ApprovalContext = {
  approvedTask: Record<string, unknown>;
  requirements: Record<string, unknown>[];
  documents: Record<string, unknown>[];
};

type ApprovalPayload = ApprovalContext & {
  taskId: string;
  requirementIds: string[];
  documentIds: string[];
  issuedAt: number;
  expiresAt: number;
  nonce: string;
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

export function createApprovalToken(context: ApprovalContext, secret: string | undefined, now = Date.now()): string {
  const signingSecret = requireSecret(secret);
  const taskId = context.approvedTask.id;
  if (typeof taskId !== "string" || !taskId.trim()) throw new Error("An approved task ID is required");

  const requirementIds = context.requirements.map((item) => item.id).filter((id): id is string => typeof id === "string");
  const documentIds = context.documents.map((item) => item.id).filter((id): id is string => typeof id === "string");
  const payload: ApprovalPayload = {
    ...context,
    taskId,
    requirementIds,
    documentIds,
    issuedAt: now,
    expiresAt: now + TOKEN_TTL_MS,
    nonce: randomUUID()
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload, signingSecret)}`;
}

export function verifyApprovalToken(token: string | undefined, secret: string | undefined, now = Date.now()): ApprovalPayload {
  const signingSecret = requireSecret(secret);
  if (!token) throw new Error("Approval token is required");
  const [encodedPayload, suppliedSignature, extra] = token.split(".");
  if (!encodedPayload || !suppliedSignature || extra) throw new Error("Invalid approval token");

  const expectedSignature = Buffer.from(sign(encodedPayload, signingSecret));
  const receivedSignature = Buffer.from(suppliedSignature);
  if (expectedSignature.length !== receivedSignature.length || !timingSafeEqual(expectedSignature, receivedSignature)) {
    throw new Error("Invalid approval token");
  }

  let payload: ApprovalPayload;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as ApprovalPayload;
  } catch {
    throw new Error("Invalid approval token");
  }
  if (!payload.taskId || payload.approvedTask?.id !== payload.taskId || !Array.isArray(payload.requirements) || !Array.isArray(payload.documents)) {
    throw new Error("Invalid approval token");
  }
  if (!Number.isFinite(payload.expiresAt) || now >= payload.expiresAt) throw new Error("Approval token has expired");
  return payload;
}
