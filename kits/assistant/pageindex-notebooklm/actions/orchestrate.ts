"use server";

import { lamaticClient } from "@/lib/lamatic-client";

// ── helpers ──────────────────────────────────────────────────
function safeParseJSON<T>(value: unknown, fallback: T): T {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  if (value !== null && value !== undefined) return value as T;
  return fallback;
}

// ── Flow 1: Upload PDF → build tree → save to Supabase ───────
// Accepts either a remote file_url OR a local file (base64 + mime_type).
export async function uploadDocument(
  file_name: string,
  options: { file_url?: string; file_base64?: string; mime_type?: string }
) {
  try {
    const response = await lamaticClient.executeFlow(
      process.env.FLOW_ID_UPLOAD!,
      { file_name, ...options }
    );
    const data = (response.result ?? response) as Record<string, unknown>;
    return data;
  } catch (error) {
    console.error("Upload flow error:", error);
    throw new Error("Failed to upload document");
  }
}

// ── Flow 2: Chat (tree search → page fetch → answer) ─────────
export async function chatWithDocument(
  doc_id: string,
  query: string,
  messages: Array<{ role: string; content: string }> = []
) {
  try {
    // removed FLOW_ID_CHAT check as it is checked in lamatic-client.ts

    const payload = {
      doc_id,
      query,
      messages: JSON.stringify(messages),
    };

    if (process.env.NODE_ENV !== "production") {
      console.log("[chatWithDocument] SENDING → Flow Execution Started");
    }

    const response = await lamaticClient.executeFlow(
      process.env.FLOW_ID_CHAT!,
      payload
    );

    const raw = response as unknown as Record<string, unknown>;
    const data = (raw.result ?? raw) as Record<string, unknown>;

    if (process.env.NODE_ENV !== "production") {
      console.log("[chatWithDocument] RECEIVED ← Flow Execution Completed");
    }

    return {
      answer: (data.answer as string) ?? "",
      messages: data.messages,
      retrieved_nodes: safeParseJSON(data.retrieved_nodes, []),
      thinking: (data.thinking as string) ?? "",
    };
  } catch (error) {
    console.error("Chat flow error:", error);
    throw new Error("Failed to get answer: " + (error as Error).message);
  }
}

// ── Flow 3: List all documents ────────────────────────────────
export async function listDocuments() {
  try {
    const response = await lamaticClient.executeFlow(
      process.env.FLOW_ID_LIST!,
      {}
    );
    const raw = response as unknown as Record<string, unknown>;
    const data = (raw.result ?? raw) as Record<string, unknown>;

    const documents = safeParseJSON(data?.documents, []);

    return {
      ...data,
      documents,
      total: Number(data?.total) || 0,
    };
  } catch (error) {
    console.error("List flow error:", error);
    throw new Error("Failed to list documents");
  }
}

// ── Flow 4: Get full tree structure (or delete) ────────────────
export async function getDocumentTree(doc_id: string) {
  try {
    const response = await lamaticClient.executeFlow(
      process.env.FLOW_ID_TREE!,
      { doc_id, action: "get_tree" }
    );
    const data = (response.result ?? response) as Record<string, unknown>;
    return {
      ...data,
      tree: safeParseJSON(data?.tree, []),
      tree_node_count: Number(data?.tree_node_count) || 0,
    };
  } catch (error) {
    console.error("Tree flow error:", error);
    throw new Error("Failed to get document tree");
  }
}

// ── Flow 4 (delete action): Remove a document ───────────────────
// Note: This demo kit has no authentication layer — deleteDocument is
// intentionally unauthenticated. Production deployments should add JWT
// validation and ownership checks (e.g., verifyJwt(token) + getDocumentOwner)
// before calling the flow.
export async function deleteDocument(doc_id: string) {
  try {
    const response = await lamaticClient.executeFlow(
      process.env.FLOW_ID_TREE!,
      { doc_id, action: "delete" }
    );
    const data = (response.result ?? response) as Record<string, unknown>;
    return data as { success: boolean; action: string; message: string; doc_id: string; file_name: string };
  } catch (error) {
    console.error("Delete flow error:", error);
    throw new Error("Failed to delete document");
  }
}
