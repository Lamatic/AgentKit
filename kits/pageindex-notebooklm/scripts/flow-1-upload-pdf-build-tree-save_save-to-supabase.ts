const tree = {{InstructorLLMNode_tree.output.tree}};
const rawText = {{codeNode_format.output.raw_text}};
const fileName = {{triggerNode_1.output.file_name}};
const fileUrl = {{codeNode_630.output.resolved_url}};
const supabaseUrl = {{secrets.project.SUPABASE_URL}};
const supabaseKey = {{secrets.project.SUPABASE_SERVICE_ROLE_KEY}};

function sanitize(str) {
  if (typeof str !== "string") return str;
  return str.replace(/\u0000/g, "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
}

const sanitizedRawText = sanitize(rawText);

const docId = "pi-" + Math.random().toString(36).slice(2, 18);

const payload = {
  doc_id: docId,
  file_name: fileName,
  file_url: fileUrl,
  raw_text: rawText,
  tree: tree,
  tree_node_count: tree.length,
  status: "completed"
};

const response = await fetch(supabaseUrl + "/rest/v1/documents", {
  method: "POST",
  headers: {
    "apikey": supabaseKey,
    "Authorization": "Bearer " + supabaseKey,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
  },
  body: JSON.stringify(payload)
});

const result = await response.json();

if (!response.ok) {
  const errorDetail = result?.message || result?.error || result?.hint || response.statusText;
  output = {
    success: false,
    status_code: response.status,
    response_text: response.statusText,
    error: errorDetail,
    doc_id: docId,
    file_name: fileName,
    tree_node_count: tree.length,
    status: "failed"
  };
  throw new Error(`Supabase write failed [${response.status}]: ${errorDetail}`);
}

output = {
  success: true,
  status_code: response.status,
  response_text: response.statusText,
  error: null,
  doc_id: result[0]?.doc_id || docId,
  file_name: fileName,
  tree_node_count: tree.length,
  status: "completed"
};
