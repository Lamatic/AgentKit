export interface Document {
  doc_id: string;
  file_name: string;
  file_url: string;
  tree_node_count: number;
  status: string;
  created_at: string;
}

export interface TreeNode {
  node_id: string;
  title: string;
  start_index: number;   // physical page where section starts
  end_index: number;     // physical page where section ends
  summary: string;       // short 1-2 sentence description (≤200 chars), navigation only
  nodes?: TreeNode[];
}

export interface RetrievedNode {
  node_id: string;
  title: string;
  start_index: number;   // exact start page
  end_index: number;     // exact end page
  summary: string;       // short description from tree node
  page_content: string;  // verbatim PDF text fetched from raw_text using start→end range
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  answer: string;
  retrieved_nodes: RetrievedNode[];
  thinking: string;
  doc_id: string;
}

export interface UploadResponse {
  doc_id: string;
  file_name: string;
  tree_node_count: string;
  status: string;
  saved: string;          // "true" or "false" — comes as string from Lamatic
  error: string;
}

export interface ListResponse {
  documents: Document[];
  total: number;
}

export interface TreeResponse {
  tree: TreeNode[];
  file_name: string;
  tree_node_count: number;
  created_at: string;
}
