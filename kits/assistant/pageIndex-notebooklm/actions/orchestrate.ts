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
export async function uploadDocument(file_url: string, file_name: string) {
  try {
    const response = await lamaticClient.executeFlow(
      process.env.FLOW_ID_UPLOAD!,
      { file_url, file_name }
    );
    // Response shape: { status, result: { doc_id, file_name, ... } }
    return response.result ?? response;
  } catch (error) {
    console.error("Upload flow error:", error);
    throw new Error("Failed to upload document");
  }
}

// ── Flow 2: Chat (tree search → page fetch → answer) ─────────
export async function chatWithDocument(
  doc_id: string,
  query: string,
  messages: Array<{ role: string; content: string }>
) {
  try {
    const response = await lamaticClient.executeFlow(
      process.env.FLOW_ID_CHAT!,
      { doc_id, query, messages }
    );

    const data = response.result ?? response;

    // retrieved_nodes comes back as a JSON string from the Code Node
    return {
      ...data,
      retrieved_nodes: safeParseJSON(data?.retrieved_nodes, []),
    };
  } catch (error) {
    console.error("Chat flow error:", error);
    throw new Error("Failed to get answer");
  }
}

// ── Flow 3: List all documents ────────────────────────────────
export async function listDocuments() {
  try {
    const response = await lamaticClient.executeFlow(
      process.env.FLOW_ID_LIST!,
      {}
    );

    const data = response.result ?? response;

    // documents comes back as a JSON string (JSON.stringify applied in Code Node)
    return {
      ...data,
      documents: safeParseJSON(data?.documents, []),
      total: Number(data?.total) || 0,
    };
  } catch (error) {
    console.error("List flow error:", error);
    throw new Error("Failed to list documents");
  }
}

// ── Flow 4: Get full tree structure ───────────────────────────
export async function getDocumentTree(doc_id: string) {
  try {
    const response = await lamaticClient.executeFlow(
      process.env.FLOW_ID_TREE!,
      { doc_id }
    );

    const data = response.result ?? response;

    // tree comes back as a JSON string (JSON.stringify applied in Code Node)
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
