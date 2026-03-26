export interface Document {
  doc_id: string;
  file_name: string;
  file_url: string;
  tree_node_count: number;
  status: string;
  created_at: string;
}

// Raw API shape: nodes is a flat array of child IDs
export interface TreeNode {
  node_id: string;
  title: string;
  start_index: number;
  end_index: number;
  summary: string;
  nodes: string[];       // child node_ids
}

// Resolved shape used internally after building the tree
export interface TreeNodeResolved {
  node_id: string;
  title: string;
  start_index: number;
  end_index: number;
  summary: string;
  nodes: TreeNodeResolved[];
}

export interface RetrievedNode {
  node_id: string;
  title: string;
  start_index: number;   // exact start page
  end_index: number;     // exact end page
  summary: string;       // short description from tree node
  page_content: string;  // verbatim PDF text fetched from start→end range
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
  saved: string;
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
